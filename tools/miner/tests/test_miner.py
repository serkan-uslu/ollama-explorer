from __future__ import annotations

import json
from pathlib import Path

import httpx
import pytest
from pydantic import ValidationError

from ollama_miner.catalog import (
    Baseline,
    MinerError,
    build_variant_index,
    load_baseline,
    migrate_legacy,
    refresh_catalog,
    validate_source_count,
    validate_variant_index,
    write_baseline,
)
from ollama_miner.models import (
    Catalog,
    CatalogSource,
    ModelDetail,
    ModelSummary,
    Variant,
    VariantIndex,
    VariantIndexRecord,
)
from ollama_miner.parsers import (
    parse_context_window,
    parse_detail_html,
    parse_library_html,
    parse_parameter,
    parse_quantization,
    parse_size_bytes,
    parse_tags_html,
)

INDEX_HTML = """
<html><body>
  <a class="group" href="/library/example">
    <div title="example"><h2>example</h2><p>Description says Updated safely.</p></div>
    <span class="inline-flex">tools</span><span class="inline-flex">8b</span>
    <span>1.2M</span><span>Pulls</span><span>1</span><span>Tag</span>
    <span title="Sep 22, 2026 8:28 PM UTC">Updated 6 days ago</span>
  </a>
</body></html>
"""

DETAIL_HTML = """
<html><head><meta name="description" content="Trusted description"></head><body>
  <span title="Sep 22, 2026 8:28 PM UTC">Updated 6 days ago</span>
  <div data-panel="cli"><pre>ollama run example:8x7b-q4_K_M</pre></div>
  <section id="external-tools-section">
    <h2>Applications</h2>
    <img alt="Claude Code"><code>ollama launch claude --model example</code>
    <img alt="OpenCode"><code>ollama launch opencode --model example</code>
  </section>
</body></html>
"""

TAGS_HTML = """
<html><body>
  <div class="group px-4 py-3">
    <a class="md:hidden" href="/library/example:latest">
      example:latest <span>abc123abc123</span> • 4.9GB • 128K context window •
      Text, Image input • 1 day ago
    </a>
    <a href="/library/example:latest">example:latest</a>
  </div>
  <a class="md:hidden" href="/library/example:8x7b-q4_K_M">
    example:8x7b-q4_K_M def456def456 • 26GB • 32K context window • Text input • 1 day ago
  </a>
  <a class="md:hidden" href="/library/example:audio-270m">
    example:audio-270m 123abc123abc • 274MB • 2K context window • Text, Audio input •
  </a>
  <a class="md:hidden" href="/library/example:mlx-4b">
    example:mlx-4b 456def456def • 2.5GB • 8K context window • Text input •
  </a>
  <a class="md:hidden" href="/library/example:cloud">
    example:cloud aaa111aaa111 • Low Usage • 256K context window • Text, Image input •
  </a>
  <a class="md:hidden" href="/library/example:20b-mxfp8">
    example:20b-mxfp8 bbb222bbb222 • 21GB • 32K context window • Text input •
  </a>
  <a class="md:hidden" href="/library/example:70b-nvfp4">
    example:70b-nvfp4 ccc333ccc333 • 36GB • 64K context window • Text input •
  </a>
  <a href="/library/example:experimental">example:experimental</a>
</body></html>
"""

FIXTURES = Path(__file__).with_name("fixtures")


def fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def local_variant(slug: str = "example") -> Variant:
    return Variant(
        ref=f"{slug}:latest",
        tag="latest",
        availability="local",
        download_size_bytes=4_900_000_000,
        context_window=128_000,
        input_modalities=["text"],
        is_default=True,
    )


def detail(
    slug: str = "example", description: str = "Description says Updated safely."
) -> ModelDetail:
    variant = local_variant(slug)
    return ModelDetail(
        slug=slug,
        name=slug,
        description=description,
        source_url=f"https://ollama.com/library/{slug}",
        status="active",
        availability="local",
        capabilities=["tools"],
        applications=[],
        pulls=1_200_000,
        tag_count=1,
        source_updated_at="2026-09-22T20:28:00Z",
        parameter_sizes=["8b"],
        min_download_size_bytes=4_900_000_000,
        max_context_window=128_000,
        default_variant=variant,
        smallest_local_variant=variant,
        family=None,
        license=None,
        variants=[variant],
    )


def baseline(models: list[ModelDetail] | None = None) -> Baseline:
    details = {model.slug: model for model in (models or [detail()])}
    summaries = [
        ModelSummary.model_validate(model.model_dump(exclude={"variants"}))
        for model in details.values()
    ]
    return Baseline(
        catalog=Catalog(
            generated_at="2026-09-22T20:28:00Z",
            source=CatalogSource(
                url="https://ollama.com/library?sort=popular", model_count=len(summaries)
            ),
            models=summaries,
        ),
        details=details,
        legacy_ids={"old-id": summaries[0].slug},
    )


def test_library_parser_uses_singular_tag_and_absolute_utc_title() -> None:
    models = parse_library_html(INDEX_HTML)
    assert len(models) == 1
    assert models[0].slug == "example"
    assert models[0].description == "Description says Updated safely."
    assert models[0].pulls == 1_200_000
    assert models[0].tag_count == 1
    assert models[0].capabilities == ("tools",)
    assert models[0].parameter_sizes == ("8b",)
    assert models[0].source_updated_at == "2026-09-22T20:28:00Z"


def test_library_parser_matches_sanitized_ollama_snapshot() -> None:
    models = {
        model.slug: model for model in parse_library_html(fixture("library-popular.snapshot.html"))
    }

    cloud_only = models["minimax-m2.7"]
    assert cloud_only.pulls == 2_400_000
    assert cloud_only.tag_count == 1
    assert cloud_only.capabilities == ("thinking", "tools")
    assert cloud_only.source_updated_at == "2026-03-18T18:05:00Z"

    updated_description = models["mistral"]
    assert updated_description.description.endswith("updated to version 0.3.")
    assert updated_description.parameter_sizes == ("7b",)
    assert updated_description.source_updated_at == "2025-07-13T00:56:00Z"


def test_duplicate_library_slugs_reach_the_fail_closed_gate() -> None:
    duplicate = INDEX_HTML.replace("</body>", INDEX_HTML.split("<body>", 1)[1])
    with pytest.raises(MinerError, match="duplicate"):
        refresh_catalog(
            index_html=duplicate,
            fetch_html=lambda _: TAGS_HTML,
            baseline=baseline(),
            source_url="https://ollama.com/library?sort=popular",
            base_url="https://ollama.com",
        )


def test_detail_parser_keeps_only_structured_source_fields() -> None:
    parsed = parse_detail_html(DETAIL_HTML)
    assert parsed.description == "Trusted description"
    assert parsed.applications == ("Claude Code", "OpenCode")
    assert parsed.source_updated_at == "2026-09-22T20:28:00Z"
    assert parsed.default_ref == "example:8x7b-q4_K_M"


def test_detail_parser_matches_sanitized_ollama_snapshot() -> None:
    parsed = parse_detail_html(fixture("model-detail.snapshot.html"))

    assert parsed.description.startswith("A set of Mixture of Experts")
    assert parsed.applications == ("Claude Code", "OpenCode")
    assert parsed.source_updated_at == "2024-12-20T08:27:00Z"
    assert parsed.default_ref == "mixtral"


def test_tag_parser_handles_local_cloud_audio_and_mlx() -> None:
    default_ref = parse_detail_html(DETAIL_HTML).default_ref
    variants = {
        variant.tag: variant for variant in parse_tags_html(TAGS_HTML, "example", default_ref)
    }
    assert set(variants) == {
        "latest",
        "8x7b-q4_K_M",
        "audio-270m",
        "mlx-4b",
        "cloud",
        "20b-mxfp8",
        "70b-nvfp4",
        "experimental",
    }
    assert not variants["latest"].is_default
    assert variants["8x7b-q4_K_M"].is_default
    assert variants["latest"].input_modalities == ["text", "image"]
    assert variants["cloud"].availability == "cloud"
    assert variants["cloud"].download_size_bytes is None
    assert variants["audio-270m"].input_modalities == ["text", "audio"]
    assert variants["audio-270m"].parameter.total_billion == 0.27
    assert variants["mlx-4b"].quantization is None
    assert variants["8x7b-q4_K_M"].parameter.total_billion == 56
    assert variants["8x7b-q4_K_M"].quantization == "Q4_K_M"
    assert variants["20b-mxfp8"].quantization == "MXFP8"
    assert variants["70b-nvfp4"].quantization == "NVFP4"
    assert variants["experimental"].download_size_bytes is None
    assert variants["experimental"].context_window is None
    assert variants["experimental"].input_modalities == []


def test_tag_parser_matches_local_and_cloud_ollama_snapshot() -> None:
    variants = {
        variant.tag: variant
        for variant in parse_tags_html(
            fixture("tags-local-cloud.snapshot.html"), "gemma4", "gemma4:e2b"
        )
    }

    assert set(variants) == {"e2b", "12b-mlx", "31b-cloud"}
    assert variants["e2b"].is_default
    assert variants["e2b"].parameter.active_billion == 2
    assert variants["e2b"].download_size_bytes == 7_200_000_000
    assert variants["12b-mlx"].availability == "local"
    assert variants["12b-mlx"].parameter.total_billion == 12
    assert variants["12b-mlx"].quantization is None
    assert variants["31b-cloud"].availability == "cloud"
    assert variants["31b-cloud"].download_size_bytes is None


def test_tag_parser_matches_cloud_only_ollama_snapshot() -> None:
    variants = parse_tags_html(
        fixture("tags-cloud-only.snapshot.html"), "minimax-m2.7", "minimax-m2.7:cloud"
    )

    assert len(variants) == 1
    assert variants[0].is_default
    assert variants[0].availability == "cloud"
    assert variants[0].download_size_bytes is None
    assert variants[0].context_window == 200_000
    assert variants[0].input_modalities == ["text"]


def test_tag_parser_matches_parameter_and_audio_ollama_snapshots() -> None:
    html = fixture("tags-parameters-audio.snapshot.html")
    functiongemma = parse_tags_html(html, "functiongemma")[0]
    mixtral = parse_tags_html(html, "mixtral")[0]
    audio = parse_tags_html(html, "audio-snapshot")[0]

    assert functiongemma.tag == "270m"
    assert functiongemma.parameter.total_billion == 0.27
    assert functiongemma.download_size_bytes == 301_000_000
    assert mixtral.tag == "8x7b"
    assert mixtral.parameter.total_billion == 56
    assert mixtral.download_size_bytes == 26_000_000_000
    assert audio.input_modalities == ["text", "audio"]
    assert audio.context_window == 2_000


def test_tag_parser_does_not_invent_a_default_without_an_official_command() -> None:
    assert not any(variant.is_default for variant in parse_tags_html(TAGS_HTML, "example"))
    bare_default = parse_tags_html(TAGS_HTML, "example", "example")
    assert [variant.ref for variant in bare_default if variant.is_default] == ["example:latest"]


@pytest.mark.parametrize(
    ("value", "total", "active"),
    [
        ("270m", 0.27, None),
        ("1b", 1, None),
        ("8x7b", 56, None),
        ("e2b", None, 2),
        ("30b-a3b", 30, 3),
    ],
)
def test_parameter_parser(value: str, total: float | None, active: float | None) -> None:
    parsed = parse_parameter(value)
    assert parsed is not None
    assert parsed.total_billion == total
    assert parsed.active_billion == active


def test_source_units_are_decimal() -> None:
    assert parse_size_bytes("274MB") == 274_000_000
    assert parse_size_bytes("4.9GB") == 4_900_000_000
    assert parse_context_window("128K") == 128_000
    assert parse_quantization("137m-v1.5-fp16") == "FP16"


def test_duplicate_variants_are_rejected() -> None:
    model = detail().model_dump()
    model["variants"] = [local_variant(), local_variant()]
    with pytest.raises(ValidationError, match="unique"):
        ModelDetail.model_validate(model)


def test_active_detail_rejects_inconsistent_derived_fields() -> None:
    model = detail().model_dump()
    model["tag_count"] = 0
    with pytest.raises(ValidationError, match="tag_count"):
        ModelDetail.model_validate(model)

    model = detail().model_dump()
    model["variants"] = []
    model["default_variant"] = None
    model["smallest_local_variant"] = None
    model["min_download_size_bytes"] = None
    model["max_context_window"] = None
    with pytest.raises(ValidationError, match="at least one variant"):
        ModelDetail.model_validate(model)


def test_summary_rejects_noncanonical_facets_and_variant_counts() -> None:
    model = detail().model_dump(exclude={"variants"})
    model["categories"] = ["tools", "chat"]
    with pytest.raises(ValidationError, match="canonical order"):
        ModelSummary.model_validate(model)

    model = detail().model_dump(exclude={"variants"})
    model["local_variant_count"] = 2
    with pytest.raises(ValidationError, match="tag_count"):
        ModelSummary.model_validate(model)


@pytest.mark.parametrize(
    ("field", "value", "message"),
    [
        ("availability", "cloud", "availability"),
        ("default_variant", None, "default_variant"),
        ("smallest_local_variant", None, "smallest_local_variant"),
        ("min_download_size_bytes", 1, "min_download_size_bytes"),
        ("max_download_size_bytes", 1, "max_download_size_bytes"),
        ("max_context_window", 1, "max_context_window"),
        ("categories", ["audio"], "categories"),
        ("input_modalities", [], "input_modalities"),
        ("quantizations", ["Q4_K_M"], "quantizations"),
        ("local_variant_count", 0, "local_variant_count"),
        ("cloud_variant_count", 1, "cloud_variant_count"),
    ],
)
def test_detail_rejects_incorrect_derived_values(field: str, value: object, message: str) -> None:
    model = detail().model_dump()
    model[field] = value
    with pytest.raises(ValidationError, match=message):
        ModelDetail.model_validate(model)


def test_zero_download_size_is_unknown_not_a_tiny_model() -> None:
    with pytest.raises(ValidationError, match="greater than 0"):
        Variant(ref="example:zero", tag="zero", availability="local", download_size_bytes=0)


def test_missing_v2_baseline_fails_closed_instead_of_reading_public_legacy_data(
    tmp_path: Path,
) -> None:
    with pytest.raises(MinerError, match="missing v2 baseline"):
        load_baseline(tmp_path)


def test_legacy_migration_is_deterministic_and_omits_untrusted_fields(tmp_path: Path) -> None:
    legacy = [
        {
            "id": "uuid-1",
            "model_identifier": "example",
            "model_name": "Example",
            "url": "https://ollama.com/library/example",
            "description": "Source description",
            "readme": "must not ship",
            "capabilities": ["Vision", "Cloud"],
            "labels": ["8b"],
            "applications": [{"name": "OpenCode", "launch_command": "ignored"}],
            "memory_requirements": [
                {
                    "tag": "example:latest",
                    "size_gb": 4.9,
                    "context_window": 128000,
                    "quantization": "fabricated-default",
                }
            ],
            "pulls": 10,
            "tags": 2,
            "timestamp": "2026-02-26T23:04:00.137222",
            "speed_tier": "fast",
            "complexity": "beginner",
            "strengths": ["invented"],
            "benchmark_scores": [{"name": "invented"}],
        }
    ]
    path = tmp_path / "models.json"
    path.write_text(json.dumps(legacy), encoding="utf-8")

    first = migrate_legacy(path)
    second = migrate_legacy(path)
    assert first == second
    assert first.legacy_ids == {"uuid-1": "example"}
    assert first.catalog.generated_at == "2026-02-26T23:04:00.137222Z"
    assert first.details["example"].availability == "both"
    assert first.details["example"].license is None
    exported = json.dumps(first.details["example"].model_dump())
    for forbidden in ("readme", "speed_tier", "complexity", "strengths", "benchmark"):
        assert forbidden not in exported


def test_unchanged_source_is_a_deterministic_no_op() -> None:
    current = baseline()

    def must_not_fetch(_: str) -> str:
        raise AssertionError("unchanged model should not be fetched")

    candidate, diff = refresh_catalog(
        index_html=INDEX_HTML,
        fetch_html=must_not_fetch,
        baseline=current,
        source_url=current.catalog.source.url,
        base_url="https://ollama.com",
    )
    assert candidate == current
    assert not diff.has_changes


def test_new_fetch_failure_is_quarantined() -> None:
    current = baseline()
    new_index = INDEX_HTML.replace(
        "</body>",
        """
        <a href="/library/new-model"><h2>new-model</h2><p>New</p>
        <span class="inline-flex">1b</span><span>1 Pull</span><span>1 Tag</span>
        </a></body>
        """,
    )

    def fail(_: str) -> str:
        raise httpx.ConnectError("offline")

    candidate, diff = refresh_catalog(
        index_html=new_index,
        fetch_html=fail,
        baseline=current,
        source_url=current.catalog.source.url,
        base_url="https://ollama.com",
    )
    assert "new-model" not in candidate.details
    assert any(value.startswith("new-model ") for value in diff.quarantined)


def test_quarantined_replacements_cannot_publish_an_all_unlisted_catalog() -> None:
    current = baseline([detail(f"old-{index}") for index in range(10)])
    new_index = (
        "<html><body>"
        + "".join(
            f"""
        <a href="/library/new-{index}"><h2>new-{index}</h2><p>New</p>
        <span class="inline-flex">1b</span><span>1 Pull</span><span>1 Tag</span></a>
        """
            for index in range(9)
        )
        + "</body></html>"
    )

    def fail(_: str) -> str:
        raise httpx.ConnectError("offline")

    with pytest.raises(MinerError, match="no active models"):
        refresh_catalog(
            index_html=new_index,
            fetch_html=fail,
            baseline=current,
            source_url=current.catalog.source.url,
            base_url="https://ollama.com",
        )


def test_existing_fetch_failure_preserves_last_good_detail() -> None:
    current = baseline()
    changed = INDEX_HTML.replace("Description says Updated safely.", "Changed description")

    def fail(_: str) -> str:
        raise httpx.ConnectError("offline")

    candidate, diff = refresh_catalog(
        index_html=changed,
        fetch_html=fail,
        baseline=current,
        source_url=current.catalog.source.url,
        base_url="https://ollama.com",
    )
    assert candidate.details["example"].description == current.details["example"].description
    assert any(value.startswith("example ") for value in diff.preserved)


def test_semantic_diff_includes_detail_only_variant_changes() -> None:
    current = baseline()
    detail_html = """
    <meta name="description" content="Description says Updated safely.">
    <span title="Sep 22, 2026 8:28 PM UTC">Updated</span>
    """
    tags_html = """
    <a href="/library/example:latest">
      example:latest • 4.9GB • 128K context window • Text input •
    </a>
    <a href="/library/example:70b">
      example:70b • 40GB • 128K context window • Text input •
    </a>
    """

    candidate, diff = refresh_catalog(
        index_html=INDEX_HTML.replace(
            "<span>1</span><span>Tag</span>", "<span>2</span><span>Tags</span>"
        ),
        fetch_html=lambda url: tags_html if url.endswith("/tags") else detail_html,
        baseline=current,
        source_url=current.catalog.source.url,
        base_url="https://ollama.com",
        force_refresh=True,
    )
    assert len(candidate.details["example"].variants) == 2
    assert diff.changed == ("example",)


def test_summary_derives_parameter_sizes_and_cloud_recommendation_from_variants() -> None:
    current = baseline()
    candidate, _ = refresh_catalog(
        index_html=INDEX_HTML.replace(
            "<span>1</span><span>Tag</span>", "<span>8</span><span>Tags</span>"
        ),
        fetch_html=lambda url: TAGS_HTML if url.endswith("/tags") else DETAIL_HTML,
        baseline=current,
        source_url=current.catalog.source.url,
        base_url="https://ollama.com",
        force_refresh=True,
    )
    model = candidate.details["example"]
    assert model.parameter_sizes == ["8b", "20b", "70b", "8x7b", "270m", "4b"]
    assert model.default_variant is not None
    assert model.default_variant.ref == "example:8x7b-q4_K_M"
    assert model.cloud_variant is not None
    assert model.cloud_variant.ref == "example:cloud"
    assert model.categories == ["chat", "coding", "vision", "tools", "audio"]
    assert model.input_modalities == ["audio", "image", "text"]
    assert model.quantizations == ["MXFP8", "NVFP4", "Q4_K_M"]
    assert model.local_variant_count == 7
    assert model.cloud_variant_count == 1
    assert model.max_download_size_bytes == 36_000_000_000

    cloud_detail = DETAIL_HTML.replace("ollama run example:8x7b-q4_K_M", "ollama run example:cloud")
    cloud_candidate, _ = refresh_catalog(
        index_html=INDEX_HTML.replace(
            "<span>1</span><span>Tag</span>", "<span>8</span><span>Tags</span>"
        ),
        fetch_html=lambda url: TAGS_HTML if url.endswith("/tags") else cloud_detail,
        baseline=current,
        source_url=current.catalog.source.url,
        base_url="https://ollama.com",
        force_refresh=True,
    )
    cloud_model = cloud_candidate.details["example"]
    assert cloud_model.default_variant == cloud_model.cloud_variant
    assert cloud_model.cloud_variant is not None
    assert cloud_model.cloud_variant.ref == "example:cloud"


def test_categories_do_not_treat_embedding_text_input_as_chat() -> None:
    raw = detail().model_dump()
    raw["capabilities"] = ["audio", "embedding", "thinking"]
    raw["variants"][0]["input_modalities"] = ["text", "audio"]
    raw["default_variant"] = raw["variants"][0]
    raw["smallest_local_variant"] = raw["variants"][0]
    for field in (
        "categories",
        "input_modalities",
        "quantizations",
        "local_variant_count",
        "cloud_variant_count",
        "max_download_size_bytes",
    ):
        raw.pop(field)

    model = ModelDetail.model_validate(raw)

    assert model.categories == ["reasoning", "embedding", "audio"]
    assert model.input_modalities == ["audio", "text"]


def test_unlisted_model_preserves_last_known_variants_when_source_tag_count_is_zero() -> None:
    raw = detail().model_dump()
    raw.update(status="unlisted", tag_count=0)

    model = ModelDetail.model_validate(raw)

    assert model.local_variant_count == 1
    assert model.tag_count == 0


def test_v2_baseline_without_derived_facets_is_upgraded_in_memory(tmp_path: Path) -> None:
    root = tmp_path
    (root / "public").mkdir()
    write_baseline(root, baseline())
    derived_fields = {
        "categories",
        "input_modalities",
        "quantizations",
        "local_variant_count",
        "cloud_variant_count",
        "max_download_size_bytes",
    }

    catalog_path = root / "public/data/catalog.json"
    catalog_json = json.loads(catalog_path.read_text(encoding="utf-8"))
    for field in derived_fields:
        catalog_json["models"][0].pop(field)
    catalog_path.write_text(json.dumps(catalog_json), encoding="utf-8")

    detail_path = root / "public/data/models/example.json"
    detail_json = json.loads(detail_path.read_text(encoding="utf-8"))
    for field in derived_fields:
        detail_json.pop(field)
    detail_path.write_text(json.dumps(detail_json), encoding="utf-8")

    loaded = load_baseline(root)

    assert loaded.details["example"].categories == ["chat", "tools"]
    assert loaded.details["example"].input_modalities == ["text"]
    assert loaded.details["example"].local_variant_count == 1
    assert loaded.catalog.models[0] == ModelSummary.model_validate(
        loaded.details["example"].model_dump(exclude={"variants"})
    )


def test_v2_backfill_does_not_hide_an_explicitly_corrupt_facet(tmp_path: Path) -> None:
    root = tmp_path
    (root / "public").mkdir()
    write_baseline(root, baseline())
    catalog_path = root / "public/data/catalog.json"
    catalog_json = json.loads(catalog_path.read_text(encoding="utf-8"))
    catalog_json["models"][0]["categories"] = ["audio"]
    catalog_json["models"][0].pop("input_modalities")
    catalog_path.write_text(json.dumps(catalog_json), encoding="utf-8")

    with pytest.raises(MinerError, match="summary/detail mismatch"):
        load_baseline(root)


def test_empty_and_large_source_drops_fail_closed() -> None:
    ten = baseline([detail(f"model-{index}") for index in range(10)])
    with pytest.raises(MinerError, match="empty"):
        validate_source_count(0, ten.catalog, 10)
    with pytest.raises(MinerError, match="dropped"):
        validate_source_count(8, ten.catalog, 10)
    validate_source_count(9, ten.catalog, 10)

    ten.catalog.source.model_count = 20
    with pytest.raises(MinerError, match=r"20 -> 17"):
        validate_source_count(17, ten.catalog, 10)


def test_atomic_output_round_trips(tmp_path: Path) -> None:
    root = tmp_path
    (root / "public").mkdir()
    current = baseline()
    write_baseline(root, current)
    written = json.loads((root / "public/data/catalog.json").read_text(encoding="utf-8"))
    assert written["schema_version"] == 2
    assert (root / "public/data/models/example.json").exists()
    assert json.loads((root / "public/data/legacy-id-map.json").read_text()) == {
        "old-id": "example"
    }
    variant_index = json.loads((root / "public/data/variant-index.json").read_text())
    assert variant_index["schema_version"] == 1
    assert variant_index["generated_at"] == current.catalog.generated_at
    assert list(variant_index["models"]) == ["example"]
    assert list(variant_index["models"]["example"][0]) == [
        "ref",
        "tag",
        "availability",
        "download_size_bytes",
        "parameter",
        "quantization",
        "context_window",
        "input_modalities",
        "is_default",
    ]
    first = {
        path.relative_to(root): path.read_bytes() for path in (root / "public/data").rglob("*.json")
    }
    write_baseline(root, current)
    second = {
        path.relative_to(root): path.read_bytes() for path in (root / "public/data").rglob("*.json")
    }
    assert second == first


def test_variant_index_has_exact_active_coverage_and_unique_sorted_refs() -> None:
    retired_data = detail("retired").model_dump()
    retired_data.update(status="unlisted", tag_count=0)
    current = baseline([detail("zeta"), ModelDetail.model_validate(retired_data), detail("alpha")])

    index = build_variant_index(current.catalog, current.details)

    assert list(index.models) == ["alpha", "zeta"]
    assert [variant.ref for variant in index.models["alpha"]] == ["alpha:latest"]
    assert "retired" not in index.models
    assert sum(map(len, index.models.values())) == sum(
        len(model.variants) for model in current.details.values() if model.status == "active"
    )

    missing = index.model_copy(deep=True)
    del missing.models["zeta"]
    with pytest.raises(MinerError, match="every active model"):
        validate_variant_index(missing, current.catalog, current.details)

    changed = index.model_copy(deep=True)
    changed.models["alpha"][0].download_size_bytes = 1
    with pytest.raises(MinerError, match="coverage mismatch"):
        validate_variant_index(changed, current.catalog, current.details)

    duplicate = VariantIndexRecord.model_validate(index.models["alpha"][0].model_dump())
    with pytest.raises(ValidationError, match="variant refs must be unique"):
        VariantIndex(
            generated_at=current.catalog.generated_at,
            models={"alpha": [duplicate, duplicate]},
        )
