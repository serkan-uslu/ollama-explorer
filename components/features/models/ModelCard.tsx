import Link from 'next/link';
import { Badge } from '@/components/ui/atoms/Badge';
import { CompareToggle } from '@/components/ui/atoms/CompareToggle';
import { CopyCommand } from '@/components/ui/molecules/CopyCommand';
import { estimateMemoryGiB, selectVariantForFilters } from '@/lib/data/model-math';
import {
  formatBytes,
  formatContextWindow,
  formatDate,
  formatPulls,
  formatRam,
} from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { VariantCandidate, VariantSelectionFilters } from '@/lib/data/model-math';
import type { ModelSummary } from '@/lib/types/model';

export type ModelCardModel = ModelSummary;

interface ModelCardProps {
  model: ModelCardModel;
  filters: VariantSelectionFilters;
  exactVariant?: VariantCandidate | null;
  exactVariantResolved?: boolean;
  className?: string;
}

export function ModelCard({
  model,
  filters,
  exactVariant,
  exactVariantResolved = false,
  className,
}: ModelCardProps) {
  const variant = exactVariantResolved
    ? (exactVariant ?? null)
    : selectVariantForFilters(model, filters);
  const estimatedMemory = estimateMemoryGiB(variant?.download_size_bytes);
  const parameterLabels = model.parameter_sizes.slice(0, 4);

  return (
    <article
      role="listitem"
      className={cn(
        'flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[0_2px_8px_0_rgb(0_0_0/0.08)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_0_rgb(0_0_0/0.12)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/models/${model.slug}`}
            className="text-base font-semibold text-[var(--color-text)] underline-offset-2 hover:underline"
          >
            {model.name}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={model.availability === 'cloud' ? 'muted' : 'outline'} size="sm">
              {model.availability === 'both' ? 'Local + cloud' : model.availability}
            </Badge>
            {model.license && (
              <Badge variant="muted" size="sm">
                {model.license}
              </Badge>
            )}
          </div>
        </div>
        <CompareToggle modelId={model.slug} modelName={model.name} />
      </div>

      <p className="line-clamp-3 flex-1 text-sm leading-5 text-[var(--color-text-muted)]">
        {model.description}
      </p>

      {model.applications.length > 0 && (
        <p className="text-xs text-[var(--color-text-subtle)]">
          <span className="font-medium text-[var(--color-text-muted)]">Works with:</span>{' '}
          {model.applications.slice(0, 3).join(' · ')}
        </p>
      )}

      {(parameterLabels.length > 0 || model.capabilities.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {parameterLabels.map((parameter) => (
            <Badge key={parameter} variant="muted" size="sm">
              {parameter}
            </Badge>
          ))}
          {model.capabilities.map((capability) => (
            <Badge key={capability} variant="outline" size="sm">
              {capability}
            </Badge>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[var(--color-border)] pt-4 text-xs">
        <div>
          <dt className="text-[var(--color-text-subtle)]">Download</dt>
          <dd className="font-medium text-[var(--color-text-muted)]">
            {formatBytes(variant?.download_size_bytes)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-subtle)]">Est. memory</dt>
          <dd className="font-medium text-[var(--color-text-muted)]">
            {formatRam(estimatedMemory)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-subtle)]">Context</dt>
          <dd className="font-medium text-[var(--color-text-muted)]">
            {formatContextWindow(variant?.context_window)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-subtle)]">Popularity</dt>
          <dd className="font-medium text-[var(--color-text-muted)]">
            {formatPulls(model.pulls)} pulls
          </dd>
        </div>
      </dl>

      <p className="text-[11px] text-[var(--color-text-subtle)]">
        Source updated {formatDate(model.source_updated_at)}
      </p>

      {variant ? (
        <CopyCommand command={`ollama run ${variant.ref}`} modelName={model.name} />
      ) : exactVariantResolved ? (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] px-3 py-3 text-xs text-[var(--color-text-subtle)]">
          No single runnable tag matches every selected variant filter.
        </p>
      ) : (
        <p className="rounded-[var(--radius-md)] bg-[var(--color-bg-muted)] px-3 py-3 text-xs text-[var(--color-text-subtle)]">
          No runnable tag is available for this selection.
        </p>
      )}
    </article>
  );
}
