export function resolveCompareModels<T extends { slug: string }>(
  keys: string[],
  resolve: (key: string) => T | undefined,
): T[] {
  const models = new Map<string, T>();
  for (const key of keys) {
    const model = resolve(key);
    if (model && !models.has(model.slug)) models.set(model.slug, model);
    if (models.size === 4) break;
  }
  return [...models.values()];
}
