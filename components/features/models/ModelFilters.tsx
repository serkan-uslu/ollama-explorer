'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { FilterChip } from '@/components/ui/molecules/FilterChip';
import { Button } from '@/components/ui/atoms/Button';
import { Divider } from '@/components/ui/atoms/Divider';
import { trackFilterApply, trackFilterRemove, trackFilterReset } from '@/lib/utils/ga';
import type { FilterOptions } from '@/lib/types/filter';
import type { Capability, Complexity, Domain, SpeedTier } from '@/lib/types/model';
import type { useFilters } from '@/lib/hooks/useFilters';
import { SORT_OPTIONS } from '@/lib/constants';

type FiltersHook = ReturnType<typeof useFilters>;

interface ModelFiltersProps {
  options: FilterOptions;
  hook: FiltersHook;
  totalResults: number;
  totalModels: number;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}

function FilterContent({ options, hook }: { options: FilterOptions; hook: FiltersHook }) {
  const {
    filters,
    toggleCapability,
    toggleDomain,
    toggleUseCase,
    toggleComplexity,
    toggleLanguage,
    toggleSpeedTier,
    toggleModelFamily,
    toggleCreatorOrg,
    toggleApplication,
    toggleFineTuned,
    toggleUncensored,
    setRamBucket,
    setParamSizeBucket,
    setContextWindowBucket,
  } = hook;

  // Wrapper functions to track filter changes
  const handleToggleCapability = (cap: Capability) => {
    toggleCapability(cap);
    const isRemoving = filters.capabilities.includes(cap);
    if (isRemoving) {
      trackFilterRemove('capability', cap);
    }
  };

  const handleToggleDomain = (domain: Domain) => {
    toggleDomain(domain);
    const isRemoving = filters.domains.includes(domain);
    if (isRemoving) {
      trackFilterRemove('domain', domain);
    }
  };

  const handleToggleUseCase = (uc: string) => {
    toggleUseCase(uc);
    const isRemoving = filters.useCases.includes(uc);
    if (isRemoving) {
      trackFilterRemove('use_case', uc);
    }
  };

  const handleToggleComplexity = (c: Complexity) => {
    toggleComplexity(c);
    const isRemoving = filters.complexities.includes(c);
    if (isRemoving) {
      trackFilterRemove('complexity', c);
    }
  };

  const handleToggleLanguage = (lang: string) => {
    toggleLanguage(lang);
    const isRemoving = filters.languages.includes(lang);
    if (isRemoving) {
      trackFilterRemove('language', lang);
    }
  };

  const handleToggleSpeedTier = (tier: SpeedTier) => {
    toggleSpeedTier(tier);
    const isRemoving = filters.speedTiers.includes(tier);
    if (isRemoving) {
      trackFilterRemove('speed_tier', tier);
    }
  };

  const handleToggleModelFamily = (family: string) => {
    toggleModelFamily(family);
    const isRemoving = filters.modelFamilies.includes(family);
    if (isRemoving) {
      trackFilterRemove('model_family', family);
    }
  };

  const handleToggleCreatorOrg = (org: string) => {
    toggleCreatorOrg(org);
    const isRemoving = filters.creatorOrgs.includes(org);
    if (isRemoving) {
      trackFilterRemove('creator_org', org);
    }
  };

  const handleToggleApplication = (app: string) => {
    toggleApplication(app);
    const isRemoving = filters.applications.includes(app);
    if (isRemoving) {
      trackFilterRemove('application', app);
    }
  };

  const handleToggleFineTuned = () => {
    toggleFineTuned();
    trackFilterRemove('fine_tuned', filters.isFineTuned ? 'true' : 'false');
  };

  const handleToggleUncensored = () => {
    toggleUncensored();
    trackFilterRemove('uncensored', filters.isUncensored ? 'true' : 'false');
  };

  const handleSetRamBucket = (bucket: string) => {
    setRamBucket(bucket);
    trackFilterApply('ram', bucket, 0);
  };

  const handleSetParamSizeBucket = (bucket: string) => {
    setParamSizeBucket(bucket);
    trackFilterApply('param_size', bucket, 0);
  };

  const handleSetContextWindowBucket = (bucket: string) => {
    setContextWindowBucket(bucket);
    trackFilterApply('context_window', bucket, 0);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Capabilities */}
      <Section title="Capability">
        <div className="flex flex-wrap gap-1.5">
          {options.capabilities.map((cap) => (
            <FilterChip
              key={cap}
              label={cap}
              active={filters.capabilities.includes(cap)}
              onToggle={() => handleToggleCapability(cap as Capability)}
            />
          ))}
        </div>
      </Section>

      <Divider />

      {/* Domain */}
      <Section title="Domain">
        <div className="flex flex-wrap gap-1.5">
          {options.domains.map((d) => (
            <FilterChip
              key={d}
              label={d}
              active={filters.domains.includes(d)}
              onToggle={() => handleToggleDomain(d as Domain)}
            />
          ))}
        </div>
      </Section>

      <Divider />

      {/* Complexity */}
      <Section title="Complexity">
        <div className="flex flex-wrap gap-1.5">
          {options.complexities.map((c) => (
            <FilterChip
              key={c}
              label={c ? c.charAt(0).toUpperCase() + c.slice(1) : c}
              active={filters.complexities.includes(c)}
              onToggle={() => handleToggleComplexity(c as Complexity)}
            />
          ))}
        </div>
      </Section>

      <Divider />

      {/* Param Size */}
      <Section title="Parameter Size">
        <div className="flex flex-wrap gap-1.5">
          {options.paramSizeBuckets.map((b) => {
            const key = `${b.min}-${b.max}`;
            return (
              <FilterChip
                key={key}
                label={b.label}
                active={filters.paramSizeBucket === key}
                onToggle={() => handleSetParamSizeBucket(key)}
              />
            );
          })}
        </div>
      </Section>

      <Divider />

      {/* RAM */}
      <Section title="RAM Required">
        <div className="flex flex-wrap gap-1.5">
          {options.ramBuckets.map((b) => {
            const key = `${b.min}-${b.max}`;
            return (
              <FilterChip
                key={key}
                label={b.label}
                active={filters.ramBucket === key}
                onToggle={() => handleSetRamBucket(key)}
              />
            );
          })}
        </div>
      </Section>

      <Divider />

      {/* Context Window */}
      <Section title="Context Window">
        <div className="flex flex-wrap gap-1.5">
          {options.contextWindowBuckets.map((b) => {
            const key = `${b.min}-${b.max}`;
            return (
              <FilterChip
                key={key}
                label={b.label}
                active={filters.contextWindowBucket === key}
                onToggle={() => handleSetContextWindowBucket(key)}
              />
            );
          })}
        </div>
      </Section>

      <Divider />

      {/* Use Cases */}
      <Section title="Use Case">
        <div className="flex flex-wrap gap-1.5">
          {options.useCases.map((uc) => (
            <FilterChip
              key={uc}
              label={uc}
              active={filters.useCases.includes(uc)}
              onToggle={() => handleToggleUseCase(uc)}
            />
          ))}
        </div>
      </Section>

      <Divider />

      {/* Language */}
      <Section title="Language">
        <div className="flex flex-wrap gap-1.5">
          {options.languages.map((lang) => (
            <FilterChip
              key={lang}
              label={lang}
              active={filters.languages.includes(lang)}
              onToggle={() => handleToggleLanguage(lang)}
            />
          ))}
        </div>
      </Section>

      {options.speedTiers.length > 0 && (
        <>
          <Divider />
          <Section title="Speed">
            <div className="flex flex-wrap gap-1.5">
              {options.speedTiers.map((tier) => (
                <FilterChip
                  key={tier}
                  label={tier.charAt(0).toUpperCase() + tier.slice(1)}
                  active={filters.speedTiers.includes(tier)}
                  onToggle={() => handleToggleSpeedTier(tier as SpeedTier)}
                />
              ))}
            </div>
          </Section>
        </>
      )}

      {options.modelFamilies.length > 0 && (
        <>
          <Divider />
          <Section title="Model Family">
            <div className="flex flex-wrap gap-1.5">
              {options.modelFamilies.map((family) => (
                <FilterChip
                  key={family}
                  label={family}
                  active={filters.modelFamilies.includes(family)}
                  onToggle={() => handleToggleModelFamily(family)}
                />
              ))}
            </div>
          </Section>
        </>
      )}

      {options.creatorOrgs.length > 0 && (
        <>
          <Divider />
          <Section title="Creator">
            <div className="flex flex-wrap gap-1.5">
              {options.creatorOrgs.map((org) => (
                <FilterChip
                  key={org}
                  label={org}
                  active={filters.creatorOrgs.includes(org)}
                  onToggle={() => handleToggleCreatorOrg(org)}
                />
              ))}
            </div>
          </Section>
        </>
      )}

      {options.applications.length > 0 && (
        <>
          <Divider />
          <Section title="Application">
            <div className="flex flex-wrap gap-1.5">
              {options.applications.map((app) => (
                <FilterChip
                  key={app}
                  label={app}
                  active={filters.applications.includes(app)}
                  onToggle={() => handleToggleApplication(app)}
                />
              ))}
            </div>
          </Section>
        </>
      )}

      <Divider />
      <Section title="Model Traits">
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label="Fine-tuned"
            active={filters.isFineTuned === true}
            onToggle={handleToggleFineTuned}
          />
          <FilterChip
            label="Uncensored"
            active={filters.isUncensored === true}
            onToggle={handleToggleUncensored}
          />
        </div>
      </Section>
    </div>
  );
}

export function ModelFilters({ options, hook, totalResults, totalModels }: ModelFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { filters, activeCount, reset, setSort } = hook;

  const handleReset = () => {
    reset();
    trackFilterReset();
  };

  return (
    <>
      {/* ── Mobile: trigger bar ── */}
      <div className="lg:hidden flex items-center justify-between gap-3 py-3 border-b border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-text)]">{totalResults}</span> of{' '}
          {totalModels} models
        </p>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
            <SlidersHorizontal size={14} />
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </div>
      </div>

      {/* ── Mobile: bottom sheet ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 bg-[var(--color-bg)] rounded-t-[var(--radius-lg)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <p className="font-semibold text-sm text-[var(--color-text)]">
                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <FilterContent options={options} hook={hook} />
            </div>
            <div className="px-5 py-4 border-t border-[var(--color-border)] flex gap-3">
              <Button variant="ghost" size="md" className="flex-1" onClick={handleReset}>
                Reset all
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setMobileOpen(false)}
              >
                Show {totalResults} results
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop: sticky sidebar ── */}
      <aside
        className="hidden lg:flex flex-col gap-5 w-64 xl:w-72 shrink-0 sticky top-[calc(3.5rem+1.5rem)]"
        aria-label="Filter sidebar"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </p>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset all
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wide">
            Sort by
          </p>
          <select
            value={filters.sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-[var(--radius-md)] bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] focus:border-[var(--color-border-strong)] outline-none cursor-pointer"
            aria-label="Sort models"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <FilterContent options={options} hook={hook} />
      </aside>
    </>
  );
}
