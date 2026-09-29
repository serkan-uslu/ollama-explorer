'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Download, MemoryStick } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui/atoms/Badge';
import { CopyCommand } from '@/components/ui/molecules/CopyCommand';
import { estimateMemoryGiB, selectVariantForMemory } from '@/lib/data/model-math';
import { formatBytes, formatContextWindow, formatPulls, formatRam } from '@/lib/utils/format';
import type { ModelSummary } from '@/lib/types/model';
import { pickModelOfTheDay, utcDay } from './model-of-the-day';

function currentUtcDay() {
  return utcDay(new Date());
}

function subscribeToUtcDay(onChange: () => void) {
  let timer: number;

  function scheduleNextDay() {
    const now = Date.now();
    const nextDay = (Math.floor(now / 86_400_000) + 1) * 86_400_000;
    timer = window.setTimeout(
      () => {
        onChange();
        scheduleNextDay();
      },
      nextDay - now + 100,
    );
  }

  scheduleNextDay();
  return () => window.clearTimeout(timer);
}

interface ModelOfTheDayProps {
  models: ModelSummary[];
  initialUtcDay: number;
}

export function ModelOfTheDay({ models, initialUtcDay }: ModelOfTheDayProps) {
  const day = useSyncExternalStore(subscribeToUtcDay, currentUtcDay, () => initialUtcDay);
  const model = pickModelOfTheDay(models, day);
  if (!model) return null;

  const variant = selectVariantForMemory(model, null, 'local');
  const estimatedMemory = estimateMemoryGiB(variant?.download_size_bytes);
  const labels = [
    ...new Set([...model.parameter_sizes, ...model.capabilities, ...model.applications]),
  ].slice(0, 5);

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-20">
        <div className="mb-6 flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Model of the Day
          </p>
          <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
          <p className="hidden text-xs text-[var(--color-text-subtle)] sm:block">
            Deterministic daily pick from popular local models
          </p>
        </div>

        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/models/${model.slug}`}
                  className="group inline-flex min-w-0 items-center gap-2 break-words text-2xl font-semibold tracking-tight text-[var(--color-text)] underline-offset-4 [overflow-wrap:anywhere] hover:underline"
                >
                  {model.name}
                  <ArrowRight
                    size={18}
                    aria-hidden
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Badge variant="outline">Local</Badge>
                {model.license && <Badge variant="muted">{model.license}</Badge>}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
                {model.description}
              </p>

              {labels.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {labels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <dt className="flex items-center gap-1.5 text-[var(--color-text-subtle)]">
                    <Download size={14} aria-hidden /> Download
                  </dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">
                    {formatBytes(variant?.download_size_bytes)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[var(--color-text-subtle)]">
                    <MemoryStick size={14} aria-hidden /> Est. memory
                  </dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">
                    {formatRam(estimatedMemory)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-[var(--color-text-subtle)]">
                    <BookOpen size={14} aria-hidden /> Context
                  </dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">
                    {formatContextWindow(variant?.context_window)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-subtle)]">Popularity</dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">
                    {formatPulls(model.pulls)} pulls
                  </dd>
                </div>
              </dl>

              {variant ? (
                <CopyCommand command={`ollama run ${variant.ref}`} modelName={model.name} />
              ) : (
                <p className="text-xs text-[var(--color-text-subtle)]">
                  No runnable local tag is available.
                </p>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
