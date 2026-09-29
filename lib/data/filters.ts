import {
  CONTEXT_THRESHOLDS,
  MEMORY_BUDGETS,
  PARAMETER_BUCKETS,
  TASK_OPTIONS,
  UPDATED_RANGES,
} from '../constants.ts';
import {
  countFacet,
  getModelModalities,
  getModelQuantizations,
  getParameterSizes,
  modelMatchesTask,
  modelUpdatedWithin,
  parameterMatchesBucket,
} from './browse.ts';
import { estimateMemoryGiB } from './model-math.ts';
import { selectIndexedVariant } from './variant-index.ts';
import type {
  ActiveFilters,
  AvailabilityFilter,
  FacetCounts,
  FilterOptions,
} from '@/lib/types/filter';
import type { VariantIndex } from './variant-index';
import type { ModelSummary } from '@/lib/types/model';

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function deriveFilterOptions(models: ModelSummary[]): FilterOptions {
  const tasks = TASK_OPTIONS.filter((task) =>
    models.some((model) => modelMatchesTask(model, task.value)),
  );
  return {
    tasks: [...tasks],
    availabilities: [
      { value: 'local', label: 'Local' },
      { value: 'cloud', label: 'Cloud' },
      { value: 'all', label: 'All' },
    ],
    capabilities: unique(models.flatMap((model) => model.capabilities)).map((value) => ({
      value,
      label: value,
    })),
    applications: unique(models.flatMap((model) => model.applications)).map((value) => ({
      value,
      label: value,
    })),
    modalities: unique(models.flatMap(getModelModalities)).map((value) => ({
      value,
      label: value,
    })),
    quantizations: unique(models.flatMap(getModelQuantizations)).map((value) => ({
      value,
      label: value,
    })),
    families: unique(models.map((model) => model.family)).map((value) => ({ value, label: value })),
    licenses: unique(models.map((model) => model.license)).map((value) => ({
      value,
      label: value,
    })),
    parameterBuckets: PARAMETER_BUCKETS.map((bucket) => ({ ...bucket })),
    memoryBudgets: MEMORY_BUDGETS.map((value) => ({ value: String(value), label: `${value} GB` })),
    contextThresholds: CONTEXT_THRESHOLDS.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
    updatedRanges: UPDATED_RANGES.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
  };
}

export function deriveFacetCounts(
  models: ModelSummary[],
  filters: ActiveFilters,
  options: FilterOptions,
  variantIndex?: VariantIndex,
): FacetCounts {
  const entries = (values: { value: string }[], count: (value: string) => number) =>
    Object.fromEntries(values.map(({ value }) => [value, count(value)]));
  const count = (
    facet: Parameters<typeof countFacet>[2],
    matches: (model: ModelSummary) => boolean,
    exactFilters: ActiveFilters = filters,
  ) =>
    countFacet(
      models,
      filters,
      facet,
      (model) =>
        matches(model) &&
        (!variantIndex || selectIndexedVariant(model, variantIndex, exactFilters) !== null),
      exactFilters,
    );

  return {
    availability: entries(options.availabilities, (value) =>
      count(
        'availability',
        (model) =>
          !(value === 'cloud' && filters.memory !== null) &&
          (value === 'all' || model.availability === value || model.availability === 'both'),
        { ...filters, availability: value as AvailabilityFilter },
      ),
    ),
    tasks: entries(options.tasks, (value) =>
      count('tasks', (model) => modelMatchesTask(model, value)),
    ),
    capabilities: entries(options.capabilities, (value) =>
      count('capabilities', (model) => model.capabilities.includes(value)),
    ),
    applications: entries(options.applications, (value) =>
      count('applications', (model) => model.applications.includes(value)),
    ),
    modalities: entries(options.modalities, (value) =>
      count('modalities', (model) => getModelModalities(model).includes(value), {
        ...filters,
        modalities: [value],
      }),
    ),
    quantizations: entries(options.quantizations, (value) =>
      count('quantizations', (model) => getModelQuantizations(model).includes(value), {
        ...filters,
        quantizations: [value],
      }),
    ),
    families: entries(options.families, (value) =>
      count('families', (model) => model.family === value),
    ),
    licenses: entries(options.licenses, (value) =>
      count('licenses', (model) => model.license === value),
    ),
    parameters: entries(options.parameterBuckets, (value) => {
      const bucket = options.parameterBuckets.find((option) => option.value === value);
      return count(
        'parameters',
        (model) => {
          if (!bucket) return false;
          return getParameterSizes(model).some((size) => parameterMatchesBucket(size, value));
        },
        { ...filters, parameterBuckets: [value] },
      );
    }),
    memory: entries(options.memoryBudgets, (value) =>
      count(
        'memory',
        (model) => {
          if (filters.availability === 'cloud') return false;
          const memory = estimateMemoryGiB(model.smallest_local_variant?.download_size_bytes);
          return memory !== null && memory <= Number(value);
        },
        { ...filters, memory: Number(value) },
      ),
    ),
    context: entries(options.contextThresholds, (value) =>
      count(
        'context',
        (model) => model.max_context_window !== null && model.max_context_window >= Number(value),
        { ...filters, context: Number(value) },
      ),
    ),
    updated: entries(options.updatedRanges, (value) =>
      count('updated', (model) => modelUpdatedWithin(model, Number(value))),
    ),
  };
}
