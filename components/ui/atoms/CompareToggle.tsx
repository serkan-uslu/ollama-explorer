'use client';

import { Plus, Check } from 'lucide-react';
import { useCompare } from '@/lib/context/CompareContext';
import { cn } from '@/lib/utils/cn';
import { trackCompareAdd, trackCompareRemove } from '@/lib/utils/ga';

interface CompareToggleProps {
  modelId: string;
  modelName: string;
}

export function CompareToggle({ modelId, modelName }: CompareToggleProps) {
  const { toggle, isSelected, ids } = useCompare();
  const selected = isSelected(modelId);
  const maxReached = ids.length >= 4 && !selected;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!maxReached) {
          toggle(modelId, modelName);

          // Track GA4 event
          if (selected) {
            trackCompareRemove(modelName, modelId);
          } else {
            trackCompareAdd(modelName, modelId);
          }
        }
      }}
      disabled={maxReached}
      aria-label={
        selected ? `Remove ${modelName} from comparison` : `Add ${modelName} to comparison`
      }
      aria-pressed={selected}
      title={
        maxReached
          ? 'Max 4 models can be compared'
          : selected
            ? 'Remove from comparison'
            : 'Add to comparison'
      }
      className={cn(
        'flex items-center justify-center min-w-11 min-h-11 rounded-full border transition-all duration-150',
        selected
          ? 'bg-(--color-accent) border-(--color-accent) text-(--color-on-accent)'
          : 'bg-(--color-bg) border-(--color-border) text-(--color-text-subtle) hover:border-(--color-border-strong) hover:text-(--color-text)',
        maxReached && 'opacity-30 cursor-not-allowed',
      )}
    >
      {selected ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
    </button>
  );
}
