import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ComparePageClient } from '@/components/features/compare/ComparePageClient';
import { getCatalog, getLegacyIdMap } from '@/lib/data/models';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Compare Models',
  description: 'Compare source-backed Ollama model and variant data side by side.',
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageClient models={getCatalog().models} legacyIds={getLegacyIdMap()} />
    </Suspense>
  );
}
