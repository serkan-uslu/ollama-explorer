import type { Metadata } from 'next';
import Link from 'next/link';
import { Divider } from '@/components/ui/atoms/Divider';
import { buttonClassName } from '@/components/ui/atoms/Button';
import { CheckCircle2, Circle } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Roadmap',
  description:
    'See what Ollama Explorer ships today and which additions are deliberately deferred.',
  alternates: {
    canonical: 'https://ollama-explorer.vercel.app/roadmap',
  },
  openGraph: {
    url: 'https://ollama-explorer.vercel.app/roadmap',
    title: 'Roadmap | Ollama Model Explorer',
    description: 'Current scope and deferred ideas for Ollama Explorer.',
  },
};

const ROADMAP_ITEMS = [
  {
    title: 'Source-backed Schema-v2 Catalog',
    description:
      'Static browse summaries and per-model variant files generated from Ollama source pages.',
    status: 'completed',
  },
  {
    title: 'Exact Variant Commands',
    description:
      'Local and cloud tags stay intact through filtering, detail pages and copy actions.',
    status: 'completed',
  },
  {
    title: 'Memory-aware Discovery',
    description:
      'Browse and compare likely-to-fit local variants with a clearly labelled size-based estimate.',
    status: 'completed',
  },
  {
    title: 'Shareable Filters and Comparison',
    description: 'URL-synced discovery plus source-backed comparison for up to four models.',
    status: 'completed',
  },
  {
    title: 'Measured Hardware Benchmarks',
    description: 'Apple Silicon, CPU and GPU measurements for RAM, VRAM and tokens per second.',
    status: 'planned',
  },
  {
    title: 'Local Ollama Connection',
    description: 'Use /api/tags to mark installed models and launch them directly.',
    status: 'planned',
  },
  {
    title: 'Verified Family and License Metadata',
    description: 'Source-backed family/license names and a commercial-use filter.',
    status: 'planned',
  },
  {
    title: 'Controlled Benchmark Comparison',
    description: 'Compare the same model, tag and quantization on documented hardware and methods.',
    status: 'planned',
  },
  {
    title: 'Catalog History and Alerts',
    description: 'Model and pull changes, trending models and opt-in notifications.',
    status: 'planned',
  },
  {
    title: 'Local Favorites and Shortlists',
    description: 'Browser-local saved models without introducing an account system.',
    status: 'planned',
  },
  {
    title: 'Semantic Search',
    description:
      'Only if search metrics show that the deterministic Fuse.js experience is insufficient.',
    status: 'planned',
  },
  {
    title: 'Versioned Public API',
    description: 'Only after independent consumers need more than the published static JSON.',
    status: 'planned',
  },
  {
    title: 'Accounts and Community',
    description: 'Cloud sync, comments and ratings only after measured demand.',
    status: 'planned',
  },
  {
    title: 'More Languages and Registries',
    description:
      'Localized UI and additional open-license registries after the core pipeline proves itself.',
    status: 'planned',
  },
];

export default function RoadmapPage() {
  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] tracking-tight">
          Roadmap
        </h1>
        <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
          The current product is a static, source-backed catalog for choosing an Ollama model and
          exact tag. Checkmarks are shipped; open circles are ideas kept outside the current scope.
        </p>
      </div>

      <Divider />

      {/* Roadmap List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Shipped and deferred</h2>
        <div className="flex flex-col gap-3">
          {ROADMAP_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] transition-colors hover:border-[var(--color-border-strong)]"
            >
              <div className="mt-0.5 shrink-0 text-[var(--color-text-subtle)]">
                {item.status === 'completed' ? (
                  <CheckCircle2 size={18} className="text-[var(--color-accent)]" />
                ) : (
                  <Circle size={18} />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[var(--color-text)]">{item.title}</span>
                <span className="text-sm text-[var(--color-text-muted)]">{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Support / OSS */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Help Build the Future</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          The Explorer code is MIT licensed and community-driven. Model licenses vary and should be
          checked at their source. Contributions to the catalog, interface and deferred ideas are
          welcome on GitHub.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <a
            href="https://github.com/serkan-uslu/ollama-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName()}
          >
            Contribute on GitHub
          </a>
          <Link href="/models" className={buttonClassName('outline')}>
            Browse current models
          </Link>
        </div>
      </div>
    </main>
  );
}
