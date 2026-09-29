import type { Availability, BrowseSort } from './model';

export type AvailabilityFilter = Exclude<Availability, 'both'> | 'all';

export interface RangeOption {
  value: string;
  label: string;
  min: number;
  max: number;
  maxInclusive: boolean;
}

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  tasks: ChoiceOption[];
  availabilities: ChoiceOption[];
  capabilities: ChoiceOption[];
  applications: ChoiceOption[];
  modalities: ChoiceOption[];
  quantizations: ChoiceOption[];
  families: ChoiceOption[];
  licenses: ChoiceOption[];
  parameterBuckets: RangeOption[];
  memoryBudgets: ChoiceOption[];
  contextThresholds: ChoiceOption[];
  updatedRanges: ChoiceOption[];
}

export interface ActiveFilters {
  search: string;
  availability: AvailabilityFilter;
  tasks: string[];
  capabilities: string[];
  applications: string[];
  modalities: string[];
  quantizations: string[];
  families: string[];
  licenses: string[];
  parameterBuckets: string[];
  memory: number | null;
  context: number | null;
  updatedWithinDays: number | null;
  sort: BrowseSort;
  page: number;
}

export interface FacetCounts {
  availability: Record<string, number>;
  tasks: Record<string, number>;
  capabilities: Record<string, number>;
  applications: Record<string, number>;
  modalities: Record<string, number>;
  quantizations: Record<string, number>;
  families: Record<string, number>;
  licenses: Record<string, number>;
  parameters: Record<string, number>;
  memory: Record<string, number>;
  context: Record<string, number>;
  updated: Record<string, number>;
}
