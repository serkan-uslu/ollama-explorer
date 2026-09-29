from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

Availability = Literal["local", "cloud", "both"]
Status = Literal["active", "unlisted"]
Category = Literal[
    "chat",
    "coding",
    "vision",
    "tools",
    "reasoning",
    "embedding",
    "audio",
]

CATEGORY_ORDER: tuple[Category, ...] = (
    "chat",
    "coding",
    "vision",
    "tools",
    "reasoning",
    "embedding",
    "audio",
)
DERIVED_SUMMARY_FIELDS = frozenset(
    {
        "categories",
        "input_modalities",
        "quantizations",
        "local_variant_count",
        "cloud_variant_count",
        "max_download_size_bytes",
    }
)
CODING_APPLICATIONS = frozenset({"claude code", "cline", "codex", "continue", "opencode"})


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", protected_namespaces=())


class Parameter(StrictModel):
    raw: str
    total_billion: float | None = None
    active_billion: float | None = None


class Variant(StrictModel):
    ref: str
    tag: str
    digest: str | None = None
    availability: Literal["local", "cloud"]
    download_size_bytes: int | None = Field(default=None, gt=0)
    parameter: Parameter | None = None
    quantization: str | None = None
    context_window: int | None = Field(default=None, ge=1)
    input_modalities: list[str] = Field(default_factory=list)
    source_updated_at: str | None = None
    is_default: bool = False

    @field_validator("source_updated_at")
    @classmethod
    def valid_utc_timestamp(cls, value: str | None) -> str | None:
        if value is None:
            return None
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed.utcoffset() is None or not value.endswith("Z"):
            raise ValueError("timestamp must be UTC and end in Z")
        return value


def derive_variant_facets(
    capabilities: list[str], applications: list[str], variants: list[Variant]
) -> dict[str, Any]:
    normalized_capabilities = {value.strip().casefold() for value in capabilities}
    normalized_applications = {
        re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip() for value in applications
    }
    modalities = sorted(
        {
            modality.strip().casefold()
            for variant in variants
            for modality in variant.input_modalities
            if modality.strip()
        }
    )
    quantizations = sorted(
        {
            variant.quantization.strip().upper()
            for variant in variants
            if variant.quantization and variant.quantization.strip()
        }
    )
    local = [variant for variant in variants if variant.availability == "local"]
    cloud = [variant for variant in variants if variant.availability == "cloud"]

    matched: set[Category] = set()
    if "text" in modalities and not normalized_capabilities.intersection(
        {"embedding", "embeddings"}
    ):
        matched.add("chat")
    if normalized_capabilities.intersection({"code", "coding"}) or (
        normalized_applications & CODING_APPLICATIONS
    ):
        matched.add("coding")
    if "vision" in normalized_capabilities or "image" in modalities:
        matched.add("vision")
    if "tools" in normalized_capabilities:
        matched.add("tools")
    if normalized_capabilities.intersection({"reasoning", "thinking"}):
        matched.add("reasoning")
    if normalized_capabilities.intersection({"embedding", "embeddings"}):
        matched.add("embedding")
    if "audio" in normalized_capabilities or "audio" in modalities:
        matched.add("audio")

    return {
        "categories": [category for category in CATEGORY_ORDER if category in matched],
        "input_modalities": modalities,
        "quantizations": quantizations,
        "local_variant_count": len(local),
        "cloud_variant_count": len(cloud),
        "max_download_size_bytes": max(
            (
                variant.download_size_bytes
                for variant in local
                if variant.download_size_bytes is not None
            ),
            default=None,
        ),
    }


class ModelSummary(StrictModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9._-]*$")
    name: str = Field(min_length=1)
    description: str = ""
    source_url: str
    status: Status = "active"
    availability: Availability
    capabilities: list[str] = Field(default_factory=list)
    applications: list[str] = Field(default_factory=list)
    pulls: int | None = Field(default=None, ge=0)
    tag_count: int = Field(default=0, ge=0)
    source_updated_at: str | None = None
    parameter_sizes: list[str] = Field(default_factory=list)
    min_download_size_bytes: int | None = Field(default=None, gt=0)
    max_download_size_bytes: int | None = Field(default=None, gt=0)
    max_context_window: int | None = Field(default=None, ge=1)
    categories: list[Category] = Field(default_factory=list)
    input_modalities: list[str] = Field(default_factory=list)
    quantizations: list[str] = Field(default_factory=list)
    local_variant_count: int = Field(default=0, ge=0)
    cloud_variant_count: int = Field(default=0, ge=0)
    default_variant: Variant | None = None
    smallest_local_variant: Variant | None = None
    cloud_variant: Variant | None = None
    family: str | None = None
    license: str | None = None

    @model_validator(mode="after")
    def valid_recommended_variants(self) -> ModelSummary:
        expected_categories = [
            category for category in CATEGORY_ORDER if category in set(self.categories)
        ]
        if self.categories != expected_categories:
            raise ValueError("categories must be unique and use canonical order")
        if self.input_modalities != sorted(set(self.input_modalities)):
            raise ValueError("input_modalities must be sorted and unique")
        if self.quantizations != sorted(set(self.quantizations)):
            raise ValueError("quantizations must be sorted and unique")

        variant_count = self.local_variant_count + self.cloud_variant_count
        if variant_count:
            if self.status == "active" and variant_count != self.tag_count:
                raise ValueError("local_variant_count + cloud_variant_count must match tag_count")
            expected_availability: Availability = (
                "both"
                if self.local_variant_count and self.cloud_variant_count
                else "local"
                if self.local_variant_count
                else "cloud"
            )
            if self.availability != expected_availability:
                raise ValueError("availability must match variant counts")
        if (
            self.min_download_size_bytes is not None
            and self.max_download_size_bytes is not None
            and self.min_download_size_bytes > self.max_download_size_bytes
        ):
            raise ValueError("min_download_size_bytes cannot exceed max_download_size_bytes")
        if self.default_variant is not None and not self.default_variant.is_default:
            raise ValueError("default_variant must be marked as the official default")
        if (
            self.smallest_local_variant is not None
            and self.smallest_local_variant.availability != "local"
        ):
            raise ValueError("smallest_local_variant must be local")
        if self.cloud_variant is not None and self.cloud_variant.availability != "cloud":
            raise ValueError("cloud_variant must be cloud")
        return self

    @field_validator("source_url")
    @classmethod
    def valid_source_url(cls, value: str) -> str:
        if not value.startswith(("https://", "http://")):
            raise ValueError("source_url must be absolute")
        return value

    @field_validator("source_updated_at")
    @classmethod
    def valid_utc_timestamp(cls, value: str | None) -> str | None:
        return Variant.valid_utc_timestamp(value)


class ModelDetail(ModelSummary):
    variants: list[Variant] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def populate_missing_derived_facets(cls, value: Any) -> Any:
        if not isinstance(value, dict) or "variants" not in value:
            return value
        data = dict(value)
        if DERIVED_SUMMARY_FIELDS.issubset(data):
            return data
        variants = [
            variant if isinstance(variant, Variant) else Variant.model_validate(variant)
            for variant in data.get("variants") or []
        ]
        derived = derive_variant_facets(
            list(data.get("capabilities") or []),
            list(data.get("applications") or []),
            variants,
        )
        for field, field_value in derived.items():
            data.setdefault(field, field_value)
        return data

    @model_validator(mode="after")
    def unique_variants(self) -> ModelDetail:
        refs = [variant.ref for variant in self.variants]
        tags = [variant.tag for variant in self.variants]
        if len(refs) != len(set(refs)) or len(tags) != len(set(tags)):
            raise ValueError("variant refs and tags must be unique within a model")
        if self.status == "active" and not self.variants:
            raise ValueError("active models require at least one variant")
        if self.status == "active" and self.tag_count != len(self.variants):
            raise ValueError("active tag_count must match the exported variants")

        local = [variant for variant in self.variants if variant.availability == "local"]
        cloud = [variant for variant in self.variants if variant.availability == "cloud"]
        if self.variants:
            expected_availability = "both" if local and cloud else "local" if local else "cloud"
            if self.availability != expected_availability:
                raise ValueError("availability must match the exported variants")

        defaults = [variant for variant in self.variants if variant.is_default]
        if len(defaults) > 1:
            raise ValueError("a model can have at most one official default variant")
        if self.default_variant != (defaults[0] if defaults else None):
            raise ValueError("default_variant must match the official variant")

        sized_local = [variant for variant in local if variant.download_size_bytes is not None]
        expected_smallest = min(
            sized_local,
            key=lambda variant: (variant.download_size_bytes or 0, variant.tag, variant.ref),
            default=None,
        )
        if self.smallest_local_variant != expected_smallest:
            raise ValueError("smallest_local_variant must be the smallest known local variant")

        expected_cloud = (
            defaults[0]
            if defaults and defaults[0].availability == "cloud"
            else min(cloud, key=lambda variant: (variant.tag, variant.ref), default=None)
        )
        if self.cloud_variant != expected_cloud:
            raise ValueError("cloud_variant must be the deterministic cloud recommendation")

        expected_min = min(
            (
                variant.download_size_bytes
                for variant in local
                if variant.download_size_bytes is not None
            ),
            default=None,
        )
        if self.min_download_size_bytes != expected_min:
            raise ValueError("min_download_size_bytes must match local variants")
        expected_facets = derive_variant_facets(self.capabilities, self.applications, self.variants)
        for field, expected in expected_facets.items():
            if getattr(self, field) != expected:
                raise ValueError(f"{field} must match variants and source metadata")
        expected_max = max(
            (
                variant.context_window
                for variant in self.variants
                if variant.context_window is not None
            ),
            default=None,
        )
        if self.max_context_window != expected_max:
            raise ValueError("max_context_window must match variants")
        return self


class CatalogSource(StrictModel):
    name: Literal["ollama"] = "ollama"
    url: str
    model_count: int = Field(ge=0)


class Catalog(StrictModel):
    schema_version: Literal[2] = 2
    generated_at: str
    source: CatalogSource
    models: list[ModelSummary]

    @field_validator("generated_at")
    @classmethod
    def valid_generated_at(cls, value: str) -> str:
        return Variant.valid_utc_timestamp(value) or value

    @model_validator(mode="after")
    def unique_slugs(self) -> Catalog:
        slugs = [model.slug for model in self.models]
        if not slugs:
            raise ValueError("catalog cannot be empty")
        if not any(model.status == "active" for model in self.models):
            raise ValueError("catalog must contain at least one active model")
        if len(slugs) != len(set(slugs)):
            raise ValueError("catalog model slugs must be unique")
        return self


class VariantIndexParameter(StrictModel):
    raw: str
    total_billion: float | None = None


class VariantIndexRecord(StrictModel):
    ref: str
    tag: str
    availability: Literal["local", "cloud"]
    download_size_bytes: int | None = Field(default=None, gt=0)
    parameter: VariantIndexParameter | None = None
    quantization: str | None = None
    context_window: int | None = Field(default=None, ge=1)
    input_modalities: list[str] = Field(default_factory=list)
    is_default: bool = False


class VariantIndex(StrictModel):
    schema_version: Literal[1] = 1
    generated_at: str
    models: dict[str, list[VariantIndexRecord]]

    @field_validator("generated_at")
    @classmethod
    def valid_generated_at(cls, value: str) -> str:
        return Variant.valid_utc_timestamp(value) or value

    @model_validator(mode="after")
    def valid_models(self) -> VariantIndex:
        if not self.models:
            raise ValueError("variant index cannot be empty")
        if list(self.models) != sorted(self.models):
            raise ValueError("variant index slugs must use canonical order")

        all_refs: list[str] = []
        for slug, variants in self.models.items():
            if not re.fullmatch(r"[a-z0-9][a-z0-9._-]*", slug):
                raise ValueError(f"invalid variant index slug: {slug}")
            if not variants:
                raise ValueError(f"active variant index entry cannot be empty: {slug}")
            refs = [variant.ref for variant in variants]
            if refs != sorted(refs):
                raise ValueError(f"variant refs must use canonical order: {slug}")
            if len(refs) != len(set(refs)):
                raise ValueError(f"variant refs must be unique: {slug}")
            for variant in variants:
                if variant.ref != f"{slug}:{variant.tag}":
                    raise ValueError(f"variant ref/tag mismatch: {variant.ref}")
                if variant.input_modalities != sorted(set(variant.input_modalities)):
                    raise ValueError(
                        f"variant input modalities must be sorted and unique: {variant.ref}"
                    )
            all_refs.extend(refs)

        if len(all_refs) != len(set(all_refs)):
            raise ValueError("variant refs must be globally unique")
        return self
