from __future__ import annotations

import json
import os
import tempfile
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

import httpx

from .models import (
    DERIVED_SUMMARY_FIELDS,
    Catalog,
    CatalogSource,
    ModelDetail,
    ModelSummary,
    Variant,
    VariantIndex,
    VariantIndexParameter,
    VariantIndexRecord,
    derive_variant_facets,
)
from .parsers import (
    DetailFields,
    IndexEntry,
    parse_detail_html,
    parse_library_html,
    parse_tags_html,
)


class MinerError(RuntimeError):
    """A failure that must stop publication."""


@dataclass
class Baseline:
    catalog: Catalog
    details: dict[str, ModelDetail]
    legacy_ids: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class DiffSummary:
    added: tuple[str, ...] = ()
    changed: tuple[str, ...] = ()
    unlisted: tuple[str, ...] = ()
    quarantined: tuple[str, ...] = ()
    preserved: tuple[str, ...] = ()

    @property
    def has_changes(self) -> bool:
        return bool(self.added or self.changed or self.unlisted)

    def markdown(self, total: int) -> str:
        def names(values: tuple[str, ...]) -> str:
            return ", ".join(f"`{value}`" for value in values) if values else "None"

        return (
            "## Ollama catalog update\n\n"
            f"- Published models: **{total}**\n"
            f"- Added ({len(self.added)}): {names(self.added)}\n"
            f"- Changed ({len(self.changed)}): {names(self.changed)}\n"
            f"- Unlisted ({len(self.unlisted)}): {names(self.unlisted)}\n"
            f"- Quarantined ({len(self.quarantined)}): {names(self.quarantined)}\n"
            f"- Preserved after fetch failure ({len(self.preserved)}): {names(self.preserved)}\n"
        )


def _summary(detail: ModelDetail) -> ModelSummary:
    return ModelSummary.model_validate(detail.model_dump(exclude={"variants"}))


def _iso_utc(value: Any) -> str | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def _variant_ref(slug: str, raw_tag: str) -> tuple[str, str]:
    value = raw_tag.strip()
    if ":" in value:
        prefix, tag = value.split(":", 1)
        if prefix == slug and tag:
            return value, tag
    tag = value or "latest"
    return f"{slug}:{tag}", tag


def _legacy_variants(model: dict[str, Any], slug: str, capabilities: list[str]) -> list[Variant]:
    from .parsers import parse_parameter, parse_quantization

    variants: dict[str, Variant] = {}
    modalities = ["text"]
    if "vision" in capabilities:
        modalities.append("image")
    if "audio" in capabilities:
        modalities.append("audio")

    for row in model.get("memory_requirements") or []:
        if not isinstance(row, dict):
            continue
        ref, tag = _variant_ref(slug, str(row.get("tag") or "latest"))
        if tag in variants:
            continue
        size_gb = row.get("size_gb")
        try:
            parsed_size = float(size_gb) if size_gb is not None else 0
            size_bytes = round(parsed_size * 1_000_000_000) if parsed_size > 0 else None
        except (TypeError, ValueError):
            size_bytes = None
        try:
            context = int(row["context_window"]) if row.get("context_window") else None
        except (TypeError, ValueError):
            context = None
        parameter = parse_parameter(tag)
        if parameter is None and tag == "latest" and len(model.get("labels") or []) == 1:
            parameter = parse_parameter(str(model["labels"][0]))
        is_cloud_variant = "cloud" in tag.lower()
        variants[tag] = Variant(
            ref=ref,
            tag=tag,
            availability="cloud" if is_cloud_variant else "local",
            download_size_bytes=None if is_cloud_variant else size_bytes,
            parameter=parameter,
            quantization=parse_quantization(tag),
            context_window=context,
            input_modalities=modalities,
            is_default=tag == "latest",
        )

    cloud = any(str(value).lower() == "cloud" for value in model.get("capabilities") or [])
    if cloud and not any(variant.availability == "cloud" for variant in variants.values()):
        variants["cloud"] = Variant(
            ref=f"{slug}:cloud",
            tag="cloud",
            availability="cloud",
            input_modalities=modalities,
            is_default=not variants,
        )
    if not variants:
        variants["latest"] = Variant(
            ref=f"{slug}:latest",
            tag="latest",
            availability="local",
            input_modalities=modalities,
            is_default=True,
        )
    return sorted(variants.values(), key=lambda variant: variant.tag)


def _derived_variants(
    variants: list[Variant],
) -> tuple[str, Variant | None, Variant | None, Variant | None]:
    local = [variant for variant in variants if variant.availability == "local"]
    cloud = [variant for variant in variants if variant.availability == "cloud"]
    availability = "both" if local and cloud else "local" if local else "cloud"
    default = next((variant for variant in variants if variant.is_default), None)
    sized_local = [variant for variant in local if variant.download_size_bytes is not None]
    smallest = min(
        sized_local,
        key=lambda variant: (variant.download_size_bytes or 0, variant.tag, variant.ref),
        default=None,
    )
    cloud_variant = (
        default
        if default is not None and default.availability == "cloud"
        else min(cloud, key=lambda variant: (variant.tag, variant.ref), default=None)
    )
    return availability, default, smallest, cloud_variant


def _detail(
    *,
    slug: str,
    name: str,
    description: str,
    source_url: str,
    status: str,
    capabilities: list[str],
    applications: list[str],
    pulls: int | None,
    tag_count: int,
    source_updated_at: str | None,
    parameter_sizes: list[str],
    variants: list[Variant],
    family: str | None = None,
    license_name: str | None = None,
) -> ModelDetail:
    availability, default, smallest, cloud_variant = _derived_variants(variants)
    facets = derive_variant_facets(capabilities, applications, variants)
    derived_parameter_sizes = [
        variant.parameter.raw for variant in variants if variant.parameter is not None
    ]
    return ModelDetail(
        slug=slug,
        name=name,
        description=description,
        source_url=source_url,
        status=status,
        availability=availability,
        capabilities=sorted(set(capabilities)),
        applications=sorted(set(applications)),
        pulls=pulls,
        tag_count=tag_count,
        source_updated_at=source_updated_at,
        parameter_sizes=list(dict.fromkeys([*parameter_sizes, *derived_parameter_sizes])),
        min_download_size_bytes=min(
            (
                variant.download_size_bytes
                for variant in variants
                if variant.availability == "local" and variant.download_size_bytes is not None
            ),
            default=None,
        ),
        **facets,
        max_context_window=max(
            (variant.context_window for variant in variants if variant.context_window is not None),
            default=None,
        ),
        default_variant=default,
        smallest_local_variant=smallest,
        cloud_variant=cloud_variant,
        family=family,
        license=license_name,
        variants=variants,
    )


def migrate_legacy(legacy_path: Path) -> Baseline:
    try:
        raw = json.loads(legacy_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise MinerError(f"cannot read legacy catalog: {error}") from error
    if not isinstance(raw, list) or not raw:
        raise MinerError("legacy catalog must be a non-empty array")

    details: dict[str, ModelDetail] = {}
    legacy_ids: dict[str, str] = {}
    timestamps: list[str] = []
    for model in raw:
        if not isinstance(model, dict):
            raise MinerError("legacy catalog contains a non-object record")
        slug = str(model.get("model_identifier") or "").strip().lower()
        if not slug or slug in details:
            raise MinerError(f"invalid or duplicate legacy slug: {slug!r}")
        old_id = str(model.get("id") or "").strip()
        if old_id:
            legacy_ids[old_id] = slug
        timestamp = _iso_utc(model.get("timestamp"))
        if timestamp:
            timestamps.append(timestamp)

        capabilities = sorted(
            {
                str(value).strip().lower()
                for value in model.get("capabilities") or []
                if str(value).strip().lower() not in {"", "cloud"}
            }
        )
        variants = _legacy_variants(model, slug, capabilities)
        applications = [
            str(value.get("name")).strip()
            for value in model.get("applications") or []
            if isinstance(value, dict) and value.get("name")
        ]
        details[slug] = _detail(
            slug=slug,
            name=str(model.get("model_name") or slug).strip(),
            description=str(model.get("description") or "").strip(),
            source_url=str(model.get("url") or f"https://ollama.com/library/{slug}"),
            status="active",
            capabilities=capabilities,
            applications=applications,
            pulls=max(int(model.get("pulls") or 0), 0),
            tag_count=max(int(model.get("tags") or 0), 0),
            source_updated_at=None,
            parameter_sizes=[str(value).lower() for value in model.get("labels") or []],
            variants=variants,
        )

    generated_at = max(timestamps) if timestamps else "1970-01-01T00:00:00Z"
    summaries = sorted(
        (_summary(detail) for detail in details.values()),
        key=lambda model: (-(model.pulls or 0), model.slug),
    )
    catalog = Catalog(
        generated_at=generated_at,
        source=CatalogSource(
            url="https://ollama.com/library?sort=popular",
            model_count=len(summaries),
        ),
        models=summaries,
    )
    validate_candidate(catalog, details)
    return Baseline(catalog=catalog, details=details, legacy_ids=legacy_ids)


def load_baseline(repo_root: Path) -> Baseline:
    data_dir = repo_root / "public" / "data"
    catalog_path = data_dir / "catalog.json"
    if not catalog_path.exists():
        raise MinerError("missing v2 baseline; import a legacy file explicitly first")

    try:
        raw_catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        catalog = Catalog.model_validate(raw_catalog)
        legacy_path = data_dir / "legacy-id-map.json"
        legacy_ids = (
            json.loads(legacy_path.read_text(encoding="utf-8")) if legacy_path.exists() else {}
        )
        variant_index_path = data_dir / "variant-index.json"
        variant_index = (
            VariantIndex.model_validate_json(variant_index_path.read_text(encoding="utf-8"))
            if variant_index_path.exists()
            else None
        )
        details: dict[str, ModelDetail] = {}
        for summary in catalog.models:
            detail_path = data_dir / "models" / f"{summary.slug}.json"
            details[summary.slug] = ModelDetail.model_validate_json(
                detail_path.read_text(encoding="utf-8")
            )
        upgraded_summaries: list[ModelSummary] = []
        for raw_summary, summary in zip(raw_catalog.get("models", []), catalog.models, strict=True):
            data = summary.model_dump()
            derived = _summary(details[summary.slug])
            for field in DERIVED_SUMMARY_FIELDS - raw_summary.keys():
                data[field] = getattr(derived, field)
            upgraded_summaries.append(ModelSummary.model_validate(data))
        catalog.models = upgraded_summaries
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise MinerError(f"invalid v2 baseline: {error}") from error
    validate_candidate(catalog, details)
    if variant_index is not None:
        validate_variant_index(variant_index, catalog, details)
    return Baseline(catalog=catalog, details=details, legacy_ids=legacy_ids)


def _source_unchanged(entry: IndexEntry, previous: ModelDetail) -> bool:
    return (
        entry.name == previous.name
        and entry.description == previous.description
        and entry.source_url == previous.source_url
        and list(entry.capabilities) == previous.capabilities
        and entry.tag_count == previous.tag_count
        and entry.source_updated_at == previous.source_updated_at
        and set(entry.parameter_sizes).issubset(previous.parameter_sizes)
    )


def _reuse(entry: IndexEntry, previous: ModelDetail) -> ModelDetail:
    data = previous.model_dump()
    data.update(status="active", pulls=entry.pulls)
    return ModelDetail.model_validate(data)


def _from_live(entry: IndexEntry, detail: DetailFields, variants: list[Variant]) -> ModelDetail:
    return _detail(
        slug=entry.slug,
        name=entry.name,
        description=detail.description or entry.description,
        source_url=entry.source_url,
        status="active",
        capabilities=list(entry.capabilities),
        applications=list(detail.applications),
        pulls=entry.pulls,
        tag_count=entry.tag_count,
        source_updated_at=detail.source_updated_at or entry.source_updated_at,
        parameter_sizes=list(entry.parameter_sizes),
        variants=variants,
    )


def validate_source_count(live_count: int, baseline: Catalog, max_drop_percent: float) -> None:
    if live_count <= 0:
        raise MinerError("source returned an empty catalog")
    previous = baseline.source.model_count
    if previous and live_count < previous * (1 - max_drop_percent / 100):
        drop = (previous - live_count) / previous * 100
        raise MinerError(
            f"source model count dropped {drop:.1f}% ({previous} -> {live_count}); refusing publish"
        )


def validate_candidate(catalog: Catalog, details: dict[str, ModelDetail]) -> None:
    summary_slugs = {model.slug for model in catalog.models}
    if summary_slugs != set(details):
        missing = sorted(summary_slugs - set(details))
        extra = sorted(set(details) - summary_slugs)
        raise MinerError(f"catalog/detail mismatch; missing={missing}, extra={extra}")
    for summary in catalog.models:
        if _summary(details[summary.slug]) != summary:
            raise MinerError(f"summary/detail mismatch for {summary.slug}")
    build_variant_index(catalog, details)


def _variant_index_record(variant: Variant) -> VariantIndexRecord:
    parameter = (
        VariantIndexParameter(
            raw=variant.parameter.raw,
            total_billion=variant.parameter.total_billion,
        )
        if variant.parameter is not None
        else None
    )
    return VariantIndexRecord(
        ref=variant.ref,
        tag=variant.tag,
        availability=variant.availability,
        download_size_bytes=variant.download_size_bytes,
        parameter=parameter,
        quantization=variant.quantization,
        context_window=variant.context_window,
        input_modalities=sorted(set(variant.input_modalities)),
        is_default=variant.is_default,
    )


def build_variant_index(catalog: Catalog, details: dict[str, ModelDetail]) -> VariantIndex:
    active_slugs = sorted(model.slug for model in catalog.models if model.status == "active")
    models = {
        slug: sorted(
            (_variant_index_record(variant) for variant in details[slug].variants),
            key=lambda variant: variant.ref,
        )
        for slug in active_slugs
    }
    index = VariantIndex(generated_at=catalog.generated_at, models=models)
    validate_variant_index(index, catalog, details)
    return index


def validate_variant_index(
    index: VariantIndex, catalog: Catalog, details: dict[str, ModelDetail]
) -> None:
    active_slugs = sorted(model.slug for model in catalog.models if model.status == "active")
    if index.generated_at != catalog.generated_at:
        raise MinerError("variant index generation time must match the catalog")
    if list(index.models) != active_slugs:
        raise MinerError("variant index must contain every active model and no unlisted models")
    for slug in active_slugs:
        expected = sorted(
            (_variant_index_record(variant) for variant in details[slug].variants),
            key=lambda variant: variant.ref,
        )
        if index.models[slug] != expected:
            raise MinerError(f"variant index coverage mismatch for {slug}")


def _semantic_diff(
    before: Catalog,
    after: Catalog,
    before_details: dict[str, ModelDetail],
    after_details: dict[str, ModelDetail],
    quarantined: list[str],
    preserved: list[str],
) -> DiffSummary:
    old = {model.slug: model for model in before.models}
    new = {model.slug: model for model in after.models}
    added = sorted(set(new) - set(old))
    unlisted = sorted(
        slug
        for slug in old.keys() & new.keys()
        if old[slug].status == "active" and new[slug].status == "unlisted"
    )
    changed = sorted(
        slug
        for slug in old.keys() & new.keys()
        if (old[slug] != new[slug] or before_details[slug] != after_details[slug])
        and slug not in unlisted
    )
    return DiffSummary(
        added=tuple(added),
        changed=tuple(changed),
        unlisted=tuple(unlisted),
        quarantined=tuple(sorted(quarantined)),
        preserved=tuple(sorted(preserved)),
    )


def refresh_catalog(
    *,
    index_html: str,
    fetch_html: Callable[[str], str],
    baseline: Baseline,
    source_url: str,
    base_url: str,
    max_drop_percent: float = 10,
    force_refresh: bool = False,
) -> tuple[Baseline, DiffSummary]:
    entries = parse_library_html(index_html, base_url)
    slugs = [entry.slug for entry in entries]
    if len(slugs) != len(set(slugs)):
        raise MinerError("source returned duplicate model slugs")
    validate_source_count(len(entries), baseline.catalog, max_drop_percent)

    previous = baseline.details
    details: dict[str, ModelDetail] = {}
    quarantined: list[str] = []
    preserved: list[str] = []

    for entry in entries:
        old = previous.get(entry.slug)
        if old and not force_refresh and _source_unchanged(entry, old):
            details[entry.slug] = _reuse(entry, old)
            continue
        try:
            detail_html = fetch_html(entry.source_url)
            tags_html = fetch_html(f"{entry.source_url}/tags")
            parsed_detail = parse_detail_html(detail_html)
            variants = parse_tags_html(tags_html, entry.slug, parsed_detail.default_ref)
            if not variants:
                raise MinerError("tag page contained no variants")
            details[entry.slug] = _from_live(entry, parsed_detail, variants)
        except (httpx.HTTPError, MinerError, ValueError) as error:
            if old:
                details[entry.slug] = _reuse(entry, old)
                preserved.append(f"{entry.slug} ({error})")
            else:
                quarantined.append(f"{entry.slug} ({error})")

    live_slugs = set(slugs)
    for slug, old in previous.items():
        if slug in live_slugs:
            continue
        data = old.model_dump()
        data["status"] = "unlisted"
        details[slug] = ModelDetail.model_validate(data)

    summaries = sorted(
        (_summary(detail) for detail in details.values()),
        key=lambda model: (model.status == "unlisted", -(model.pulls or 0), model.slug),
    )
    if not any(model.status == "active" for model in summaries):
        raise MinerError("candidate catalog contains no active models")
    candidate = Catalog(
        generated_at=baseline.catalog.generated_at,
        source=CatalogSource(url=source_url, model_count=len(entries)),
        models=summaries,
    )
    validate_candidate(candidate, details)
    diff = _semantic_diff(
        baseline.catalog,
        candidate,
        baseline.details,
        details,
        quarantined,
        preserved,
    )
    if diff.has_changes or candidate.source != baseline.catalog.source or details != previous:
        candidate.generated_at = _now()
    return Baseline(candidate, details, baseline.legacy_ids), diff


class HttpFetcher:
    def __init__(
        self,
        *,
        delay: float,
        timeout: float,
        user_agent: str,
        token: str | None = None,
        max_retries: int = 3,
        retry_backoff: float = 1,
        max_retry_delay: float = 60,
        sleep: Callable[[float], None] = time.sleep,
        monotonic: Callable[[], float] = time.monotonic,
    ) -> None:
        headers = {"User-Agent": user_agent}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self.client = httpx.Client(headers=headers, follow_redirects=True, timeout=timeout)
        self.delay = max(delay, 0)
        self.max_retries = max(max_retries, 0)
        self.retry_backoff = max(retry_backoff, 0)
        self.max_retry_delay = max(max_retry_delay, 0)
        self.sleep = sleep
        self.monotonic = monotonic
        self.last_request: float | None = None

    def __enter__(self) -> HttpFetcher:
        return self

    def __exit__(self, *_: object) -> None:
        self.client.close()

    def _wait_for_rate_limit(self) -> None:
        if self.last_request is None:
            return
        wait = self.delay - (self.monotonic() - self.last_request)
        if wait > 0:
            self.sleep(wait)

    def _retry_after(self, response: httpx.Response) -> float | None:
        raw = response.headers.get("Retry-After")
        if not raw:
            return None
        try:
            return max(float(raw), 0)
        except ValueError:
            pass
        try:
            retry_at = parsedate_to_datetime(raw)
        except (TypeError, ValueError, OverflowError):
            return None
        if retry_at.tzinfo is None:
            retry_at = retry_at.replace(tzinfo=UTC)
        return max((retry_at.astimezone(UTC) - datetime.now(UTC)).total_seconds(), 0)

    def _retry_delay(self, attempt: int, response: httpx.Response | None = None) -> float:
        retry_after = self._retry_after(response) if response is not None else None
        delay = retry_after if retry_after is not None else self.retry_backoff * (2**attempt)
        return min(delay, self.max_retry_delay)

    def __call__(self, url: str) -> str:
        for attempt in range(self.max_retries + 1):
            self._wait_for_rate_limit()
            try:
                response = self.client.get(url)
            except httpx.TransportError:
                self.last_request = self.monotonic()
                if attempt >= self.max_retries:
                    raise
                self.sleep(self._retry_delay(attempt))
                continue

            self.last_request = self.monotonic()
            retryable_status = response.status_code == 429 or 500 <= response.status_code <= 599
            if retryable_status and attempt < self.max_retries:
                self.sleep(self._retry_delay(attempt, response))
                continue
            response.raise_for_status()
            return response.text

        raise AssertionError("retry loop exhausted without returning or raising")


def crawl(
    *,
    repo_root: Path,
    base_url: str = "https://ollama.com",
    delay: float = 0.5,
    timeout: float = 30,
    user_agent: str = "ollama-explorer-catalog/2.0",
    token: str | None = None,
    max_drop_percent: float = 10,
    force_refresh: bool = False,
    max_retries: int = 3,
    retry_backoff: float = 1,
    max_retry_delay: float = 60,
) -> tuple[Baseline, DiffSummary]:
    baseline = load_baseline(repo_root)
    source_url = f"{base_url.rstrip('/')}/library?sort=popular"
    with HttpFetcher(
        delay=delay,
        timeout=timeout,
        user_agent=user_agent,
        token=token,
        max_retries=max_retries,
        retry_backoff=retry_backoff,
        max_retry_delay=max_retry_delay,
    ) as fetch:
        index_html = fetch(source_url)
        return refresh_catalog(
            index_html=index_html,
            fetch_html=fetch,
            baseline=baseline,
            source_url=source_url,
            base_url=base_url,
            max_drop_percent=max_drop_percent,
            force_refresh=force_refresh,
        )


def _json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def _compact_json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode()


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_bytes() == content:
        return
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
    except BaseException:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass
        raise


def write_baseline(repo_root: Path, baseline: Baseline) -> None:
    validate_candidate(baseline.catalog, baseline.details)
    variant_index = build_variant_index(baseline.catalog, baseline.details)
    data_dir = repo_root / "public" / "data"
    # Details are committed before the manifest, so catalog.json never references a missing file.
    for slug in sorted(baseline.details):
        _atomic_write(
            data_dir / "models" / f"{slug}.json",
            _json_bytes(baseline.details[slug].model_dump(mode="json")),
        )
    _atomic_write(
        data_dir / "legacy-id-map.json",
        _json_bytes(dict(sorted(baseline.legacy_ids.items()))),
    )
    _atomic_write(
        data_dir / "variant-index.json",
        _compact_json_bytes(variant_index.model_dump(mode="json")),
    )
    _atomic_write(
        data_dir / "catalog.json",
        _json_bytes(baseline.catalog.model_dump(mode="json")),
    )
