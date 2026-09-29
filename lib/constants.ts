import type { BrowseSort } from './types/model';

export const ITEMS_PER_PAGE = 24;
export const DEFAULT_SORT: BrowseSort = 'popular';
export const SEARCH_SORT: BrowseSort = 'relevance';

export const SORT_OPTIONS: { value: BrowseSort; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'popular', label: 'Most popular' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'smallest', label: 'Smallest download' },
  { value: 'context', label: 'Largest context' },
  { value: 'name', label: 'A – Z' },
];

export const TASK_OPTIONS = [
  { value: 'chat', label: 'Chat & writing' },
  { value: 'coding', label: 'Coding' },
  { value: 'vision', label: 'Vision' },
  { value: 'tools', label: 'Agents & tools' },
  { value: 'reasoning', label: 'Reasoning' },
  { value: 'embedding', label: 'Embeddings' },
  { value: 'audio', label: 'Audio' },
] as const;

export const MEMORY_BUDGETS = [8, 16, 32, 64] as const;

export const CONTEXT_THRESHOLDS = [
  { value: 8_000, label: '8K+' },
  { value: 32_000, label: '32K+' },
  { value: 128_000, label: '128K+' },
  { value: 1_000_000, label: '1M+' },
] as const;

export const UPDATED_RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
] as const;

export const PARAMETER_BUCKETS = [
  { value: '0-1', label: '≤ 1B', min: 0, max: 1, maxInclusive: true },
  { value: '1-4', label: '1B – 4B', min: 1, max: 4, maxInclusive: true },
  { value: '4-14', label: '4B – 14B', min: 4, max: 14, maxInclusive: true },
  { value: '14-35', label: '14B – <35B', min: 14, max: 35, maxInclusive: false },
  { value: '35-Infinity', label: '35B+', min: 35, max: Infinity, maxInclusive: true },
] as const;
