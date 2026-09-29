'use client';

import { useMemo, useState } from 'react';
import type { Variant } from '@/lib/types/model';
import { estimateMemoryGiB } from '@/lib/data/model-math';
import { formatBytes, formatContextWindow, formatRam } from '@/lib/utils/format';
import { CopyCommand } from '@/components/ui/molecules/CopyCommand';

interface VariantTableProps {
  variants: Variant[];
  modelName: string;
}

const MOBILE_PAGE_SIZE = 12;

export function VariantTable({ variants, modelName }: VariantTableProps) {
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState<'all' | 'local' | 'cloud'>('all');
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return variants.filter((variant) => {
      if (availability !== 'all' && variant.availability !== availability) return false;
      if (!needle) return true;
      return [
        variant.ref,
        variant.parameter?.raw,
        variant.quantization,
        ...variant.input_modalities,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [availability, query, variants]);

  return (
    <section aria-labelledby="variants-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="variants-heading" className="text-sm font-semibold text-[var(--color-text)]">
            Runnable variants
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
            Memory is a rough file-size estimate; context length, runtime and GPU offload change it.
          </p>
          <p aria-live="polite" className="mt-1 text-xs text-[var(--color-text-subtle)]">
            <span className="md:hidden">
              {Math.min(visibleCount, filtered.length)} of {filtered.length} matching variants
              shown.
            </span>
            <span className="hidden md:inline">
              {filtered.length} of {variants.length} variants shown.
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2 min-[360px]:flex-row">
          <label className="sr-only" htmlFor="variant-search">
            Search variants
          </label>
          <input
            id="variant-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(MOBILE_PAGE_SIZE);
            }}
            placeholder="Tag or quantization"
            className="h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] min-[360px]:w-auto min-[360px]:flex-1"
          />
          <label className="sr-only" htmlFor="variant-availability">
            Variant availability
          </label>
          <select
            id="variant-availability"
            value={availability}
            onChange={(event) => {
              setAvailability(event.target.value as 'all' | 'local' | 'cloud');
              setVisibleCount(MOBILE_PAGE_SIZE);
            }}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] min-[360px]:w-auto"
          >
            <option value="all">All</option>
            <option value="local">Local</option>
            <option value="cloud">Cloud</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
          No variants match this filter.
        </p>
      ) : (
        <div className="rounded-[var(--radius-md)] md:overflow-x-auto md:border md:border-[var(--color-border)]">
          <table className="block w-full text-xs md:table md:min-w-full md:border-collapse">
            <thead className="hidden bg-[var(--color-bg-subtle)] md:table-header-group">
              <tr className="border-b border-[var(--color-border)]">
                {[
                  'Tag',
                  'Type',
                  'Inputs',
                  'Digest',
                  'Download',
                  'Parameters',
                  'Quantization',
                  'Context',
                  'Est. memory',
                  'Run',
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-3 py-2.5 text-left font-medium whitespace-nowrap text-[var(--color-text-subtle)]"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="grid gap-3 md:table-row-group">
              {filtered.map((variant, index) => {
                const memory = estimateMemoryGiB(variant.download_size_bytes);
                return (
                  <tr
                    key={variant.ref}
                    className={`${index < visibleCount ? 'grid' : 'hidden md:table-row'} grid-cols-2 gap-x-3 gap-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 align-top md:table-row md:rounded-none md:border-x-0 md:border-t-0 md:bg-transparent md:p-0 md:last:border-0`}
                  >
                    <th
                      scope="row"
                      className="col-span-2 min-w-0 p-0 text-left font-mono font-medium text-[var(--color-text)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap"
                    >
                      <span className="flex min-w-0 items-start gap-2 md:block">
                        <span className="min-w-0 break-all">{variant.tag}</span>
                        {variant.is_default && (
                          <span className="shrink-0 rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 font-sans text-[10px] text-[var(--color-text-muted)] md:ml-2">
                            default
                          </span>
                        )}
                      </span>
                    </th>
                    <td className="min-w-0 p-0 capitalize text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Type
                      </span>
                      <span>{variant.availability}</span>
                    </td>
                    <td className="min-w-0 p-0 text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Inputs
                      </span>
                      <span className="break-words">
                        {variant.input_modalities.join(', ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="col-span-2 min-w-0 p-0 font-mono text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block font-sans text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Digest
                      </span>
                      <span className="break-all">{variant.digest ?? 'Unknown'}</span>
                    </td>
                    <td className="min-w-0 p-0 text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Download
                      </span>
                      <span>{formatBytes(variant.download_size_bytes)}</span>
                    </td>
                    <td className="min-w-0 p-0 text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Parameters
                      </span>
                      <span className="break-words">{variant.parameter?.raw ?? 'Unknown'}</span>
                    </td>
                    <td className="min-w-0 p-0 text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Quantization
                      </span>
                      <span className="break-words">{variant.quantization ?? 'Unknown'}</span>
                    </td>
                    <td className="min-w-0 p-0 text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Context
                      </span>
                      <span>{formatContextWindow(variant.context_window)}</span>
                    </td>
                    <td className="min-w-0 p-0 text-[var(--color-text-muted)] md:table-cell md:px-3 md:py-3 md:whitespace-nowrap">
                      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-subtle)] md:hidden">
                        Est. memory
                      </span>
                      <span>{memory === null ? 'Unknown' : `≈ ${formatRam(memory)}`}</span>
                    </td>
                    <td className="col-span-2 min-w-0 p-0 md:table-cell md:min-w-56 md:px-3 md:py-2">
                      <CopyCommand command={`ollama run ${variant.ref}`} modelName={modelName} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleCount < filtered.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + MOBILE_PAGE_SIZE)}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-text)] md:hidden"
            >
              Load {Math.min(MOBILE_PAGE_SIZE, filtered.length - visibleCount)} more variants
            </button>
          )}
        </div>
      )}
    </section>
  );
}
