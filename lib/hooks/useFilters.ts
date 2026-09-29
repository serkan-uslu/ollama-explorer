'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createDefaultFilters,
  filtersToSearchParams,
  parseFiltersFromSearchParams,
} from '@/lib/data/filter-url';
import type { ActiveFilters, AvailabilityFilter, FilterOptions } from '@/lib/types/filter';
import type { BrowseSort } from '@/lib/types/model';

type FilterUpdate = (current: ActiveFilters) => ActiveFilters;

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function useFilters(options: FilterOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const allowlist = useMemo(
    () => ({
      capabilities: new Set(options.capabilities.map((option) => option.value)),
      applications: new Set(options.applications.map((option) => option.value)),
      modalities: new Set(options.modalities.map((option) => option.value)),
      quantizations: new Set(options.quantizations.map((option) => option.value)),
      families: new Set(options.families.map((option) => option.value)),
      licenses: new Set(options.licenses.map((option) => option.value)),
    }),
    [options],
  );
  const [filters, setFilters] = useState(createDefaultFilters);
  const [urlReady, setUrlReady] = useState(false);
  const filtersRef = useRef(filters);
  const urlFilters = useMemo(
    () => parseFiltersFromSearchParams(new URLSearchParams(searchString), allowlist),
    [allowlist, searchString],
  );
  const isUrlSynchronized =
    filtersToSearchParams(urlFilters).toString() === filtersToSearchParams(filters).toString();

  const writeUrl = useCallback(
    (next: ActiveFilters, replace = false) => {
      const query = filtersToSearchParams(next).toString();
      const url = query ? `${pathname}?${query}` : pathname;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router],
  );

  const commit = useCallback(
    (update: FilterUpdate, resetPage = true, replace = false) => {
      const updated = update(filtersRef.current);
      const next = resetPage ? { ...updated, page: 1 } : updated;
      filtersRef.current = next;
      setFilters(next);
      writeUrl(next, replace);
    },
    [writeUrl],
  );

  useEffect(() => {
    if (
      filtersToSearchParams(urlFilters).toString() !==
      filtersToSearchParams(filtersRef.current).toString()
    ) {
      filtersRef.current = urlFilters;
      // URL changes can come from browser back/forward, outside this hook's event handlers.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(urlFilters);
    }
    if (!urlReady) {
      setUrlReady(true);
    }
  }, [urlFilters, urlReady]);

  const setSearch = useCallback(
    (search: string) => {
      commit(
        (current) => ({
          ...current,
          search,
          sort:
            search && !current.search && current.sort === 'popular'
              ? 'relevance'
              : !search && current.sort === 'relevance'
                ? 'popular'
                : current.sort,
        }),
        true,
        true,
      );
    },
    [commit],
  );

  const setAvailability = useCallback(
    (availability: AvailabilityFilter) => commit((current) => ({ ...current, availability })),
    [commit],
  );
  const toggleTask = useCallback(
    (task: string) => commit((current) => ({ ...current, tasks: toggle(current.tasks, task) })),
    [commit],
  );
  const toggleCapability = useCallback(
    (capability: string) =>
      commit((current) => ({
        ...current,
        capabilities: toggle(current.capabilities, capability),
      })),
    [commit],
  );
  const toggleApplication = useCallback(
    (application: string) =>
      commit((current) => ({
        ...current,
        applications: toggle(current.applications, application),
      })),
    [commit],
  );
  const toggleModality = useCallback(
    (modality: string) =>
      commit((current) => ({ ...current, modalities: toggle(current.modalities, modality) })),
    [commit],
  );
  const toggleQuantization = useCallback(
    (quantization: string) =>
      commit((current) => ({
        ...current,
        quantizations: toggle(current.quantizations, quantization),
      })),
    [commit],
  );
  const toggleFamily = useCallback(
    (family: string) =>
      commit((current) => ({ ...current, families: toggle(current.families, family) })),
    [commit],
  );
  const toggleLicense = useCallback(
    (license: string) =>
      commit((current) => ({ ...current, licenses: toggle(current.licenses, license) })),
    [commit],
  );
  const toggleParameterBucket = useCallback(
    (bucket: string) =>
      commit((current) => ({
        ...current,
        parameterBuckets: toggle(current.parameterBuckets, bucket),
      })),
    [commit],
  );
  const setMemory = useCallback(
    (memory: number | null) =>
      commit((current) => ({ ...current, memory: current.memory === memory ? null : memory })),
    [commit],
  );
  const setContext = useCallback(
    (context: number | null) =>
      commit((current) => ({ ...current, context: current.context === context ? null : context })),
    [commit],
  );
  const setUpdatedWithinDays = useCallback(
    (days: number | null) =>
      commit((current) => ({
        ...current,
        updatedWithinDays: current.updatedWithinDays === days ? null : days,
      })),
    [commit],
  );
  const setSort = useCallback(
    (sort: BrowseSort) =>
      commit((current) => ({
        ...current,
        sort: sort === 'relevance' && !current.search.trim() ? 'popular' : sort,
      })),
    [commit],
  );
  const setPage = useCallback(
    (page: number) =>
      commit((current) => ({ ...current, page: Math.max(1, Math.floor(page)) }), false),
    [commit],
  );
  const reset = useCallback(() => {
    const next = createDefaultFilters();
    filtersRef.current = next;
    setFilters(next);
    writeUrl(next);
  }, [writeUrl]);

  const activeCount = useMemo(
    () =>
      filters.tasks.length +
      filters.capabilities.length +
      filters.applications.length +
      filters.modalities.length +
      filters.quantizations.length +
      filters.families.length +
      filters.licenses.length +
      filters.parameterBuckets.length +
      (filters.availability === 'local' ? 0 : 1) +
      (filters.memory === null ? 0 : 1) +
      (filters.context === null ? 0 : 1) +
      (filters.updatedWithinDays === null ? 0 : 1),
    [filters],
  );

  return {
    filters,
    isReady: urlReady && isUrlSynchronized,
    activeCount,
    setSearch,
    setAvailability,
    toggleTask,
    toggleCapability,
    toggleApplication,
    toggleModality,
    toggleQuantization,
    toggleFamily,
    toggleLicense,
    toggleParameterBucket,
    setMemory,
    setContext,
    setUpdatedWithinDays,
    setSort,
    setPage,
    reset,
  };
}
