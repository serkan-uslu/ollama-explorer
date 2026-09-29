import { ModelCard } from './ModelCard';
import { Button } from '@/components/ui/atoms/Button';
import { cn } from '@/lib/utils/cn';
import type { ActiveFilters } from '@/lib/types/filter';
import type { VariantCandidate } from '@/lib/data/model-math';
import type { ModelSummary } from '@/lib/types/model';

interface ModelGridProps {
  models: ModelSummary[];
  totalCount: number;
  filters: ActiveFilters;
  exactVariants?: ReadonlyMap<string, VariantCandidate>;
  onLoadMore: () => void;
  onReset: () => void;
  className?: string;
}

export function ModelGrid({
  models,
  totalCount,
  filters,
  exactVariants,
  onLoadMore,
  onReset,
  className,
}: ModelGridProps) {
  if (totalCount === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center px-4 py-24 text-center"
        role="status"
      >
        <p className="mb-4 text-4xl" aria-hidden>
          ⬡
        </p>
        <p className="text-base font-medium text-[var(--color-text)]">No matching models</p>
        <p className="mt-1 max-w-xs text-sm text-[var(--color-text-muted)]">
          Try a broader search or clear your filters.
        </p>
        <Button variant="outline" size="md" className="mt-5" onClick={onReset}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}
        role="list"
      >
        {models.map((model) => (
          <ModelCard
            key={model.slug}
            model={model}
            filters={filters}
            exactVariant={exactVariants?.get(model.slug) ?? null}
            exactVariantResolved={exactVariants !== undefined}
          />
        ))}
      </div>
      {models.length < totalCount && (
        <Button variant="outline" size="lg" className="self-center" onClick={onLoadMore}>
          Load more ({totalCount - models.length} remaining)
        </Button>
      )}
    </div>
  );
}
