import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import catalogJson from '@/public/data/catalog.json';
import legacyIdMapJson from '@/public/data/legacy-id-map.json';
import type { Catalog, LegacyIdMap, ModelDetail, ModelSummary } from '@/lib/types/model';

const catalog = catalogJson as Catalog;
const legacyIdMap = legacyIdMapJson as LegacyIdMap;
const bySlug = new Map(catalog.models.map((model) => [model.slug, model]));
const details = new Map<string, ModelDetail>();

export function getCatalog(): Catalog {
  return catalog;
}

export function getAllModels(): ModelSummary[] {
  return catalog.models.filter((model) => model.status === 'active');
}

export function getLegacyIdMap(): LegacyIdMap {
  return legacyIdMap;
}

export function getAllModelKeys(): { slug: string; legacyIds: string[] }[] {
  const idsBySlug = new Map<string, string[]>();
  for (const [id, slug] of Object.entries(legacyIdMap)) {
    idsBySlug.set(slug, [...(idsBySlug.get(slug) ?? []), id]);
  }
  return catalog.models.map((model) => ({
    slug: model.slug,
    legacyIds: idsBySlug.get(model.slug) ?? [],
  }));
}

export function getModelByKey(key: string): ModelSummary | undefined {
  return bySlug.get(legacyIdMap[key] ?? key);
}

export const getModelById = getModelByKey;
export const getModelByIdentifier = getModelByKey;

export function getModelDetail(slugOrLegacyKey: string): ModelDetail | undefined {
  const model = getModelByKey(slugOrLegacyKey);
  if (!model) return undefined;
  const cached = details.get(model.slug);
  if (cached) return cached;

  try {
    const path = join(process.cwd(), 'public', 'data', 'models', `${model.slug}.json`);
    const detail = JSON.parse(readFileSync(path, 'utf8')) as ModelDetail;
    details.set(model.slug, detail);
    return detail;
  } catch {
    return undefined;
  }
}

export function getTotalCount(): number {
  return getAllModels().length;
}

export function getTopModel(): ModelSummary {
  return [...getAllModels()].sort((a, b) => (b.pulls ?? -1) - (a.pulls ?? -1))[0];
}

export function getSmallestModel(): ModelSummary {
  return [...getAllModels()].sort(
    (a, b) =>
      (a.min_download_size_bytes ?? Number.POSITIVE_INFINITY) -
      (b.min_download_size_bytes ?? Number.POSITIVE_INFINITY),
  )[0];
}

export function getRelatedModels(model: ModelSummary, limit = 4): ModelSummary[] {
  const capabilities = new Set(model.capabilities);
  const applications = new Set(model.applications);
  const baseSize = model.min_download_size_bytes;

  return getAllModels()
    .filter((candidate) => candidate.slug !== model.slug)
    .map((candidate) => {
      const sharedCapabilities = candidate.capabilities.filter((value) =>
        capabilities.has(value),
      ).length;
      const sharedApplications = candidate.applications.filter((value) =>
        applications.has(value),
      ).length;
      const sameAvailability = candidate.availability === model.availability ? 1 : 0;
      const sizeDistance =
        baseSize && candidate.min_download_size_bytes
          ? Math.abs(Math.log(candidate.min_download_size_bytes / baseSize))
          : 10;
      return {
        candidate,
        score: sharedCapabilities * 3 + sharedApplications * 2 + sameAvailability - sizeDistance,
      };
    })
    .sort((a, b) => b.score - a.score || (b.candidate.pulls ?? -1) - (a.candidate.pulls ?? -1))
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export { estimateMemoryGiB, selectVariantForMemory } from './model-math';
