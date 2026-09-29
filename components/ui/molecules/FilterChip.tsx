'use client';

import { cn } from '@/lib/utils/cn';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onToggle: () => void;
  className?: string;
}

export function FilterChip({ label, active = false, onToggle, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-full)] border px-3 text-xs font-medium transition-colors cursor-pointer select-none',
        active
          ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)] border-[var(--color-accent)]'
          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]',
        className,
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
