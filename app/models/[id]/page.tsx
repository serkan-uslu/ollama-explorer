import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Cloud, HardDrive, Layers3 } from 'lucide-react';
import {
  getAllModelKeys,
  getCatalog,
  getLegacyIdMap,
  getModelDetail,
  getRelatedModels,
} from '@/lib/data/models';
import { Badge } from '@/components/ui/atoms/Badge';
import { Divider } from '@/components/ui/atoms/Divider';
import { JsonLd } from '@/components/ui/atoms/JsonLd';
import { CopyCommand } from '@/components/ui/molecules/CopyCommand';
import { DetailLayout } from '@/components/templates/DetailLayout';
import { ModelDetailActions } from '@/components/features/models/ModelDetailActions';
import { VariantTable } from '@/components/features/models/VariantTable';
import { formatBytes, formatContextWindow, formatDate, formatPulls } from '@/lib/utils/format';

export const dynamic = 'force-static';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllModelKeys().flatMap(({ slug, legacyIds }) =>
    [slug, ...legacyIds].map((id) => ({ id })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const model = getModelDetail(id);
  if (!model) return {};

  const url = `https://ollama-explorer.vercel.app/models/${model.slug}`;
  return {
    title: model.name,
    description: model.description,
    keywords: [model.name, ...model.capabilities, ...model.applications, 'ollama', 'local AI'],
    alternates: { canonical: url },
    robots: model.status === 'unlisted' ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      url,
      title: `${model.name} | Ollama Model Explorer`,
      description: model.description,
      images: ['/opengraph-image'],
    },
  };
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { id } = await params;
  const legacySlug = getLegacyIdMap()[id];
  if (legacySlug) permanentRedirect(`/models/${legacySlug}`);

  const model = getModelDetail(id);
  if (!model) notFound();

  const catalog = getCatalog();
  const url = `https://ollama-explorer.vercel.app/models/${model.slug}`;
  const related = getRelatedModels(model, 4);
  const defaultVariant = model.default_variant ?? model.smallest_local_variant;

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model.name,
    description: model.description,
    url,
    applicationCategory: 'AI / Machine Learning',
    operatingSystem: 'Linux, macOS, Windows',
    keywords: [...model.capabilities, ...model.applications].join(', '),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://ollama-explorer.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Models',
        item: 'https://ollama-explorer.vercel.app/models',
      },
      { '@type': 'ListItem', position: 3, name: model.name, item: url },
    ],
  };

  return (
    <div className="min-h-[calc(100dvh-3.5rem)]">
      <JsonLd data={softwareSchema} />
      <JsonLd data={breadcrumbSchema} />
      <DetailLayout
        back={
          <div className="flex flex-col gap-2">
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs text-[var(--color-text-subtle)]"
            >
              <Link
                href="/"
                className="inline-flex min-h-11 shrink-0 items-center px-2 hover:text-[var(--color-text)]"
              >
                Home
              </Link>
              <span className="shrink-0" aria-hidden>
                /
              </span>
              <Link
                href="/models"
                className="inline-flex min-h-11 shrink-0 items-center px-2 hover:text-[var(--color-text)]"
              >
                Models
              </Link>
              <span className="shrink-0" aria-hidden>
                /
              </span>
              <span className="min-w-0 truncate text-[var(--color-text-muted)]">{model.name}</span>
            </nav>
            <Link
              href="/models"
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
            >
              <ArrowLeft size={15} aria-hidden />
              Back to models
            </Link>
          </div>
        }
        header={
          <div className="flex flex-col gap-3">
            {model.status === 'unlisted' && (
              <p className="rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--color-text)]">
                This model is no longer listed in the current Ollama catalog. This page is kept so
                old links continue to work.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={model.availability === 'cloud' ? 'muted' : 'default'}>
                {model.availability}
              </Badge>
              {model.capabilities.map((capability) => (
                <Badge key={capability} variant="outline">
                  {capability}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight break-words text-[var(--color-text)] [overflow-wrap:anywhere] sm:text-3xl">
              {model.name}
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-[var(--color-text-muted)]">
              {model.description}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--color-text-subtle)]">
              <span>{formatPulls(model.pulls)} pulls</span>
              <span>{model.tag_count} tags</span>
              <span>Source updated {formatDate(model.source_updated_at)}</span>
              {model.max_context_window && (
                <span>{formatContextWindow(model.max_context_window)} max context</span>
              )}
            </div>
          </div>
        }
        main={
          <>
            <section aria-labelledby="quick-start-heading">
              <h2
                id="quick-start-heading"
                className="mb-3 text-sm font-semibold text-[var(--color-text)]"
              >
                Quick start
              </h2>
              {defaultVariant ? (
                <CopyCommand command={`ollama run ${defaultVariant.ref}`} modelName={model.name} />
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No runnable local tag is currently available.
                </p>
              )}
            </section>

            <Divider />

            <VariantTable variants={model.variants} modelName={model.name} />

            {model.applications.length > 0 && (
              <>
                <Divider />
                <section>
                  <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
                    Source-listed applications
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {model.applications.map((application) => (
                      <Badge key={application} variant="outline">
                        {application}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            )}

            {related.length > 0 && (
              <>
                <Divider />
                <section>
                  <h2 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
                    Related models
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {related.map((candidate) => (
                      <Link
                        key={candidate.slug}
                        href={`/models/${candidate.slug}`}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 hover:border-[var(--color-border-strong)]"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-3">
                          <span className="min-w-0 break-words font-medium text-[var(--color-text)] [overflow-wrap:anywhere]">
                            {candidate.name}
                          </span>
                          <Badge variant="muted" size="sm">
                            {candidate.availability}
                          </Badge>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
                          {candidate.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        }
        sidebar={
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3">
                <HardDrive size={16} aria-hidden className="mb-2 text-[var(--color-text-subtle)]" />
                <p className="text-xs text-[var(--color-text-subtle)]">Smallest download</p>
                <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                  {formatBytes(model.min_download_size_bytes)}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3">
                <Layers3 size={16} aria-hidden className="mb-2 text-[var(--color-text-subtle)]" />
                <p className="text-xs text-[var(--color-text-subtle)]">Family</p>
                <p className="mt-1 break-words text-sm font-medium text-[var(--color-text)] [overflow-wrap:anywhere]">
                  {model.family ?? 'Unknown'}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 min-[360px]:col-span-2 lg:col-span-1">
                <Cloud size={16} aria-hidden className="mb-2 text-[var(--color-text-subtle)]" />
                <p className="text-xs text-[var(--color-text-subtle)]">Availability</p>
                <p className="mt-1 text-sm font-medium capitalize text-[var(--color-text)]">
                  {model.availability}
                </p>
              </div>
            </div>

            <Divider />

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                License
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {model.license ?? 'Not verified'}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                Catalog version
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {formatDate(catalog.generated_at)} · schema v{catalog.schema_version}
              </p>
            </div>

            <Divider />

            <ModelDetailActions
              modelName={model.name}
              modelSlug={model.slug}
              availability={model.availability}
              sourceUrl={model.source_url}
            />
          </div>
        }
      />
    </div>
  );
}
