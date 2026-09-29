import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function json(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

test('the checked-in catalog satisfies the schema-v2 browse contract', async () => {
  const catalog = await json('../public/data/catalog.json');
  assert.equal(catalog.schema_version, 2);
  assert.match(catalog.generated_at, /Z$/);
  assert.equal(catalog.source.name, 'ollama');
  assert.ok(Array.isArray(catalog.models));
  assert.ok(catalog.models.length > 0);
  assert.ok(
    catalog.source.model_count >=
      catalog.models.filter((model) => model.status === 'active').length,
  );

  const slugs = new Set();
  for (const model of catalog.models) {
    assert.match(model.slug, /^[a-z0-9][a-z0-9._-]*$/);
    assert.equal(slugs.has(model.slug), false, `duplicate model slug: ${model.slug}`);
    slugs.add(model.slug);
    assert.ok(['active', 'unlisted'].includes(model.status));
    assert.ok(['local', 'cloud', 'both'].includes(model.availability));
    assert.ok(Array.isArray(model.capabilities));
    assert.ok(Array.isArray(model.applications));
    assert.ok(Array.isArray(model.categories));
    assert.ok(Array.isArray(model.input_modalities));
    assert.ok(Array.isArray(model.quantizations));
    assert.equal(new Set(model.categories).size, model.categories.length);
    assert.equal(
      model.categories.every((value) =>
        ['chat', 'coding', 'vision', 'tools', 'reasoning', 'embedding', 'audio'].includes(value),
      ),
      true,
    );
    assert.ok(Array.isArray(model.parameter_sizes));
    assert.ok(Number.isInteger(model.local_variant_count));
    assert.ok(Number.isInteger(model.cloud_variant_count));
    assert.equal(Object.hasOwn(model, 'cloud_variant'), true);
    if (model.source_updated_at !== null) assert.match(model.source_updated_at, /Z$/);
    if (model.min_download_size_bytes !== null) assert.ok(model.min_download_size_bytes > 0);
    if (model.status === 'active' && model.availability !== 'cloud') {
      assert.equal(model.smallest_local_variant?.availability, 'local', model.slug);
    }

    const detail = await json(`../public/data/models/${model.slug}.json`);
    assert.equal(detail.slug, model.slug);
    assert.ok(Array.isArray(detail.variants));
    const { variants, ...detailSummary } = detail;
    assert.deepEqual(detailSummary, model, `${model.slug} summary/detail mismatch`);
    assert.equal(new Set(variants.map((variant) => variant.ref)).size, variants.length);
    assert.equal(new Set(variants.map((variant) => variant.tag)).size, variants.length);
    if (model.status === 'active') {
      assert.ok(variants.length > 0, `${model.slug} has no runnable variants`);
      assert.equal(model.tag_count, variants.length, `${model.slug} tag count mismatch`);
    }

    const local = variants.filter((variant) => variant.availability === 'local');
    const cloud = variants.filter((variant) => variant.availability === 'cloud');
    assert.equal(model.local_variant_count, local.length, `${model.slug} local count mismatch`);
    assert.equal(model.cloud_variant_count, cloud.length, `${model.slug} cloud count mismatch`);
    const availability = local.length && cloud.length ? 'both' : local.length ? 'local' : 'cloud';
    assert.equal(model.availability, availability, `${model.slug} availability mismatch`);

    const defaults = variants.filter((variant) => variant.is_default);
    assert.ok(defaults.length <= 1, `${model.slug} has multiple official defaults`);
    assert.deepEqual(model.default_variant, defaults[0] ?? null);

    const sizedLocal = local.filter((variant) => variant.download_size_bytes !== null);
    sizedLocal.sort(
      (a, b) =>
        a.download_size_bytes - b.download_size_bytes ||
        a.tag.localeCompare(b.tag) ||
        a.ref.localeCompare(b.ref),
    );
    assert.deepEqual(model.smallest_local_variant, sizedLocal[0] ?? null);
    const expectedCloud =
      defaults[0]?.availability === 'cloud'
        ? defaults[0]
        : ([...cloud].sort((a, b) => a.tag.localeCompare(b.tag) || a.ref.localeCompare(b.ref))[0] ??
          null);
    assert.deepEqual(model.cloud_variant, expectedCloud);

    const sizes = sizedLocal.map((variant) => variant.download_size_bytes);
    assert.equal(model.min_download_size_bytes, sizes.length ? Math.min(...sizes) : null);
    assert.equal(model.max_download_size_bytes, sizes.length ? Math.max(...sizes) : null);
    assert.deepEqual(
      model.input_modalities,
      [...new Set(variants.flatMap((variant) => variant.input_modalities))].sort(),
    );
    assert.deepEqual(
      model.quantizations,
      [
        ...new Set(
          variants.map((variant) => variant.quantization).filter((value) => value !== null),
        ),
      ].sort(),
    );
    const contexts = variants
      .map((variant) => variant.context_window)
      .filter((value) => value !== null);
    assert.equal(model.max_context_window, contexts.length ? Math.max(...contexts) : null);
    for (const variant of variants) {
      if (variant.source_updated_at !== null) assert.match(variant.source_updated_at, /Z$/);
      if (variant.download_size_bytes !== null) assert.ok(variant.download_size_bytes > 0);
      if (variant.parameter)
        assert.equal(model.parameter_sizes.includes(variant.parameter.raw), true);
    }
  }
});

test('legacy ids only target known slugs', async () => {
  const [catalog, legacyMap] = await Promise.all([
    json('../public/data/catalog.json'),
    json('../public/data/legacy-id-map.json'),
  ]);
  const slugs = new Set(catalog.models.map((model) => model.slug));
  for (const [id, slug] of Object.entries(legacyMap)) {
    assert.match(id, /^[0-9a-f-]{36}$/);
    assert.equal(slugs.has(slug), true, `${id} targets missing slug ${slug}`);
  }
});
