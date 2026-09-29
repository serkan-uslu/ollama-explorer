'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useRef } from 'react';
import { FilterChip } from '@/components/ui/molecules/FilterChip';
import { Button } from '@/components/ui/atoms/Button';
import { Divider } from '@/components/ui/atoms/Divider';
import { trackFilterReset } from '@/lib/utils/ga';
import type { AvailabilityFilter, FacetCounts, FilterOptions } from '@/lib/types/filter';
import type { BrowseSort } from '@/lib/types/model';
import type { useFilters } from '@/lib/hooks/useFilters';
import { SORT_OPTIONS } from '@/lib/constants';

type FiltersHook = ReturnType<typeof useFilters>;

interface ModelFiltersProps {
  options: FilterOptions;
  counts: FacetCounts;
  hook: FiltersHook;
  totalResults: number;
  totalModels: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">
        {title}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

function labelWithCount(label: string, count: number | undefined) {
  return `${label} (${count ?? 0})`;
}

function SortSelect({ hook }: { hook: FiltersHook }) {
  const options = SORT_OPTIONS.filter(
    (option) => option.value !== 'relevance' || hook.filters.search.trim(),
  );
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">
      Sort by
      <select
        value={hook.filters.sort}
        onChange={(event) => hook.setSort(event.target.value as BrowseSort)}
        className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-normal normal-case text-[var(--color-text)] outline-none focus:border-[var(--color-border-strong)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterContent({
  options,
  counts,
  hook,
}: Pick<ModelFiltersProps, 'options' | 'counts' | 'hook'>) {
  const { filters } = hook;
  return (
    <div className="flex flex-col gap-5">
      <Section title="Run on">
        {options.availabilities.map((option) => (
          <FilterChip
            key={option.value}
            label={labelWithCount(option.label, counts.availability[option.value])}
            active={filters.availability === option.value}
            onToggle={() => hook.setAvailability(option.value as AvailabilityFilter)}
          />
        ))}
      </Section>

      <Divider />
      <Section title="Task">
        {options.tasks.map((option) => (
          <FilterChip
            key={option.value}
            label={labelWithCount(option.label, counts.tasks[option.value])}
            active={filters.tasks.includes(option.value)}
            onToggle={() => hook.toggleTask(option.value)}
          />
        ))}
      </Section>

      <Divider />
      <Section title="Memory budget">
        {options.memoryBudgets.map((option) => (
          <FilterChip
            key={option.value}
            label={labelWithCount(option.label, counts.memory[option.value])}
            active={filters.memory === Number(option.value)}
            onToggle={() => hook.setMemory(Number(option.value))}
          />
        ))}
        <p className="w-full text-xs leading-5 text-[var(--color-text-subtle)]">
          Estimated from download size. Long contexts, GPU offload and your OS can require more.
        </p>
      </Section>

      {options.capabilities.length > 0 && (
        <>
          <Divider />
          <Section title="Capability">
            {options.capabilities.map((option) => (
              <FilterChip
                key={option.value}
                label={labelWithCount(option.label, counts.capabilities[option.value])}
                active={filters.capabilities.includes(option.value)}
                onToggle={() => hook.toggleCapability(option.value)}
              />
            ))}
          </Section>
        </>
      )}

      {options.applications.length > 0 && (
        <>
          <Divider />
          <Section title="Application">
            {options.applications.map((option) => (
              <FilterChip
                key={option.value}
                label={labelWithCount(option.label, counts.applications[option.value])}
                active={filters.applications.includes(option.value)}
                onToggle={() => hook.toggleApplication(option.value)}
              />
            ))}
          </Section>
        </>
      )}

      <details className="group border-t border-[var(--color-border)] pt-5">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-[var(--color-text)]">
          More filters
        </summary>
        <div className="mt-5 flex flex-col gap-5">
          {options.modalities.length > 0 && (
            <>
              <Section title="Input modality">
                {options.modalities.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={labelWithCount(option.label, counts.modalities[option.value])}
                    active={filters.modalities.includes(option.value)}
                    onToggle={() => hook.toggleModality(option.value)}
                  />
                ))}
              </Section>
              <Divider />
            </>
          )}

          {options.quantizations.length > 0 && (
            <>
              <Section title="Quantization">
                {options.quantizations.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={labelWithCount(option.label, counts.quantizations[option.value])}
                    active={filters.quantizations.includes(option.value)}
                    onToggle={() => hook.toggleQuantization(option.value)}
                  />
                ))}
              </Section>
              <Divider />
            </>
          )}

          <Section title="Parameter size">
            {options.parameterBuckets.map((option) => (
              <FilterChip
                key={option.value}
                label={labelWithCount(option.label, counts.parameters[option.value])}
                active={filters.parameterBuckets.includes(option.value)}
                onToggle={() => hook.toggleParameterBucket(option.value)}
              />
            ))}
          </Section>

          <Divider />
          <Section title="Minimum context">
            {options.contextThresholds.map((option) => (
              <FilterChip
                key={option.value}
                label={labelWithCount(option.label, counts.context[option.value])}
                active={filters.context === Number(option.value)}
                onToggle={() => hook.setContext(Number(option.value))}
              />
            ))}
          </Section>

          <Divider />
          <Section title="Source updated">
            {options.updatedRanges.map((option) => (
              <FilterChip
                key={option.value}
                label={labelWithCount(option.label, counts.updated[option.value])}
                active={filters.updatedWithinDays === Number(option.value)}
                onToggle={() => hook.setUpdatedWithinDays(Number(option.value))}
              />
            ))}
          </Section>

          {options.families.length > 0 && (
            <>
              <Divider />
              <Section title="Family">
                {options.families.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={labelWithCount(option.label, counts.families[option.value])}
                    active={filters.families.includes(option.value)}
                    onToggle={() => hook.toggleFamily(option.value)}
                  />
                ))}
              </Section>
            </>
          )}

          {options.licenses.length > 0 && (
            <>
              <Divider />
              <Section title="Verified license">
                {options.licenses.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={labelWithCount(option.label, counts.licenses[option.value])}
                    active={filters.licenses.includes(option.value)}
                    onToggle={() => hook.toggleLicense(option.value)}
                  />
                ))}
              </Section>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

export function ModelFilters({
  options,
  counts,
  hook,
  totalResults,
  totalModels,
}: ModelFiltersProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sortOptions = SORT_OPTIONS.filter(
    (option) => option.value !== 'relevance' || hook.filters.search.trim(),
  );
  const handleReset = () => {
    hook.reset();
    trackFilterReset();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] py-3 sm:flex-nowrap lg:hidden">
        <p
          className="w-full text-sm text-[var(--color-text-muted)] sm:w-auto sm:shrink-0"
          aria-live="polite"
        >
          <span className="font-medium text-[var(--color-text)]">{totalResults}</span> of{' '}
          {totalModels}
        </p>
        <select
          value={hook.filters.sort}
          onChange={(event) => hook.setSort(event.target.value as BrowseSort)}
          className="h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)]"
          aria-label="Sort models"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="md"
          className="shrink-0"
          onClick={() => dialogRef.current?.showModal()}
        >
          <SlidersHorizontal size={14} aria-hidden />
          Filters{hook.activeCount > 0 ? ` (${hook.activeCount})` : ''}
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-none bg-transparent p-0 backdrop:bg-black/40 sm:w-[min(92vw,28rem)]"
        aria-labelledby="mobile-filter-title"
      >
        <div className="flex h-full min-h-0 flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <h2 id="mobile-filter-title" className="text-sm font-semibold">
              Filters{hook.activeCount > 0 ? ` (${hook.activeCount})` : ''}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="flex min-h-11 min-w-11 items-center justify-center text-[var(--color-text-muted)]"
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-gutter:stable]">
            <FilterContent options={options} counts={counts} hook={hook} />
          </div>
          <div className="flex shrink-0 gap-3 border-t border-[var(--color-border)] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button variant="ghost" size="md" className="flex-1" onClick={handleReset}>
              Reset all
            </Button>
            <form method="dialog" className="flex-1">
              <Button type="submit" size="md" className="w-full">
                Show {totalResults}
              </Button>
            </form>
          </div>
        </div>
      </dialog>

      <aside
        className="sticky top-[calc(3.5rem+1.5rem)] hidden max-h-[calc(100dvh-6.5rem)] w-64 shrink-0 flex-col gap-5 overflow-y-auto overscroll-contain pb-4 pr-2 [scrollbar-gutter:stable] lg:flex xl:w-72"
        aria-label="Model filters"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Filters{hook.activeCount > 0 ? ` (${hook.activeCount})` : ''}
          </p>
          {hook.activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset all
            </Button>
          )}
        </div>
        <SortSelect hook={hook} />
        <FilterContent options={options} counts={counts} hook={hook} />
      </aside>
    </>
  );
}
