import type { ModelSummary } from '@/lib/types/model';

const DAY_IN_MS = 86_400_000;
export const MODEL_OF_THE_DAY_POOL_SIZE = 31;

export function utcDay(date: Date): number {
  return Math.floor(date.getTime() / DAY_IN_MS);
}

export function buildModelOfTheDayPool(
  models: ModelSummary[],
  limit = MODEL_OF_THE_DAY_POOL_SIZE,
): ModelSummary[] {
  return [...models]
    .filter(
      (model) =>
        model.status === 'active' &&
        model.smallest_local_variant !== null &&
        !model.capabilities.includes('embedding'),
    )
    .sort((a, b) => (b.pulls ?? -1) - (a.pulls ?? -1) || a.slug.localeCompare(b.slug))
    .slice(0, limit)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function pickModelOfTheDay(pool: ModelSummary[], day: number): ModelSummary | null {
  if (pool.length === 0 || !Number.isFinite(day)) return null;
  const index = ((Math.trunc(day) % pool.length) + pool.length) % pool.length;
  return pool[index];
}
