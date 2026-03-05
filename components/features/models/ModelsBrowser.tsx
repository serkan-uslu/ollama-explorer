'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModelFilters } from './ModelFilters';
import { ModelGrid } from './ModelGrid';
import { ActiveFilters } from './ActiveFilters';
import { SearchInput } from '@/components/ui/molecules';
import { BrowseLayout } from '@/components/templates';
import { ScrollToTop, Button } from '@/components/ui/atoms';
import { useFilters, useDebounce } from '@/lib/hooks';
import { filterAndSortModels } from '@/lib/data';
import { ITEMS_PER_PAGE } from '@/lib/constants';
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
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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
    // allModels is stable (server prop) and not used inside filterAndSortModels
  }, [hook.filters, debouncedSearch]);

  // Reset pagination whenever the filtered results change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [results]);

  const visibleModels = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

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
            Showing{' '}
            <span className="font-medium text-[var(--color-text)]">{visibleModels.length}</span> of{' '}
            {results.length} models
          </p>
        }
        results={
          <>
            <ModelGrid models={visibleModels} />
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                >
                  Load more ({results.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </>
        }
      />
      <ScrollToTop />
    </>
  );
}
