'use client';

import { X } from 'lucide-react';
import type { FilterOptions } from '@/lib/types/filter';
import type { useFilters } from '@/lib/hooks/useFilters';

type FiltersHook = ReturnType<typeof useFilters>;

interface ActiveFiltersProps {
  hook: FiltersHook;
  options: FilterOptions;
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ActiveFilters({ hook, options }: ActiveFiltersProps) {
  const { filters } = hook;
  const label = (entries: { value: string; label: string }[], value: string) =>
    entries.find((entry) => entry.value === value)?.label ?? value;
  const chips: Chip[] = [];

  if (filters.availability !== 'local') {
    chips.push({
      key: 'availability',
      label: `Run on: ${label(options.availabilities, filters.availability)}`,
      onRemove: () => hook.setAvailability('local'),
    });
  }
  filters.tasks.forEach((value) =>
    chips.push({
      key: `task-${value}`,
      label: label(options.tasks, value),
      onRemove: () => hook.toggleTask(value),
    }),
  );
  filters.capabilities.forEach((value) =>
    chips.push({
      key: `capability-${value}`,
      label: value,
      onRemove: () => hook.toggleCapability(value),
    }),
  );
  filters.applications.forEach((value) =>
    chips.push({
      key: `application-${value}`,
      label: `Application: ${label(options.applications, value)}`,
      onRemove: () => hook.toggleApplication(value),
    }),
  );
  filters.modalities.forEach((value) =>
    chips.push({
      key: `modality-${value}`,
      label: `Input: ${label(options.modalities, value)}`,
      onRemove: () => hook.toggleModality(value),
    }),
  );
  filters.quantizations.forEach((value) =>
    chips.push({
      key: `quantization-${value}`,
      label: `Quantization: ${label(options.quantizations, value)}`,
      onRemove: () => hook.toggleQuantization(value),
    }),
  );
  filters.families.forEach((value) =>
    chips.push({
      key: `family-${value}`,
      label: `Family: ${value}`,
      onRemove: () => hook.toggleFamily(value),
    }),
  );
  filters.licenses.forEach((value) =>
    chips.push({
      key: `license-${value}`,
      label: `License: ${value}`,
      onRemove: () => hook.toggleLicense(value),
    }),
  );
  filters.parameterBuckets.forEach((value) =>
    chips.push({
      key: `parameter-${value}`,
      label: label(options.parameterBuckets, value),
      onRemove: () => hook.toggleParameterBucket(value),
    }),
  );
  if (filters.memory !== null) {
    chips.push({
      key: 'memory',
      label: `Memory: ${filters.memory} GB`,
      onRemove: () => hook.setMemory(null),
    });
  }
  if (filters.context !== null) {
    chips.push({
      key: 'context',
      label: `Context: ${label(options.contextThresholds, String(filters.context))}`,
      onRemove: () => hook.setContext(null),
    });
  }
  if (filters.updatedWithinDays !== null) {
    chips.push({
      key: 'updated',
      label: `Updated: ${label(options.updatedRanges, String(filters.updatedWithinDays))}`,
      onRemove: () => hook.setUpdatedWithinDays(null),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-full)] border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/15 pl-2.5 text-xs font-medium text-[var(--color-accent)]"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            className="flex min-h-11 min-w-11 items-center justify-center transition-opacity hover:opacity-60"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={hook.reset}
        className="min-h-11 px-2 text-xs text-[var(--color-text-muted)] underline underline-offset-2 transition-colors hover:text-[var(--color-text)]"
      >
        Clear all
      </button>
    </div>
  );
}
