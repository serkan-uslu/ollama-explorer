'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModelFilters } from './ModelFilters';
import { ModelGrid } from './ModelGrid';
import { ActiveFilters } from './ActiveFilters';
import { SearchInput } from '@/components/ui/molecules';
import { BrowseLayout } from '@/components/templates';
import { Button, ScrollToTop } from '@/components/ui/atoms';
import { useDebounce, useFilters } from '@/lib/hooks';
import { filterAndSortModels } from '@/lib/data/browse';
import { deriveFacetCounts } from '@/lib/data/filters';
import { needsExactVariantData } from '@/lib/data/model-math';
import { loadVariantIndex, resolveExactVariantMatches } from '@/lib/data/variant-index';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import type { FilterOptions, ModelSummary } from '@/lib/types';
import type { VariantIndex } from '@/lib/data/variant-index';

interface ModelsBrowserProps {
  allModels: ModelSummary[];
  filterOptions: FilterOptions;
}

export function ModelsBrowser({ allModels, filterOptions }: ModelsBrowserProps) {
  const hook = useFilters(filterOptions);
  const [variantIndexState, setVariantIndexState] = useState<{
    index: VariantIndex | null;
    status: 'loading' | 'ready' | 'error';
  }>({ index: null, status: 'loading' });
  const [variantIndexRetry, setVariantIndexRetry] = useState(0);
  const debouncedSearch = useDebounce(hook.filters.search, 200);
  const effectiveFilters = useMemo(
    () => ({ ...hook.filters, search: debouncedSearch }),
    [hook.filters, debouncedSearch],
  );
  const exactVariantDataNeeded = needsExactVariantData(effectiveFilters);

  useEffect(() => {
    if (!exactVariantDataNeeded || variantIndexState.index) return;
    let current = true;
    void loadVariantIndex()
      .then((index) => {
        if (current) setVariantIndexState({ index, status: 'ready' });
      })
      .catch(() => {
        if (current) setVariantIndexState({ index: null, status: 'error' });
      });
    return () => {
      current = false;
    };
  }, [exactVariantDataNeeded, variantIndexRetry, variantIndexState.index]);

  const aggregateResults = useMemo(
    () => filterAndSortModels(allModels, effectiveFilters),
    [allModels, effectiveFilters],
  );
  const exactMatches = useMemo(() => {
    if (!exactVariantDataNeeded) return { models: aggregateResults, variants: undefined };
    if (!variantIndexState.index) return { models: [], variants: undefined };
    return resolveExactVariantMatches(aggregateResults, variantIndexState.index, effectiveFilters);
  }, [aggregateResults, effectiveFilters, exactVariantDataNeeded, variantIndexState.index]);
  const results = exactMatches.models;
  const counts = useMemo(
    () =>
      deriveFacetCounts(
        allModels,
        effectiveFilters,
        filterOptions,
        exactVariantDataNeeded ? (variantIndexState.index ?? undefined) : undefined,
      ),
    [allModels, effectiveFilters, exactVariantDataNeeded, filterOptions, variantIndexState.index],
  );
  const visible = results.slice(0, hook.filters.page * ITEMS_PER_PAGE);
  const filtersPending = !hook.isReady;
  const variantIndexPending =
    filtersPending || (exactVariantDataNeeded && !variantIndexState.index);

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
            counts={counts}
            hook={hook}
            totalResults={results.length}
            totalModels={allModels.length}
          />
        }
        chips={<ActiveFilters hook={hook} options={filterOptions} />}
        count={
          <p className="text-sm text-[var(--color-text-muted)]" aria-live="polite">
            {variantIndexPending ? (
              filtersPending ? (
                'Restoring filters from the URL…'
              ) : (
                'Checking tags against every active variant filter…'
              )
            ) : (
              <>
                Showing{' '}
                <span className="font-medium text-[var(--color-text)]">{visible.length}</span> of{' '}
                {results.length} matching models
              </>
            )}
          </p>
        }
        results={
          variantIndexPending ? (
            <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
              {!filtersPending && variantIndexState.status === 'error' ? (
                <>
                  <p className="font-medium text-[var(--color-text)]" role="alert">
                    Exact variant data could not be loaded.
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Retry the index download or clear the variant filters.
                  </p>
                  <Button
                    variant="outline"
                    size="md"
                    className="mt-5"
                    onClick={() => {
                      setVariantIndexState({ index: null, status: 'loading' });
                      setVariantIndexRetry((value) => value + 1);
                    }}
                  >
                    Retry
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]" role="status">
                  {filtersPending ? 'Restoring filters…' : 'Loading exact variant data…'}
                </p>
              )}
            </div>
          ) : (
            <ModelGrid
              models={visible}
              totalCount={results.length}
              filters={hook.filters}
              exactVariants={exactMatches.variants}
              onLoadMore={() => hook.setPage(hook.filters.page + 1)}
              onReset={hook.reset}
            />
          )
        }
      />
      <ScrollToTop />
    </>
  );
}
