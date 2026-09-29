import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimateMemoryGiB,
  needsExactVariantData,
  parseParameterSize,
  selectVariantForFilters,
  selectVariantForMemory,
  variantMatchesFilters,
} from '../lib/data/model-math.ts';
import {
  createDefaultFilters,
  filtersToSearchParams,
  parseFiltersFromSearchParams,
} from '../lib/data/filter-url.ts';
import { resolveCompareModels } from '../lib/data/compare.ts';
import { deriveFacetCounts, deriveFilterOptions } from '../lib/data/filters.ts';
import { parseVariantIndex, resolveExactVariantMatches } from '../lib/data/variant-index.ts';
import {
  filterAndSortModels,
  getModelModalities,
  getModelQuantizations,
  modelMatchesTask,
  modelUpdatedWithin,
  parameterMatchesBucket,
} from '../lib/data/browse.ts';
import { formatDate } from '../lib/utils/format.ts';
import { trackCopyCommand } from '../lib/utils/ga.ts';
import {
  buildModelOfTheDayPool,
  pickModelOfTheDay,
  utcDay,
} from '../components/features/models/model-of-the-day.ts';

test('parameter labels are parsed without treating suffixes as billions', () => {
  assert.equal(parseParameterSize('270m'), 0.27);
  assert.equal(parseParameterSize('1b'), 1);
  assert.equal(parseParameterSize('8x7b'), 56);
  assert.equal(parseParameterSize('8×7B'), 56);
  assert.equal(parseParameterSize('e2b'), null);
  assert.equal(parseParameterSize('latest'), null);
});

test('memory estimate is rounded up to the next half GiB', () => {
  assert.equal(estimateMemoryGiB(4 * 1024 ** 3), 6);
  assert.equal(estimateMemoryGiB(null), null);
  assert.equal(estimateMemoryGiB(undefined), null);
  assert.equal(estimateMemoryGiB(0), null);
});

test('source dates are rendered in UTC', () => {
  assert.equal(formatDate('2024-11-30T22:34:00Z'), 'Nov 30, 2024');
});

test('copy analytics keeps the exact selected command', () => {
  let received;
  global.window = { gtag: (...args) => (received = args) };
  trackCopyCommand('Demo', 'ollama run demo:8b-q4_K_M');
  assert.deepEqual(received, [
    'event',
    'model_copy_command',
    { model_name: 'Demo', command: 'ollama run demo:8b-q4_K_M' },
  ]);
  delete global.window;
});

test('variant selection prefers the default when it fits and otherwise a local fallback', () => {
  const makeVariant = (ref, gib, availability = 'local', isDefault = false) => ({
    ref,
    tag: ref.split(':')[1],
    digest: null,
    availability,
    download_size_bytes: gib * 1024 ** 3,
    parameter: null,
    quantization: null,
    context_window: null,
    input_modalities: ['text'],
    source_updated_at: null,
    is_default: isDefault,
  });
  const small = makeVariant('demo:3b', 2);
  const standard = makeVariant('demo:8b', 6, 'local', true);
  const model = {
    default_variant: standard,
    smallest_local_variant: small,
    cloud_variant: null,
    variants: [standard, small],
  };

  assert.equal(selectVariantForMemory(model, null)?.ref, 'demo:8b');
  assert.equal(selectVariantForMemory(model, 16)?.ref, 'demo:8b');
  assert.equal(selectVariantForMemory(model, 4)?.ref, 'demo:3b');
  assert.equal(selectVariantForMemory(model, 2), null);

  const cloudDefault = makeVariant('demo:cloud', 0, 'cloud', true);
  assert.equal(
    selectVariantForMemory(
      {
        default_variant: cloudDefault,
        smallest_local_variant: small,
        cloud_variant: cloudDefault,
      },
      null,
    )?.ref,
    'demo:3b',
  );
  assert.equal(
    selectVariantForMemory(
      { default_variant: standard, smallest_local_variant: small, cloud_variant: cloudDefault },
      null,
      'cloud',
    )?.ref,
    'demo:cloud',
  );
});

test('exact variant selection applies OR within facets and AND across facets', () => {
  const variant = ({
    ref,
    quantization,
    parameter,
    context,
    modalities = ['text'],
    gib = 4,
    availability = 'local',
  }) => ({
    ref,
    tag: ref.split(':')[1],
    digest: null,
    availability,
    download_size_bytes: gib === null ? null : gib * 1024 ** 3,
    parameter:
      parameter === null
        ? null
        : { raw: `${parameter}b`, total_billion: parameter, active_billion: null },
    quantization,
    context_window: context,
    input_modalities: modalities,
    source_updated_at: null,
    is_default: false,
  });
  const q8Small = variant({
    ref: 'demo:8b-q8',
    quantization: 'Q8_0',
    parameter: 8,
    context: 1_000_000,
    modalities: ['text', 'image'],
  });
  const q8LargeShort = variant({
    ref: 'demo:70b-q8',
    quantization: 'Q8_0',
    parameter: 70,
    context: 128_000,
  });
  const bf16Large = variant({
    ref: 'demo:70b-bf16',
    quantization: 'BF16',
    parameter: 70,
    context: 1_000_000,
    gib: null,
  });
  const cloudQ8 = variant({
    ref: 'demo:cloud-q8',
    quantization: 'Q8_0',
    parameter: 70,
    context: 1_000_000,
    availability: 'cloud',
    gib: null,
  });
  const model = {
    default_variant: q8LargeShort,
    smallest_local_variant: q8Small,
    cloud_variant: cloudQ8,
    variants: [q8Small, q8LargeShort, bf16Large, cloudQ8],
  };
  const filters = {
    availability: 'local',
    modalities: ['image', 'audio'],
    quantizations: ['Q8_0', 'BF16'],
    parameterBuckets: ['4-14', '35-Infinity'],
    memory: 8,
    context: 1_000_000,
  };

  assert.equal(needsExactVariantData(filters), true);
  assert.equal(variantMatchesFilters(q8Small, filters), true);
  assert.equal(selectVariantForFilters(model, filters)?.ref, 'demo:8b-q8');

  const impossibleIntersection = {
    ...filters,
    modalities: ['text'],
    quantizations: ['Q8_0'],
    parameterBuckets: ['35-Infinity'],
    memory: null,
  };
  assert.equal(selectVariantForFilters(model, impossibleIntersection), null);
  assert.equal(
    selectVariantForFilters(model, {
      ...impossibleIntersection,
      quantizations: ['Q8_0', 'BF16'],
    })?.ref,
    'demo:70b-bf16',
  );
});

test('memory filters reject unknown sizes and do not select cloud variants', () => {
  const unknownLocal = {
    ref: 'demo:unknown',
    tag: 'unknown',
    digest: null,
    availability: 'local',
    download_size_bytes: null,
    parameter: null,
    quantization: 'Q8_0',
    context_window: null,
    input_modalities: ['text'],
    source_updated_at: null,
    is_default: true,
  };
  const cloud = { ...unknownLocal, ref: 'demo:cloud', tag: 'cloud', availability: 'cloud' };
  const filters = {
    availability: 'all',
    modalities: [],
    quantizations: ['Q8_0'],
    parameterBuckets: [],
    memory: 64,
    context: null,
  };

  assert.equal(variantMatchesFilters(unknownLocal, filters), false);
  assert.equal(variantMatchesFilters(cloud, filters), false);
  assert.equal(
    selectVariantForFilters(
      {
        default_variant: unknownLocal,
        smallest_local_variant: unknownLocal,
        cloud_variant: cloud,
        variants: [unknownLocal, cloud],
      },
      filters,
    ),
    null,
  );
  assert.equal(needsExactVariantData({ ...filters, quantizations: [] }), false);
  assert.equal(needsExactVariantData({ ...filters, memory: null, quantizations: [] }), false);
});

test('exact selection is local-first and accepts exact memory and context thresholds', () => {
  const local = {
    ref: 'demo:local',
    tag: 'local',
    digest: null,
    availability: 'local',
    download_size_bytes: 4 * 1024 ** 3,
    parameter: { raw: '8b', total_billion: 8, active_billion: null },
    quantization: 'Q8_0',
    context_window: 128_000,
    input_modalities: ['text'],
    source_updated_at: null,
    is_default: false,
  };
  const cloud = {
    ...local,
    ref: 'demo:cloud',
    tag: 'cloud',
    availability: 'cloud',
    download_size_bytes: null,
  };
  const source = {
    default_variant: null,
    smallest_local_variant: null,
    cloud_variant: null,
    variants: [cloud, local],
  };
  const exactThresholds = {
    availability: 'all',
    modalities: ['text'],
    quantizations: ['Q8_0'],
    parameterBuckets: ['4-14'],
    memory: 6,
    context: 128_000,
  };

  assert.equal(variantMatchesFilters(local, exactThresholds), true);
  assert.equal(selectVariantForFilters(source, exactThresholds)?.ref, 'demo:local');
  assert.equal(variantMatchesFilters(local, { ...exactThresholds, memory: 5.5 }), false);
  assert.equal(variantMatchesFilters(local, { ...exactThresholds, context: 128_001 }), false);
  assert.equal(variantMatchesFilters({ ...local, context_window: null }, exactThresholds), false);
  assert.equal(
    selectVariantForFilters(source, { ...exactThresholds, availability: 'cloud', memory: null })
      ?.ref,
    'demo:cloud',
  );
  assert.equal(
    selectVariantForFilters(source, { ...exactThresholds, availability: 'local' })?.ref,
    'demo:local',
  );
});

test('filter URLs round-trip repeated facets and safe scalar values', () => {
  const parsed = parseFiltersFromSearchParams(
    new URLSearchParams(
      'q=code&availability=all&task=coding&task=tools&capability=vision&application=Codex&application=OpenCode&modality=text&quantization=Q4_K_M&family=qwen&license=apache-2.0&parameter=1-4&parameter=4-14&memory=16&context=32000&updated=90&page=3',
    ),
  );
  assert.equal(parsed.sort, 'relevance');
  assert.deepEqual(parsed.tasks, ['coding', 'tools']);
  assert.deepEqual(parsed.applications, ['Codex', 'OpenCode']);
  assert.deepEqual(parsed.modalities, ['text']);
  assert.deepEqual(parsed.quantizations, ['Q4_K_M']);
  assert.deepEqual(parsed.parameterBuckets, ['1-4', '4-14']);
  assert.equal(parsed.memory, 16);
  assert.equal(parsed.context, 32_000);
  assert.equal(parsed.updatedWithinDays, 90);
  assert.equal(parsed.page, 3);

  const roundTrip = parseFiltersFromSearchParams(filtersToSearchParams(parsed));
  assert.deepEqual(roundTrip, parsed);
});

test('invalid URL values fall back without making unknown data look like zero', () => {
  const parsed = parseFiltersFromSearchParams(
    new URLSearchParams(
      'availability=remote&task=invalid&capability=garbage&application=garbage&modality=garbage&quantization=garbage&family=garbage&license=garbage&parameter=tiny&memory=0&context=nope&updated=12&sort=fastest&page=-2',
    ),
    {
      capabilities: new Set(['vision']),
      applications: new Set(['Codex']),
      modalities: new Set(['text']),
      quantizations: new Set(['Q4_K_M']),
      families: new Set(['qwen']),
      licenses: new Set(['apache-2.0']),
    },
  );
  assert.equal(parsed.availability, 'local');
  assert.equal(parsed.memory, null);
  assert.equal(parsed.context, null);
  assert.equal(parsed.updatedWithinDays, null);
  assert.equal(parsed.sort, 'popular');
  assert.equal(parsed.page, 1);
  assert.deepEqual(parsed.tasks, []);
  assert.deepEqual(parsed.capabilities, []);
  assert.deepEqual(parsed.applications, []);
  assert.deepEqual(parsed.modalities, []);
  assert.deepEqual(parsed.quantizations, []);
  assert.deepEqual(parsed.families, []);
  assert.deepEqual(parsed.licenses, []);
  assert.deepEqual(parsed.parameterBuckets, []);
});

test('legacy and current task parameters are deduplicated', () => {
  const parsed = parseFiltersFromSearchParams(
    new URLSearchParams('task=chat&useCase=Chat%20Assistant'),
  );
  assert.deepEqual(parsed.tasks, ['chat']);
});

test('relevance sort without a query normalizes to popularity', () => {
  const filters = { ...createDefaultFilters(), sort: 'relevance' };
  const params = filtersToSearchParams(filters);
  assert.equal(params.has('sort'), false);
  assert.equal(parseFiltersFromSearchParams(params).sort, 'popular');
});

test('parameter bucket boundaries do not overlap', () => {
  assert.equal(parameterMatchesBucket(1, '0-1'), true);
  assert.equal(parameterMatchesBucket(1, '1-4'), false);
  assert.equal(parameterMatchesBucket(4, '1-4'), true);
  assert.equal(parameterMatchesBucket(4, '4-14'), false);
  assert.equal(parameterMatchesBucket(14, '4-14'), true);
  assert.equal(parameterMatchesBucket(14, '14-35'), false);
  assert.equal(parameterMatchesBucket(35, '14-35'), false);
  assert.equal(parameterMatchesBucket(35, '35-Infinity'), true);
});

test('compare resolves aliases, removes duplicate slugs and keeps four valid models', () => {
  const lookup = (key) => {
    const slug = key === 'old-a' ? 'a' : key;
    return ['a', 'b', 'c', 'd', 'e'].includes(slug) ? { slug } : undefined;
  };
  const selected = resolveCompareModels(['missing', 'old-a', 'a', 'b', 'c', 'd', 'e'], lookup);
  assert.deepEqual(
    selected.map((model) => model.slug),
    ['a', 'b', 'c', 'd'],
  );
});

function summary(slug, overrides = {}) {
  return {
    slug,
    name: slug,
    description: '',
    source_url: `https://ollama.com/library/${slug}`,
    status: 'active',
    availability: 'local',
    capabilities: [],
    applications: [],
    pulls: 0,
    tag_count: 1,
    source_updated_at: null,
    parameter_sizes: [],
    min_download_size_bytes: null,
    max_context_window: null,
    default_variant: null,
    smallest_local_variant: null,
    cloud_variant: null,
    family: null,
    license: null,
    ...overrides,
  };
}

test('variant index removes aggregate false positives before counts and pagination', () => {
  const indexedVariant = (slug, tag, quantization, parameter, context = 128_000) => ({
    ref: `${slug}:${tag}`,
    tag,
    availability: 'local',
    download_size_bytes: 4 * 1024 ** 3,
    parameter: { raw: `${parameter}b`, total_billion: parameter },
    quantization,
    context_window: context,
    input_modalities: ['text'],
    is_default: false,
  });
  const falsePositiveModels = Array.from({ length: 25 }, (_, position) => {
    const slug = `split-${position}`;
    const q8Small = indexedVariant(slug, '2b-q8', 'Q8_0', 2);
    return summary(slug, {
      pulls: 1_000 - position,
      parameter_sizes: ['2b', '70b'],
      quantizations: ['Q8_0', 'BF16'],
      default_variant: q8Small,
      smallest_local_variant: q8Small,
    });
  });
  const exactSlug = 'exact';
  const exactBf16 = indexedVariant(exactSlug, '2b-bf16', 'BF16', 2);
  const exactModel = summary(exactSlug, {
    pulls: 1,
    parameter_sizes: ['2b'],
    quantizations: ['BF16'],
    default_variant: exactBf16,
    smallest_local_variant: exactBf16,
  });
  const models = [...falsePositiveModels, exactModel];
  const index = parseVariantIndex({
    schema_version: 1,
    generated_at: '2026-09-29T00:00:00Z',
    models: Object.fromEntries([
      ...falsePositiveModels.map((model) => [
        model.slug,
        [
          indexedVariant(model.slug, '2b-q8', 'Q8_0', 2),
          indexedVariant(model.slug, '70b-bf16', 'BF16', 70),
        ],
      ]),
      [exactSlug, [exactBf16]],
    ]),
  });
  assert.ok(index);
  const filters = parseFiltersFromSearchParams(
    new URLSearchParams('quantization=BF16&parameter=1-4'),
  );
  const aggregate = filterAndSortModels(models, filters);
  assert.equal(aggregate.length, 26);
  assert.equal(
    aggregate.slice(0, 24).some((model) => model.slug === exactSlug),
    false,
  );

  const exact = resolveExactVariantMatches(aggregate, index, filters);
  assert.deepEqual(
    exact.models.map((model) => model.slug),
    [exactSlug],
  );
  assert.equal(exact.variants.get(exactSlug)?.ref, 'exact:2b-bf16');
  assert.equal(exact.models.slice(0, 24)[0]?.slug, exactSlug);

  const options = deriveFilterOptions(models);
  const counts = deriveFacetCounts(models, filters, options, index);
  assert.equal(counts.quantizations.BF16, 1);
  assert.equal(counts.parameters['1-4'], 1);
});

test('cloud and memory filters have consistent zero-result AND semantics', () => {
  const local = {
    ref: 'hybrid:local',
    tag: 'local',
    availability: 'local',
    download_size_bytes: 2 * 1024 ** 3,
    parameter: null,
    quantization: null,
    context_window: null,
    input_modalities: ['text'],
    is_default: false,
  };
  const cloud = { ...local, ref: 'hybrid:cloud', tag: 'cloud', availability: 'cloud' };
  const hybrid = summary('hybrid', {
    availability: 'both',
    default_variant: cloud,
    smallest_local_variant: local,
    cloud_variant: cloud,
  });
  const filters = parseFiltersFromSearchParams(new URLSearchParams('availability=cloud&memory=8'));
  const options = deriveFilterOptions([hybrid]);

  assert.deepEqual(filterAndSortModels([hybrid], filters), []);
  const counts = deriveFacetCounts([hybrid], filters, options);
  assert.equal(counts.availability.cloud, 0);
  assert.equal(counts.memory['8'], 0);
  assert.equal(counts.availability.local, 1);
});

test('model of the day uses a bounded deterministic local pool and UTC day', () => {
  const variant = (slug) => ({
    ref: `${slug}:latest`,
    tag: 'latest',
    digest: null,
    availability: 'local',
    download_size_bytes: 1_000_000_000,
    parameter: null,
    quantization: null,
    context_window: null,
    input_modalities: ['text'],
    source_updated_at: null,
    is_default: true,
  });
  const candidates = Array.from({ length: 40 }, (_, index) => {
    const slug = `model-${String(index).padStart(2, '0')}`;
    const local = variant(slug);
    return summary(slug, {
      pulls: index * 1_000,
      default_variant: local,
      smallest_local_variant: local,
    });
  });
  candidates.push(
    summary('popular-embedding', {
      pulls: 1_000_000,
      capabilities: ['embedding'],
      smallest_local_variant: variant('popular-embedding'),
    }),
  );

  const pool = buildModelOfTheDayPool(candidates);
  const reversedPool = buildModelOfTheDayPool([...candidates].reverse());
  const day = utcDay(new Date('2026-09-29T23:59:59Z'));

  assert.equal(pool.length, 31);
  assert.deepEqual(
    pool.map((model) => model.slug),
    reversedPool.map((model) => model.slug),
  );
  assert.equal(
    pool.some((model) => model.slug === 'popular-embedding'),
    false,
  );
  const selected = pickModelOfTheDay(pool, day);
  assert.equal(selected?.slug, pickModelOfTheDay(reversedPool, day)?.slug);
  assert.equal(selected?.default_variant?.ref, `${selected?.slug}:latest`);
  assert.notEqual(selected?.slug, pickModelOfTheDay(pool, day + 1)?.slug);
  assert.equal(utcDay(new Date('2026-09-30T00:00:00Z')), day + 1);
});

test('search keeps Fuse relevance instead of re-sorting by popularity', () => {
  const filters = parseFiltersFromSearchParams(
    new URLSearchParams('q=code&availability=all&sort=relevance'),
  );
  const results = filterAndSortModels(
    [
      summary('code-specialist', { name: 'Code Specialist', pulls: 1 }),
      summary('popular-general', {
        name: 'Popular General',
        description: 'A model that can discuss code.',
        pulls: 1_000_000,
      }),
    ],
    filters,
  );
  assert.equal(results[0].slug, 'code-specialist');
});

test('facet selections are OR within a facet and AND between facets', () => {
  const models = [
    summary('tool-coder', {
      applications: ['OpenCode'],
      capabilities: ['tools'],
      input_modalities: ['text'],
      quantizations: ['Q4_K_M'],
    }),
    summary('vision-coder', {
      applications: ['Codex'],
      capabilities: ['vision'],
      input_modalities: ['text', 'image'],
      quantizations: ['Q8_0'],
    }),
    summary('vision-chat', { capabilities: ['vision'] }),
  ];
  const filters = parseFiltersFromSearchParams(
    new URLSearchParams(
      'availability=all&task=coding&capability=tools&capability=vision&application=OpenCode&application=Codex&modality=image&quantization=Q8_0',
    ),
  );
  assert.deepEqual(
    filterAndSortModels(models, filters).map((model) => model.slug),
    ['vision-coder'],
  );
});

test('summary facets prefer complete aggregate fields and fall back to representative variants', () => {
  const representative = {
    ref: 'demo:latest',
    tag: 'latest',
    digest: null,
    availability: 'local',
    download_size_bytes: null,
    parameter: null,
    quantization: 'Q4_K_M',
    context_window: null,
    input_modalities: ['text'],
    source_updated_at: null,
    is_default: true,
  };
  const legacy = summary('legacy', { default_variant: representative });
  assert.deepEqual(getModelModalities(legacy), ['text']);
  assert.deepEqual(getModelQuantizations(legacy), ['Q4_K_M']);

  const aggregate = summary('aggregate', {
    default_variant: representative,
    input_modalities: ['text', 'image'],
    quantizations: ['Q4_K_M', 'Q8_0'],
  });
  assert.deepEqual(getModelModalities(aggregate), ['text', 'image']);
  assert.deepEqual(getModelQuantizations(aggregate), ['Q4_K_M', 'Q8_0']);
});

test('task categories are authoritative when present and legacy derivation remains a fallback', () => {
  assert.equal(
    modelMatchesTask(summary('categorized', { categories: ['coding'] }), 'coding'),
    true,
  );
  assert.equal(
    modelMatchesTask(
      summary('categorized', { categories: ['chat'], applications: ['OpenCode'] }),
      'coding',
    ),
    false,
  );
  assert.equal(modelMatchesTask(summary('legacy', { applications: ['OpenCode'] }), 'coding'), true);
});

test('updated filter rejects unknown dates and respects the selected rolling window', () => {
  const now = Date.parse('2026-09-29T00:00:00Z');
  assert.equal(
    modelUpdatedWithin(summary('recent', { source_updated_at: '2026-09-01T00:00:00Z' }), 30, now),
    true,
  );
  assert.equal(
    modelUpdatedWithin(summary('old', { source_updated_at: '2026-01-01T00:00:00Z' }), 30, now),
    false,
  );
  assert.equal(modelUpdatedWithin(summary('unknown'), 30, now), false);
});

test('chat includes text-capable audio models but excludes embeddings', () => {
  const textAudio = summary('text-audio', {
    capabilities: ['audio'],
    default_variant: {
      ref: 'text-audio:latest',
      tag: 'latest',
      digest: null,
      availability: 'local',
      download_size_bytes: null,
      parameter: null,
      quantization: null,
      context_window: null,
      input_modalities: ['text', 'audio'],
      source_updated_at: null,
      is_default: true,
    },
  });
  assert.equal(modelMatchesTask(textAudio, 'chat'), true);
  assert.equal(
    modelMatchesTask(
      summary('embed', {
        capabilities: ['embedding'],
        default_variant: textAudio.default_variant,
      }),
      'chat',
    ),
    false,
  );
});
