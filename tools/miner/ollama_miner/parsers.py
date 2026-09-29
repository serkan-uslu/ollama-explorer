from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime

from bs4 import BeautifulSoup, Tag

from .models import Parameter, Variant

CAPABILITIES = {"audio", "code", "embedding", "thinking", "tools", "vision"}
SIZE_LABEL = re.compile(r"^(?:e?\d+(?:\.\d+)?[bm]|\d+(?:\.\d+)?x\d+(?:\.\d+)?b)$", re.I)


@dataclass(frozen=True)
class IndexEntry:
    slug: str
    name: str
    description: str
    source_url: str
    capabilities: tuple[str, ...]
    pulls: int | None
    tag_count: int
    source_updated_at: str | None
    parameter_sizes: tuple[str, ...]


@dataclass(frozen=True)
class DetailFields:
    description: str
    applications: tuple[str, ...]
    source_updated_at: str | None
    default_ref: str | None


def parse_pulls(value: str) -> int | None:
    cleaned = value.strip().upper().replace(",", "")
    match = re.fullmatch(r"([\d.]+)\s*([KMB]?)", cleaned)
    if not match:
        return None
    multiplier = {"": 1, "K": 1_000, "M": 1_000_000, "B": 1_000_000_000}
    return int(float(match.group(1)) * multiplier[match.group(2)])


def parse_utc_title(value: str | None) -> str | None:
    if not value or not value.endswith(" UTC"):
        return None
    try:
        parsed = datetime.strptime(value, "%b %d, %Y %I:%M %p UTC").replace(tzinfo=UTC)
    except ValueError:
        return None
    return parsed.isoformat().replace("+00:00", "Z")


def parse_parameter(value: str) -> Parameter | None:
    text = value.lower()

    dense_active = re.search(r"(?<![\w.])(\d+(?:\.\d+)?)b-a(\d+(?:\.\d+)?)b", text)
    if dense_active:
        return Parameter(
            raw=dense_active.group(0),
            total_billion=float(dense_active.group(1)),
            active_billion=float(dense_active.group(2)),
        )

    mixture = re.search(r"(?<![\w.])(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)b", text)
    if mixture:
        experts = float(mixture.group(1))
        per_expert = float(mixture.group(2))
        return Parameter(raw=mixture.group(0), total_billion=experts * per_expert)

    effective = re.search(r"(?<![\w.])e(\d+(?:\.\d+)?)b", text)
    if effective:
        return Parameter(raw=effective.group(0), active_billion=float(effective.group(1)))

    dense = re.search(r"(?<![\w.])(\d+(?:\.\d+)?)([bm])(?![\w.])", text)
    if dense:
        amount = float(dense.group(1))
        total = amount if dense.group(2) == "b" else amount / 1_000
        return Parameter(raw=dense.group(0), total_billion=total)
    return None


def parse_quantization(value: str) -> str | None:
    match = re.search(
        r"(?<![a-z0-9])((?:i?q\d+(?:_[a-z0-9]+)*)|(?:mx|nv)?fp\d+|(?:b?f\d+)|(?:int\d+))(?![a-z0-9])",
        value,
        re.I,
    )
    return match.group(1).upper() if match else None


def parse_size_bytes(value: str) -> int | None:
    match = re.fullmatch(r"\s*([\d.]+)\s*(KB|MB|GB|TB)\s*", value, re.I)
    if not match:
        return None
    exponent = {"KB": 1, "MB": 2, "GB": 3, "TB": 4}[match.group(2).upper()]
    return round(float(match.group(1)) * 1_000**exponent)


def parse_context_window(value: str) -> int | None:
    match = re.fullmatch(r"\s*([\d.]+)\s*([KMG]?)\s*", value, re.I)
    if not match:
        return None
    multiplier = {"": 1, "K": 1_000, "M": 1_000_000, "G": 1_000_000_000}
    return round(float(match.group(1)) * multiplier[match.group(2).upper()])


def _absolute_date(node: Tag) -> str | None:
    for element in node.select("[title]"):
        parsed = parse_utc_title(element.get("title"))
        if parsed:
            return parsed
    return None


def parse_library_html(html: str, base_url: str = "https://ollama.com") -> list[IndexEntry]:
    soup = BeautifulSoup(html, "html.parser")
    entries: list[IndexEntry] = []

    for link in soup.select("a[href^='/library/']"):
        href = str(link.get("href", ""))
        slug = href.removeprefix("/library/").strip("/")
        if not slug or ":" in slug or "/" in slug:
            continue
        name_node = link.select_one("h2")
        if not name_node:
            continue

        text = " ".join(link.get_text(" ", strip=True).split())
        labels = [
            badge.get_text(" ", strip=True).lower()
            for badge in link.select("span.inline-flex")
            if badge.get_text(" ", strip=True)
        ]
        capabilities = sorted({label for label in labels if label in CAPABILITIES})
        parameter_sizes = list(
            dict.fromkeys(label for label in labels if SIZE_LABEL.fullmatch(label))
        )
        pulls_match = re.search(r"([\d.,]+\s*[KMB]?)\s+Pulls?\b", text, re.I)
        tags_match = re.search(r"(\d+)\s+Tags?\b", text, re.I)
        description_node = link.select_one("p")

        entries.append(
            IndexEntry(
                slug=slug,
                name=name_node.get_text(" ", strip=True) or slug,
                description=(
                    description_node.get_text(" ", strip=True) if description_node else ""
                ),
                source_url=f"{base_url.rstrip('/')}/library/{slug}",
                capabilities=tuple(capabilities),
                pulls=parse_pulls(pulls_match.group(1)) if pulls_match else None,
                tag_count=int(tags_match.group(1)) if tags_match else 0,
                source_updated_at=_absolute_date(link),
                parameter_sizes=tuple(parameter_sizes),
            )
        )
    return entries


def parse_detail_html(html: str) -> DetailFields:
    soup = BeautifulSoup(html, "html.parser")
    description_node = soup.select_one("meta[name='description']")
    description = str(description_node.get("content", "")).strip() if description_node else ""

    applications: list[str] = []
    section = soup.select_one("#external-tools-section")
    if section:
        for image in section.select("img[alt]"):
            name = str(image.get("alt", "")).strip()
            if name and name not in applications:
                applications.append(name)

    default_ref = None
    command_nodes = soup.select("[data-panel='cli'] pre, [data-panel='cli'] code")
    for node in command_nodes:
        match = re.search(r"\bollama\s+run\s+([^\s;&|<>]+)", node.get_text(" ", strip=True))
        if match:
            default_ref = match.group(1).strip("\"'")
            break

    return DetailFields(
        description=description,
        applications=tuple(applications),
        source_updated_at=_absolute_date(soup),
        default_ref=default_ref,
    )


def parse_tags_html(html: str, slug: str, default_ref: str | None = None) -> list[Variant]:
    soup = BeautifulSoup(html, "html.parser")
    rows: dict[str, Tag] = {}
    prefix = f"/library/{slug}:"

    for link in soup.select(f"a[href^='{prefix}']"):
        href = str(link.get("href", ""))
        ref = href.removeprefix("/library/").strip("/")
        text = " ".join(link.get_text(" ", strip=True).split())
        if ref not in rows or ("context window" in text and "•" in text):
            rows[ref] = link

    normalized_default = None
    if default_ref == slug:
        normalized_default = f"{slug}:latest"
    elif default_ref and default_ref.startswith(f"{slug}:"):
        normalized_default = default_ref

    variants: list[Variant] = []
    for ref, link in rows.items():
        text = " ".join(link.get_text(" ", strip=True).split())
        tag = ref.split(":", 1)[1]
        digest_match = re.search(r"\b[a-f0-9]{12,64}\b", text, re.I)
        size_match = re.search(
            r"•\s*((?:[\d.]+\s*(?:KB|MB|GB|TB))|(?:(?:Low|Medium|High)\s+Usage))\s*•",
            text,
            re.I,
        )
        context_match = re.search(r"•\s*([\d.]+\s*[KMG]?)\s+context window", text, re.I)
        modalities_match = re.search(r"context window\s*•\s*([A-Za-z, ]+?)\s+input\s*•", text, re.I)
        size_text = size_match.group(1) if size_match else ""
        is_cloud = "usage" in size_text.lower() or "cloud" in tag.lower()
        modalities = (
            [part.strip().lower() for part in modalities_match.group(1).split(",")]
            if modalities_match
            else []
        )

        variants.append(
            Variant(
                ref=ref,
                tag=tag,
                digest=digest_match.group(0).lower() if digest_match else None,
                availability="cloud" if is_cloud else "local",
                download_size_bytes=None if is_cloud else parse_size_bytes(size_text),
                parameter=parse_parameter(tag),
                quantization=parse_quantization(tag),
                context_window=(
                    parse_context_window(context_match.group(1)) if context_match else None
                ),
                input_modalities=modalities,
                source_updated_at=None,
                is_default=ref == normalized_default,
            )
        )
    return sorted(variants, key=lambda variant: variant.tag)
