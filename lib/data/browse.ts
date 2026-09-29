import Fuse from 'fuse.js';
import { estimateMemoryGiB, parameterMatchesBucket, parseParameterSize } from './model-math.ts';
import type { ActiveFilters } from '@/lib/types/filter';
import type { BrowseSort, ModelSummary } from '@/lib/types/model';

const indexes = new WeakMap<ModelSummary[], Fuse<ModelSummary>>();

function getSearchIndex(models: ModelSummary[]): Fuse<ModelSummary> {
  const existing = indexes.get(models);
  if (existing) return existing;

  const index = new Fuse(models, {
    keys: [
      { name: 'name', weight: 4 },
      { name: 'description', weight: 2 },
      { name: 'applications', weight: 2 },
      { name: 'capabilities', weight: 1.5 },
      { name: 'categories', weight: 1 },
      { name: 'input_modalities', weight: 0.75 },
      { name: 'quantizations', weight: 0.5 },
      { name: 'family', weight: 1 },
      { name: 'license', weight: 0.5 },
      { name: 'parameter_sizes', weight: 0.5 },
    ],
    threshold: 0.35,
    minMatchCharLength: 2,
    ignoreLocation: true,
  });
  indexes.set(models, index);
  return index;
}

function normalized(values: (string | null)[]): string[] {
  return values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
}

function includesTerm(values: string[], terms: string[]): boolean {
  return values.some((value) => terms.some((term) => value.includes(term)));
}

export function modelMatchesTask(model: ModelSummary, task: string): boolean {
  const categories = normalized(model.categories ?? []);
  if (categories.length > 0) return categories.includes(task);

  const capabilities = normalized(model.capabilities);
  const applications = normalized(model.applications);
  const modalities = normalized(getModelModalities(model));

  switch (task) {
    case 'coding':
      return includesTerm(applications, ['code', 'coding', 'programming']);
    case 'vision':
      return includesTerm(capabilities, ['vision']) || modalities.includes('image');
    case 'tools':
      return includesTerm(capabilities, ['tool', 'function']);
    case 'reasoning':
      return includesTerm(capabilities, ['thinking', 'reasoning']);
    case 'embedding':
      return includesTerm(capabilities, ['embedding']);
    case 'audio':
      return includesTerm(capabilities, ['audio']) || modalities.includes('audio');
    case 'chat':
      return modalities.includes('text') && !includesTerm(capabilities, ['embedding']);
    default:
      return false;
  }
}

export function getParameterSizes(model: ModelSummary): number[] {
  const raw = model.parameter_sizes
    .map(parseParameterSize)
    .filter((size): size is number => size !== null);
  const variants = [model.default_variant, model.smallest_local_variant]
    .map((variant) => variant?.parameter?.total_billion ?? null)
    .filter((size): size is number => size !== null);
  return [...new Set([...raw, ...variants])];
}

export function getModelModalities(model: ModelSummary): string[] {
  return [
    ...new Set([
      ...(model.input_modalities ?? []),
      ...(model.default_variant?.input_modalities ?? []),
      ...(model.smallest_local_variant?.input_modalities ?? []),
      ...(model.cloud_variant?.input_modalities ?? []),
    ]),
  ];
}

export function getModelQuantizations(model: ModelSummary): string[] {
  return [
    ...new Set(
      [
        ...(model.quantizations ?? []),
        model.default_variant?.quantization,
        model.smallest_local_variant?.quantization,
        model.cloud_variant?.quantization,
      ].filter((value): value is string => Boolean(value)),
    ),
  ];
}

export function modelUpdatedWithin(model: ModelSummary, days: number, now = Date.now()): boolean {
  const updated = timestamp(model.source_updated_at);
  return Number.isFinite(updated) && updated >= now - days * 86_400_000;
}

function matchesParameterBucket(model: ModelSummary, key: string): boolean {
  return getParameterSizes(model).some((size) => parameterMatchesBucket(size, key));
}

function matchesAvailability(model: ModelSummary, availability: ActiveFilters['availability']) {
  return (
    availability === 'all' || model.availability === availability || model.availability === 'both'
  );
}

export type FacetName =
  | 'availability'
  | 'tasks'
  | 'capabilities'
  | 'applications'
  | 'modalities'
  | 'quantizations'
  | 'families'
  | 'licenses'
  | 'parameters'
  | 'memory'
  | 'context'
  | 'updated';

export function modelMatchesFilters(
  model: ModelSummary,
  filters: ActiveFilters,
  ignoredFacet?: FacetName,
): boolean {
  if (model.status !== 'active') return false;
  if (ignoredFacet !== 'availability' && !matchesAvailability(model, filters.availability))
    return false;
  if (
    ignoredFacet !== 'tasks' &&
    filters.tasks.length > 0 &&
    !filters.tasks.some((task) => modelMatchesTask(model, task))
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'capabilities' &&
    filters.capabilities.length > 0 &&
    !filters.capabilities.some((capability) => model.capabilities.includes(capability))
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'applications' &&
    filters.applications.length > 0 &&
    !filters.applications.some((application) => model.applications.includes(application))
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'modalities' &&
    filters.modalities.length > 0 &&
    !filters.modalities.some((modality) => getModelModalities(model).includes(modality))
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'quantizations' &&
    filters.quantizations.length > 0 &&
    !filters.quantizations.some((quantization) =>
      getModelQuantizations(model).includes(quantization),
    )
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'families' &&
    filters.families.length > 0 &&
    (!model.family || !filters.families.includes(model.family))
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'licenses' &&
    filters.licenses.length > 0 &&
    (!model.license || !filters.licenses.includes(model.license))
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'parameters' &&
    filters.parameterBuckets.length > 0 &&
    !filters.parameterBuckets.some((bucket) => matchesParameterBucket(model, bucket))
  ) {
    return false;
  }
  if (ignoredFacet !== 'memory' && filters.memory !== null) {
    if (filters.availability === 'cloud') return false;
    const memory = estimateMemoryGiB(model.smallest_local_variant?.download_size_bytes);
    if (memory === null || memory > filters.memory) return false;
  }
  if (
    ignoredFacet !== 'context' &&
    filters.context !== null &&
    (model.max_context_window === null || model.max_context_window < filters.context)
  ) {
    return false;
  }
  if (
    ignoredFacet !== 'updated' &&
    filters.updatedWithinDays !== null &&
    !modelUpdatedWithin(model, filters.updatedWithinDays)
  ) {
    return false;
  }
  return true;
}

function nullableNumber(value: number | null, fallback: number): number {
  return value === null || Number.isNaN(value) ? fallback : value;
}

function timestamp(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export function sortModels(models: ModelSummary[], sort: BrowseSort): ModelSummary[] {
  const sorted = [...models];
  const byName = (a: ModelSummary, b: ModelSummary) => a.name.localeCompare(b.name);

  switch (sort) {
    case 'updated':
      return sorted.sort((a, b) => {
        return timestamp(b.source_updated_at) - timestamp(a.source_updated_at) || byName(a, b);
      });
    case 'smallest':
      return sorted.sort(
        (a, b) =>
          nullableNumber(a.min_download_size_bytes, Number.POSITIVE_INFINITY) -
            nullableNumber(b.min_download_size_bytes, Number.POSITIVE_INFINITY) || byName(a, b),
      );
    case 'context':
      return sorted.sort(
        (a, b) =>
          nullableNumber(b.max_context_window, Number.NEGATIVE_INFINITY) -
            nullableNumber(a.max_context_window, Number.NEGATIVE_INFINITY) || byName(a, b),
      );
    case 'name':
      return sorted.sort(byName);
    case 'popular':
    case 'relevance':
    default:
      return sorted.sort(
        (a, b) =>
          nullableNumber(b.pulls, Number.NEGATIVE_INFINITY) -
            nullableNumber(a.pulls, Number.NEGATIVE_INFINITY) || byName(a, b),
      );
  }
}

export function filterAndSortModels(
  models: ModelSummary[],
  filters: ActiveFilters,
): ModelSummary[] {
  const query = filters.search.trim();
  const candidates = query
    ? getSearchIndex(models)
        .search(query)
        .map((result) => result.item)
    : models;
  const filtered = candidates.filter((model) => modelMatchesFilters(model, filters));

  if (query && filters.sort === 'relevance') return filtered;
  return sortModels(filtered, filters.sort === 'relevance' ? 'popular' : filters.sort);
}

export function countFacet(
  models: ModelSummary[],
  filters: ActiveFilters,
  facet: FacetName,
  matches: (model: ModelSummary) => boolean,
  matchingFilters: ActiveFilters = filters,
): number {
  const query = filters.search.trim();
  const candidates = query
    ? getSearchIndex(models)
        .search(query)
        .map((result) => result.item)
    : models;
  return candidates.filter(
    (model) => modelMatchesFilters(model, matchingFilters, facet) && matches(model),
  ).length;
}

export {
  estimateMemoryGiB,
  parameterMatchesBucket,
  parseParameterSize,
  selectVariantForMemory,
} from './model-math.ts';
