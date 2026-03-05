'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/atoms/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorProps) {
  return (
    <main
      id="main"
      className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center"
    >
      <p className="text-7xl mb-4 select-none">⚠️</p>
      <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">Something went wrong</h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-8">
        An unexpected error occurred. You can try again or go back to the model list.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="md" onClick={reset}>
          Try again
        </Button>
        <Link href="/models">
          <Button variant="outline" size="md">
            Browse models
          </Button>
        </Link>
      </div>
    </main>
  );
}
