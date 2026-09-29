import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Brain,
  Code2,
  Database,
  Eye,
  Headphones,
  Search,
  Wrench,
} from 'lucide-react';
import { JsonLd } from '@/components/ui/atoms/JsonLd';
import { OlliVideo } from '@/components/features/home/OlliVideo';
import { ModelOfTheDay } from '@/components/features/models/ModelOfTheDay';
import { buildModelOfTheDayPool, utcDay } from '@/components/features/models/model-of-the-day';
import { getAllModels, getCatalog } from '@/lib/data/models';
import { formatDate } from '@/lib/utils/format';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Find the Right Local Ollama Model',
  description: 'Choose an Ollama model and exact runnable tag by task and memory budget.',
  alternates: { canonical: 'https://ollama-explorer.vercel.app' },
  openGraph: {
    url: 'https://ollama-explorer.vercel.app',
    title: 'Ollama Model Explorer',
    description: 'Choose an Ollama model and exact runnable tag for your machine.',
  },
};

const TASKS = [
  { value: 'chat', label: 'Chat & writing', icon: Bot },
  { value: 'coding', label: 'Coding', icon: Code2 },
  { value: 'vision', label: 'Vision', icon: Eye },
  { value: 'tools', label: 'Agents & tools', icon: Wrench },
  { value: 'reasoning', label: 'Reasoning', icon: Brain },
  { value: 'embedding', label: 'Embeddings', icon: Database },
  { value: 'audio', label: 'Audio', icon: Headphones },
] as const;

export default function HomePage() {
  const models = getAllModels();
  const catalog = getCatalog();
  const localCount = models.filter((model) => model.availability !== 'cloud').length;
  const cloudCount = models.filter((model) => model.availability !== 'local').length;
  const tagCount = models.reduce((total, model) => total + model.tag_count, 0);
  const modelOfTheDayPool = buildModelOfTheDayPool(models);
  const initialUtcDay = utcDay(new Date());

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ollama Model Explorer',
    url: 'https://ollama-explorer.vercel.app',
    description: 'Choose an Ollama model and exact runnable tag by task and memory budget.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://ollama-explorer.vercel.app/models?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main id="main" className="flex-1">
      <JsonLd data={websiteSchema} />

      <section className="px-6 py-14 sm:px-10 sm:py-16 lg:px-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[minmax(0,1fr)_260px] md:gap-16">
          <div>
            <BadgeText>Local-first Ollama discovery</BadgeText>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[var(--color-text)] sm:text-5xl">
              From “which model?” to the exact command.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Search source-backed model data, choose what your machine can handle, then copy the
              exact <code className="font-mono text-[var(--color-text)]">ollama run model:tag</code>{' '}
              command.
            </p>

            <form
              action="/models"
              method="get"
              role="search"
              className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row"
            >
              <input type="hidden" name="availability" value="local" />
              <label className="sr-only" htmlFor="home-model-search">
                Search Ollama models
              </label>
              <div className="relative flex-1">
                <Search
                  size={18}
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
                />
                <input
                  id="home-model-search"
                  name="q"
                  type="search"
                  placeholder="Search model, task or capability"
                  className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] pl-11 pr-4 text-base text-[var(--color-text)] shadow-[var(--shadow-sm)]"
                />
              </div>
              <button
                type="submit"
                className="h-12 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 text-sm font-medium text-[var(--color-on-accent)]"
              >
                Find models
              </button>
            </form>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <OlliVideo />
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-20">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-subtle)]">
            Start with your task
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {TASKS.map(({ value, label, icon: Icon }) => (
              <Link
                key={value}
                href={`/models?availability=local&task=${value}`}
                className="group flex min-h-28 flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-sm)]"
              >
                <Icon size={20} aria-hidden className="text-[var(--color-text-subtle)]" />
                <span className="flex items-center justify-between gap-2 text-sm font-medium text-[var(--color-text)]">
                  {label}
                  <ArrowRight
                    size={14}
                    aria-hidden
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:px-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <BadgeText>Then set a memory budget</BadgeText>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
              Show likely-to-fit local variants.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
              Estimates use download size plus transparent overhead. Long context, runtime and GPU
              offload can change real usage, so unknown data is never treated as zero.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[8, 16, 32, 64].map((memory) => (
              <Link
                key={memory}
                href={`/models?availability=local&memory=${memory}`}
                className="flex min-h-28 flex-col justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-center hover:border-[var(--color-border-strong)]"
              >
                <span className="text-2xl font-semibold text-[var(--color-text)]">{memory} GB</span>
                <span className="mt-1 text-xs text-[var(--color-text-subtle)]">Ollama budget</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ModelOfTheDay models={modelOfTheDayPool} initialUtcDay={initialUtcDay} />

      <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[var(--color-border)] sm:grid-cols-4">
          {[
            ['Local models', localCount],
            ['Cloud available', cloudCount],
            ['Source-listed tags', tagCount],
            ['Catalog generated', formatDate(catalog.generated_at)],
          ].map(([label, value]) => (
            <div key={label} className="bg-[var(--color-bg-subtle)] px-6 py-7">
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-subtle)]">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function BadgeText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
      {children}
    </p>
  );
}
