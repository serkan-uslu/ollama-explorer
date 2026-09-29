import { selectVariantForFilters } from './model-math.ts';
import type { VariantCandidate, VariantSelectionFilters } from './model-math';
import type { ModelSummary } from '../types/model';

export interface VariantIndexRecord extends VariantCandidate {
  tag: string;
}

export interface VariantIndex {
  schema_version: 1;
  generated_at: string;
  models: Record<string, VariantIndexRecord[]>;
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isVariant(value: unknown): value is VariantIndexRecord {
  if (typeof value !== 'object' || value === null) return false;
  const variant = value as Record<string, unknown>;
  const parameter = variant.parameter;
  return (
    typeof variant.ref === 'string' &&
    typeof variant.tag === 'string' &&
    (variant.availability === 'local' || variant.availability === 'cloud') &&
    isNullableNumber(variant.download_size_bytes) &&
    (parameter === null ||
      (typeof parameter === 'object' &&
        parameter !== null &&
        typeof (parameter as Record<string, unknown>).raw === 'string' &&
        isNullableNumber((parameter as Record<string, unknown>).total_billion))) &&
    (variant.quantization === null || typeof variant.quantization === 'string') &&
    isNullableNumber(variant.context_window) &&
    Array.isArray(variant.input_modalities) &&
    variant.input_modalities.every((modality) => typeof modality === 'string') &&
    typeof variant.is_default === 'boolean'
  );
}

export function parseVariantIndex(value: unknown): VariantIndex | null {
  if (typeof value !== 'object' || value === null) return null;
  const index = value as Record<string, unknown>;
  if (
    index.schema_version !== 1 ||
    typeof index.generated_at !== 'string' ||
    !Number.isFinite(Date.parse(index.generated_at)) ||
    typeof index.models !== 'object' ||
    index.models === null ||
    Array.isArray(index.models)
  ) {
    return null;
  }

  for (const variants of Object.values(index.models)) {
    if (!Array.isArray(variants) || !variants.every(isVariant)) return null;
  }
  return index as unknown as VariantIndex;
}

let cachedIndex: VariantIndex | null = null;
let pendingRequest: Promise<VariantIndex> | null = null;

export function loadVariantIndex(): Promise<VariantIndex> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetch('/data/variant-index.json')
    .then(async (response) => {
      if (!response.ok) throw new Error(`Variant index request failed: ${response.status}`);
      const index = parseVariantIndex(await response.json());
      if (!index) throw new Error('Variant index is invalid');
      cachedIndex = index;
      return index;
    })
    .finally(() => {
      pendingRequest = null;
    });
  return pendingRequest;
}

export function selectIndexedVariant(
  model: ModelSummary,
  index: VariantIndex,
  filters: VariantSelectionFilters,
): VariantCandidate | null {
  return selectVariantForFilters(
    {
      default_variant: model.default_variant,
      smallest_local_variant: model.smallest_local_variant,
      cloud_variant: model.cloud_variant,
      variants: index.models[model.slug] ?? [],
    },
    filters,
  );
}

export function resolveExactVariantMatches(
  models: ModelSummary[],
  index: VariantIndex,
  filters: VariantSelectionFilters,
): { models: ModelSummary[]; variants: Map<string, VariantCandidate> } {
  const matchingModels: ModelSummary[] = [];
  const variants = new Map<string, VariantCandidate>();
  for (const model of models) {
    const variant = selectIndexedVariant(model, index, filters);
    if (!variant) continue;
    matchingModels.push(model);
    variants.set(model.slug, variant);
  }
  return { models: matchingModels, variants };
}
