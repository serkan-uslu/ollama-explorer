import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const catalog = JSON.parse(await readFile(join(root, 'public/data/catalog.json'), 'utf8'));
const variantIndex = JSON.parse(
  await readFile(join(root, 'public/data/variant-index.json'), 'utf8'),
);
let detailMarker;
let indexMarker;

for (const model of catalog.models) {
  const detail = JSON.parse(
    await readFile(join(root, 'public/data/models', `${model.slug}.json`), 'utf8'),
  );
  const summaryRefs = new Set(
    [
      model.default_variant?.ref,
      model.smallest_local_variant?.ref,
      model.cloud_variant?.ref,
    ].filter(Boolean),
  );
  detailMarker = detail.variants.find(
    (variant) => variant.digest?.length >= 12 && !summaryRefs.has(variant.ref),
  )?.digest;
  indexMarker = variantIndex.models[model.slug]?.find(
    (variant) => !summaryRefs.has(variant.ref),
  )?.ref;
  if (detailMarker && indexMarker) break;
}

if (!detailMarker || !indexMarker) {
  throw new Error('Could not find detail-only markers for the bundle check');
}

const chunks = join(root, '.next/static/chunks');
for (const entry of await readdir(chunks, { recursive: true })) {
  if (!entry.endsWith('.js')) continue;
  const source = await readFile(join(chunks, entry), 'utf8');
  if (source.includes(detailMarker) || source.includes(indexMarker)) {
    throw new Error(`Model detail data leaked into client bundle: ${entry}`);
  }
}

console.log('Client bundle excludes model detail and variant-index payloads.');
