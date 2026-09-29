'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { resolveCompareModels } from '@/lib/data/compare';
import { estimateMemoryGiB, selectVariantForMemory } from '@/lib/data/model-math';
import { Badge } from '@/components/ui/atoms/Badge';
import { CopyCommand } from '@/components/ui/molecules/CopyCommand';
import {
  formatBytes,
  formatContextWindow,
  formatDate,
  formatPulls,
  formatRam,
} from '@/lib/utils/format';
import type { LegacyIdMap, ModelSummary } from '@/lib/types/model';

interface Props {
  models: ModelSummary[];
  legacyIds: LegacyIdMap;
}

interface Row {
  label: string;
  value: (model: ModelSummary) => string;
}

function memoryFrom(value: string | null): number | null {
  const memory = Number(value);
  return [8, 16, 32, 64].includes(memory) ? memory : null;
}

export function ComparePageClient({ models: allModels, legacyIds }: Props) {
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [hydratedSearch, setHydratedSearch] = useState('');
  useEffect(() => {
    // Static export cannot know the browser query string during prerendering.
    setHydratedSearch(search);
  }, [search]);
  const params = new URLSearchParams(hydratedSearch);
  const memory = memoryFrom(params.get('memory'));
  const bySlug = new Map(allModels.map((model) => [model.slug, model]));
  const keys = [
    ...params.getAll('model'),
    ...params.getAll('ids').flatMap((value) => value.split(',')),
  ];
  const models = resolveCompareModels(keys, (key) => bySlug.get(legacyIds[key] ?? key));
  const variants = new Map(
    models.map((model) => [model.slug, selectVariantForMemory(model, memory)]),
  );

  const rows: Row[] = [
    { label: 'Availability', value: (model) => model.availability },
    { label: 'Selected tag', value: (model) => variants.get(model.slug)?.ref ?? 'Unknown' },
    {
      label: 'Download',
      value: (model) => formatBytes(variants.get(model.slug)?.download_size_bytes),
    },
    {
      label: 'Estimated memory',
      value: (model) => {
        const estimate = estimateMemoryGiB(variants.get(model.slug)?.download_size_bytes);
        return estimate === null ? 'Unknown' : `≈ ${formatRam(estimate)}`;
      },
    },
    {
      label: 'Context',
      value: (model) => formatContextWindow(variants.get(model.slug)?.context_window),
    },
    {
      label: 'Input modalities',
      value: (model) => variants.get(model.slug)?.input_modalities.join(', ') || 'Unknown',
    },
    {
      label: 'Parameters',
      value: (model) =>
        variants.get(model.slug)?.parameter?.raw || model.parameter_sizes.join(', ') || 'Unknown',
    },
    { label: 'Capabilities', value: (model) => model.capabilities.join(', ') || 'None listed' },
    { label: 'Applications', value: (model) => model.applications.join(', ') || 'None listed' },
    { label: 'Family', value: (model) => model.family ?? 'Unknown' },
    { label: 'License', value: (model) => model.license ?? 'Not verified' },
    { label: 'Pulls', value: (model) => formatPulls(model.pulls) },
    { label: 'Source updated', value: (model) => formatDate(model.source_updated_at) },
  ];

  return (
    <main
      id="main"
      className="mx-auto min-h-[calc(100dvh-3.5rem)] max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 md:py-10 lg:px-12"
    >
      <Link
        href="/models"
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={15} aria-hidden />
        Back to models
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Compare models
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {models.length} of 4 models selected. Unknown values stay unknown.
          </p>
        </div>
        {models.length > 0 && (
          <form method="get" className="flex w-full items-end gap-2 sm:w-auto">
            {models.map((model) => (
              <input key={model.slug} type="hidden" name="model" value={model.slug} />
            ))}
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-[var(--color-text-subtle)] sm:flex-none">
              Memory budget
              <select
                name="memory"
                defaultValue={memory ?? ''}
                className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)]"
              >
                <option value="">No budget</option>
                {[8, 16, 32, 64].map((budget) => (
                  <option key={budget} value={budget}>
                    {budget} GB
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="h-11 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-on-accent)]"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {models.length < 2 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="max-w-md text-[var(--color-text-muted)]">
            Select at least two models from the catalog. Duplicate and unknown keys are ignored, and
            only the first four valid models are compared.
          </p>
          <Link
            href="/models"
            className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)]"
          >
            Choose models
          </Link>
        </div>
      ) : (
        <>
          <p
            id="comparison-scroll-hint"
            className="mb-2 text-xs text-[var(--color-text-subtle)] xl:sr-only"
          >
            Scroll sideways to see every model; field names stay visible.
          </p>
          <div
            role="region"
            aria-label="Model comparison"
            aria-describedby="comparison-scroll-hint"
            tabIndex={0}
            className="max-w-full overflow-x-auto overscroll-x-contain rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] [contain:paint]"
          >
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                  <th
                    scope="col"
                    className="sticky left-0 z-20 w-28 min-w-28 border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)] sm:w-40 sm:min-w-40 sm:px-5"
                  >
                    Field
                  </th>
                  {models.map((model) => (
                    <th
                      key={model.slug}
                      scope="col"
                      className="min-w-44 px-3 py-3 text-left align-top min-[360px]:min-w-52 sm:min-w-60 sm:px-5 sm:py-4"
                    >
                      <Link
                        href={`/models/${model.slug}`}
                        className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-[var(--color-text)] [overflow-wrap:anywhere] hover:underline"
                      >
                        {model.name}
                      </Link>
                      <div className="mt-2">
                        <Badge variant={model.availability === 'cloud' ? 'muted' : 'outline'}>
                          {model.availability}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--color-border)]">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)] sm:px-5"
                  >
                    Run
                  </th>
                  {models.map((model) => {
                    const variant = variants.get(model.slug);
                    return (
                      <td
                        key={model.slug}
                        className="min-w-44 px-3 py-3 min-[360px]:min-w-52 sm:min-w-60 sm:px-5"
                      >
                        {variant ? (
                          <CopyCommand
                            command={`ollama run ${variant.ref}`}
                            modelName={model.name}
                          />
                        ) : (
                          <span className="text-sm text-[var(--color-text-subtle)]">
                            No fitting tag
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {rows.map((row) => {
                  const rowValues = models.map(row.value);
                  const differs = new Set(rowValues).size > 1;
                  return (
                    <tr
                      key={row.label}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-r border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)] sm:px-5"
                      >
                        {row.label}
                      </th>
                      {rowValues.map((value, index) => (
                        <td
                          key={models[index].slug}
                          className={`min-w-44 px-3 py-4 text-sm break-words text-[var(--color-text-muted)] [overflow-wrap:anywhere] min-[360px]:min-w-52 sm:min-w-60 sm:px-5 ${
                            differs ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
