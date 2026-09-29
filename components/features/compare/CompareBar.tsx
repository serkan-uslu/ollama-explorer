'use client';

import { usePathname, useRouter } from 'next/navigation';
import { X, Scale } from 'lucide-react';
import { useCompare } from '@/lib/context/CompareContext';
import { Button } from '@/components/ui/atoms/Button';

export function CompareBar() {
  const { ids, names, clear } = useCompare();
  const router = useRouter();
  const pathname = usePathname();

  if (ids.length === 0 || pathname === '/models/compare') return null;

  function handleCompare() {
    const params = [...new Set(ids)]
      .slice(0, 4)
      .map((id) => `model=${encodeURIComponent(id)}`)
      .join('&');
    router.push(`/models/compare?${params}`);
  }

  return (
    <>
      <div aria-hidden className="h-[calc(7.5rem+env(safe-area-inset-bottom))] sm:h-24" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-5">
        <div className="pointer-events-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-(--color-border) bg-(--color-bg) px-3 py-3 shadow-lg sm:flex sm:flex-wrap sm:gap-3 sm:px-5">
          <span role="status" className="text-sm font-medium text-(--color-text)">
            {ids.length} / 4 selected
          </span>

          <div className="order-3 col-span-2 flex min-w-0 items-center gap-1.5 overflow-x-auto sm:order-none sm:col-auto sm:flex-wrap sm:overflow-visible">
            {ids.map((id) => (
              <span
                key={id}
                className="max-w-40 shrink-0 truncate rounded-full border border-(--color-border) bg-(--color-bg-muted) px-2.5 py-0.5 text-xs font-medium text-(--color-text-muted)"
              >
                {names[id] ?? id}
              </span>
            ))}
          </div>

          <div className="order-2 flex items-center justify-end gap-1 sm:order-none sm:ml-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="min-w-11"
              onClick={clear}
              aria-label="Clear selection"
            >
              <X size={14} aria-hidden />
              <span className="sr-only min-[360px]:not-sr-only">Clear</span>
            </Button>
            <Button size="sm" onClick={handleCompare} disabled={ids.length < 2}>
              <Scale size={14} aria-hidden />
              Compare
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
