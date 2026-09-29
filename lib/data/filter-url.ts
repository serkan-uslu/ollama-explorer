import type { ActiveFilters, AvailabilityFilter } from '../types/filter';
import type { BrowseSort } from '../types/model';

const AVAILABILITIES = new Set<AvailabilityFilter>(['local', 'cloud', 'all']);
const SORTS = new Set<BrowseSort>([
  'relevance',
  'popular',
  'updated',
  'smallest',
  'context',
  'name',
]);
const MEMORY = new Set([8, 16, 32, 64]);
const CONTEXT = new Set([8_000, 32_000, 128_000, 1_000_000]);
const UPDATED = new Set([7, 30, 90, 365]);
const TASKS = new Set(['chat', 'coding', 'vision', 'tools', 'reasoning', 'embedding', 'audio']);
const PARAMETERS = new Set(['0-1', '1-4', '4-14', '14-35', '35-Infinity']);

type SearchParamsReader = Pick<URLSearchParams, 'get' | 'getAll'>;

export interface FacetAllowlist {
  capabilities: ReadonlySet<string>;
  applications: ReadonlySet<string>;
  modalities: ReadonlySet<string>;
  quantizations: ReadonlySet<string>;
  families: ReadonlySet<string>;
  licenses: ReadonlySet<string>;
}

function values(params: SearchParamsReader, name: string): string[] {
  return [
    ...new Set(
      params
        .getAll(name)
        .map((value) => value.trim().slice(0, 100))
        .filter(Boolean),
    ),
  ].slice(0, 30);
}

function positiveInteger(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function createDefaultFilters(search = ''): ActiveFilters {
  return {
    search,
    availability: 'local',
    tasks: [],
    capabilities: [],
    applications: [],
    modalities: [],
    quantizations: [],
    families: [],
    licenses: [],
    parameterBuckets: [],
    memory: null,
    context: null,
    updatedWithinDays: null,
    sort: search ? 'relevance' : 'popular',
    page: 1,
  };
}

export function parseFiltersFromSearchParams(
  params: SearchParamsReader,
  allowlist?: FacetAllowlist,
): ActiveFilters {
  const search = (params.get('q') ?? '').trim().slice(0, 200);
  const defaults = createDefaultFilters(search);
  const availability = params.get('availability') as AvailabilityFilter | null;
  const sort = params.get('sort') as BrowseSort | null;
  const memory = positiveInteger(params.get('memory'));
  const context = positiveInteger(params.get('context'));
  const updated = positiveInteger(params.get('updated'));
  const legacyUseCase = params.get('useCase');
  const legacyTask = legacyUseCase
    ? {
        'Chat Assistant': 'chat',
        'Creative Writing': 'chat',
        'Question Answering': 'chat',
        'Text Summarization': 'chat',
        Translation: 'chat',
        'Code Generation': 'coding',
        'Code Review': 'coding',
        'Image Understanding': 'vision',
        'Function Calling': 'tools',
        Reasoning: 'reasoning',
        Math: 'reasoning',
        'Text Embedding': 'embedding',
      }[legacyUseCase]
    : undefined;

  return {
    ...defaults,
    availability: availability && AVAILABILITIES.has(availability) ? availability : 'local',
    tasks: [
      ...new Set([
        ...values(params, 'task').filter((value) => TASKS.has(value)),
        ...(legacyTask ? [legacyTask] : []),
      ]),
    ],
    capabilities: values(params, 'capability').filter(
      (value) => !allowlist || allowlist.capabilities.has(value),
    ),
    applications: values(params, 'application').filter(
      (value) => !allowlist || allowlist.applications.has(value),
    ),
    modalities: values(params, 'modality').filter(
      (value) => !allowlist || allowlist.modalities.has(value),
    ),
    quantizations: values(params, 'quantization').filter(
      (value) => !allowlist || allowlist.quantizations.has(value),
    ),
    families: values(params, 'family').filter(
      (value) => !allowlist || allowlist.families.has(value),
    ),
    licenses: values(params, 'license').filter(
      (value) => !allowlist || allowlist.licenses.has(value),
    ),
    parameterBuckets: values(params, 'parameter').filter((value) => PARAMETERS.has(value)),
    memory: memory !== null && MEMORY.has(memory) ? memory : null,
    context: context !== null && CONTEXT.has(context) ? context : null,
    updatedWithinDays: updated !== null && UPDATED.has(updated) ? updated : null,
    sort:
      sort && SORTS.has(sort)
        ? sort === 'relevance' && !search
          ? 'popular'
          : sort
        : defaults.sort,
    page: Math.min(positiveInteger(params.get('page')) ?? 1, 1_000),
  };
}

export function filtersToSearchParams(filters: ActiveFilters): URLSearchParams {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  if (search) params.set('q', search);
  if (filters.availability !== 'local') params.set('availability', filters.availability);

  const append = (name: string, entries: string[]) => {
    [...new Set(entries)].sort().forEach((entry) => params.append(name, entry));
  };

  append('task', filters.tasks);
  append('capability', filters.capabilities);
  append('application', filters.applications);
  append('modality', filters.modalities);
  append('quantization', filters.quantizations);
  append('family', filters.families);
  append('license', filters.licenses);
  append('parameter', filters.parameterBuckets);
  if (filters.memory !== null) params.set('memory', String(filters.memory));
  if (filters.context !== null) params.set('context', String(filters.context));
  if (filters.updatedWithinDays !== null) {
    params.set('updated', String(filters.updatedWithinDays));
  }

  const defaultSort = search ? 'relevance' : 'popular';
  const sort = !search && filters.sort === 'relevance' ? 'popular' : filters.sort;
  if (sort !== defaultSort) params.set('sort', sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}
