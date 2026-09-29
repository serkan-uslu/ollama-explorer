import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllModels, getCatalog } from '@/lib/data/models';
import { Divider } from '@/components/ui/atoms/Divider';
import { buttonClassName } from '@/components/ui/atoms/Button';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Ollama Explorer helps you choose a local model and copy the exact Ollama command for a fitting variant.',
  alternates: {
    canonical: 'https://ollama-explorer.vercel.app/about',
  },
  openGraph: {
    url: 'https://ollama-explorer.vercel.app/about',
    title: 'About | Ollama Model Explorer',
    description: 'Learn about the Ollama Model Explorer project, its data sources and tech stack.',
  },
};

export default function AboutPage() {
  const models = getAllModels();
  const catalog = getCatalog();
  const capabilities = new Set(models.flatMap((model) => model.capabilities));
  const variants = models.reduce((count, model) => count + model.tag_count, 0);

  return (
    <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] tracking-tight">
          About Ollama Explorer
        </h1>
        <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
          Local AI has never been more accessible — but that accessibility comes with a new problem:{' '}
          <strong className="text-[var(--color-text)]">
            too many choices, too little structure.
          </strong>
        </p>
        <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-text)] transition-colors"
          >
            Ollama
          </a>{' '}
          provides the infrastructure to run language models locally with a single command. Its
          library is broad, but discovering which exact variant fits your task and memory budget
          takes more work than it should.
        </p>
        <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
          Ollama Explorer turns source-backed catalog and tag data into task, capability, context,
          parameter and memory-budget filters. It keeps unknown values unknown, labels memory as an
          estimate, and always leads to a complete <code>ollama run model:tag</code> command.
        </p>
        <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
          Whether you’re a developer picking a coding assistant, a researcher comparing reasoning
          models, or someone running AI on a laptop with 8 GB of RAM — Ollama Explorer gets you to
          the right starting point faster.
        </p>
      </div>

      <Divider />

      {/* Data */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Data</h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Model data was scraped from{' '}
          <a
            href="https://ollama.com/library"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[var(--color-text)] transition-colors"
          >
            ollama.com/library
          </a>{' '}
          and normalized into a compact catalog plus one detail file per model. Capabilities,
          applications and variants come from the source; the catalog does not use AI enrichment.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {[
            { label: 'Total models', value: models.length },
            {
              label: 'Local-capable',
              value: models.filter((model) => model.availability !== 'cloud').length,
            },
            {
              label: 'Cloud-only',
              value: models.filter((model) => model.availability === 'cloud').length,
            },
            { label: 'Capabilities', value: capabilities.size },
            { label: 'Variants', value: variants.toLocaleString('en-US') },
            { label: 'Last indexed', value: formatDate(catalog.generated_at) },
          ].map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
            >
              <p className="text-xs text-[var(--color-text-subtle)] mb-1">{s.label}</p>
              <p className="text-lg font-semibold text-[var(--color-text)]">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Tech stack */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Tech stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'Next.js 16', desc: 'App Router, force-static, generateStaticParams' },
            { name: 'React 19', desc: 'Server Components + client interactivity' },
            { name: 'TypeScript 5', desc: 'Strict mode, zero errors' },
            { name: 'Tailwind CSS v4', desc: 'CSS-native design tokens, no config file' },
            { name: 'Fuse.js', desc: 'Fuzzy search with field weights and typo tolerance' },
            { name: 'Lucide Icons', desc: 'Consistent icon system' },
            { name: 'Atomic Design', desc: 'atoms → molecules → templates → pages' },
            { name: 'Geist Font', desc: 'Geist Sans + Geist Mono via next/font' },
          ].map((t) => (
            <div
              key={t.name}
              className="flex flex-col gap-0.5 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
            >
              <span className="text-sm font-medium text-[var(--color-text)]">{t.name}</span>
              <span className="text-xs text-[var(--color-text-subtle)]">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/models" className={buttonClassName()}>
          Browse models
        </Link>
        <a
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName('outline')}
        >
          Visit Ollama
        </a>
      </div>
    </main>
  );
}
