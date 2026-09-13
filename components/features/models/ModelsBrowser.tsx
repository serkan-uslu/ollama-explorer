'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModelFilters } from './ModelFilters';
import { ModelGrid } from './ModelGrid';
import { ActiveFilters } from './ActiveFilters';
import { SearchInput } from '@/components/ui/molecules';
import { BrowseLayout } from '@/components/templates';
import { ScrollToTop } from '@/components/ui/atoms';
import { useFilters, useDebounce } from '@/lib/hooks';
import { filterAndSortModels } from '@/lib/data';
import type { Model } from '@/lib/types';
import type { FilterOptions } from '@/lib/types';

interface ModelsBrowserProps {
  allModels: Model[];
  filterOptions: FilterOptions;
}

export function ModelsBrowser({ allModels, filterOptions }: ModelsBrowserProps) {
  const hook = useFilters();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const debouncedSearch = useDebounce(hook.filters.search, 300);

  // Pre-fill use case filter from ?useCase= URL param (e.g. from UseCaseShowcase links)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const useCase = searchParams.get('useCase');
    if (useCase && !hook.filters.useCases.includes(useCase)) {
      hook.toggleUseCase(useCase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    return filterAndSortModels({ ...hook.filters, search: debouncedSearch });
  }, [hook.filters, debouncedSearch]);

  return (
    <>
      <BrowseLayout
        search={
          <SearchInput
            value={hook.filters.search}
            onChange={hook.setSearch}
            className="w-full"
            resultCount={results.length}
          />
        }
        sidebar={
          <ModelFilters
            options={filterOptions}
            hook={hook}
            totalResults={results.length}
            totalModels={allModels.length}
          />
        }
        chips={<ActiveFilters hook={hook} options={filterOptions} />}
        count={
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing <span className="font-medium text-[var(--color-text)]">{results.length}</span>{' '}
            of {allModels.length} models
          </p>
        }
        results={<ModelGrid models={results} />}
      />
      <ScrollToTop />
    </>
  );
}
