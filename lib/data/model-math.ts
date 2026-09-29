import { PARAMETER_BUCKETS } from '../constants.ts';
import type { ModelParameter, ModelSummary, Variant } from '../types/model';
import type { ActiveFilters } from '../types/filter';

const GIB = 1024 ** 3;

export function estimateMemoryGiB(downloadSizeBytes: number | null | undefined): number | null {
  if (downloadSizeBytes === null || downloadSizeBytes === undefined || downloadSizeBytes <= 0) {
    return null;
  }

  return Math.ceil(((downloadSizeBytes / GIB) * 1.2 + 1) * 2) / 2;
}

export function parseParameterSize(raw: string): number | null {
  const value = raw.trim().toLowerCase().replaceAll('×', 'x');
  const mixture = value.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)b$/);
  if (mixture) return Number(mixture[1]) * Number(mixture[2]);

  const match = value.match(/^(\d+(?:\.\d+)?)([mb])$/);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === 'm' ? amount / 1000 : amount;
}

export type VariantCandidate = Pick<
  Variant,
  | 'ref'
  | 'availability'
  | 'download_size_bytes'
  | 'quantization'
  | 'context_window'
  | 'input_modalities'
  | 'is_default'
> & {
  parameter: Pick<ModelParameter, 'raw' | 'total_billion'> | null;
};

export type VariantSelectionSource = Pick<
  ModelSummary,
  'default_variant' | 'smallest_local_variant' | 'cloud_variant'
> & { variants?: readonly VariantCandidate[] };

export type VariantSelectionFilters = Pick<
  ActiveFilters,
  'availability' | 'modalities' | 'quantizations' | 'parameterBuckets' | 'memory' | 'context'
>;

function isVariant(variant: VariantCandidate | null | undefined): variant is VariantCandidate {
  return variant !== null && variant !== undefined;
}

export function needsExactVariantData(filters: VariantSelectionFilters): boolean {
  return (
    filters.modalities.length > 0 ||
    filters.quantizations.length > 0 ||
    filters.parameterBuckets.length > 0 ||
    filters.context !== null
  );
}

export function variantMatchesFilters(
  variant: VariantCandidate,
  filters: VariantSelectionFilters,
): boolean {
  if (filters.availability !== 'all' && variant.availability !== filters.availability) return false;

  if (
    filters.modalities.length > 0 &&
    !filters.modalities.some((modality) => variant.input_modalities.includes(modality))
  ) {
    return false;
  }

  if (
    filters.quantizations.length > 0 &&
    (!variant.quantization || !filters.quantizations.includes(variant.quantization))
  ) {
    return false;
  }

  if (filters.parameterBuckets.length > 0) {
    const parameter =
      variant.parameter?.total_billion ??
      (variant.parameter?.raw ? parseParameterSize(variant.parameter.raw) : null);
    if (
      parameter === null ||
      !filters.parameterBuckets.some((bucket) => parameterMatchesBucket(parameter, bucket))
    ) {
      return false;
    }
  }

  if (
    filters.context !== null &&
    (variant.context_window === null || variant.context_window < filters.context)
  ) {
    return false;
  }

  if (filters.memory !== null) {
    if (variant.availability !== 'local') return false;
    const estimate = estimateMemoryGiB(variant.download_size_bytes);
    if (estimate === null || estimate > filters.memory) return false;
  }

  return true;
}

export function parameterMatchesBucket(size: number, key: string): boolean {
  const bucket = PARAMETER_BUCKETS.find((option) => option.value === key);
  if (!bucket) return false;
  if (bucket.max === Infinity) return size >= bucket.min;
  const aboveMinimum = bucket.min === 0 ? size >= bucket.min : size > bucket.min;
  return aboveMinimum && (bucket.maxInclusive ? size <= bucket.max : size < bucket.max);
}

export function selectVariantForFilters(
  model: VariantSelectionSource,
  filters: VariantSelectionFilters,
): VariantCandidate | null {
  const variants = model.variants ?? [
    model.default_variant,
    model.smallest_local_variant,
    model.cloud_variant,
  ];
  const matches = [
    ...new Map(
      variants
        .filter(isVariant)
        .filter((variant) => variantMatchesFilters(variant, filters))
        .map((variant) => [variant.ref, variant]),
    ).values(),
  ];
  if (matches.length === 0) return null;

  const preferred =
    filters.availability === 'cloud'
      ? [model.cloud_variant, model.default_variant]
      : [
          model.default_variant?.availability === 'local' ? model.default_variant : null,
          model.smallest_local_variant,
          model.default_variant,
          model.cloud_variant,
        ];
  for (const variant of preferred) {
    const match = matches.find((candidate) => candidate.ref === variant?.ref);
    if (match) return match;
  }

  return matches.sort(
    (a, b) =>
      Number(a.availability === 'cloud') - Number(b.availability === 'cloud') ||
      (a.download_size_bytes ?? Number.POSITIVE_INFINITY) -
        (b.download_size_bytes ?? Number.POSITIVE_INFINITY) ||
      a.ref.localeCompare(b.ref),
  )[0];
}

export function selectVariantForMemory(
  model: VariantSelectionSource,
  memoryBudgetGiB: number | null,
  targetAvailability: 'local' | 'cloud' | 'all' = 'all',
): Variant | null {
  return selectVariantForFilters(model, {
    availability: targetAvailability,
    modalities: [],
    quantizations: [],
    parameterBuckets: [],
    memory: memoryBudgetGiB,
    context: null,
  }) as Variant | null;
}
