# Feature Status — Ollama Explorer

> **Data:** checked-in Ollama catalog, schema v2<br>
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4<br>
> **Updated:** 2026-09-29

## Legend

| Symbol | Meaning               |
| ------ | --------------------- |
| ✅     | Implemented           |
| ⏸      | Deliberately deferred |

## Routes

| Route             | Current behavior                                                            |
| ----------------- | --------------------------------------------------------------------------- |
| `/`               | Olli video, task/memory entry points, daily model, and catalog statistics   |
| `/models`         | Search, facets, sorting, incremental pagination, and compare selection      |
| `/models/[slug]`  | Source-backed model facts, all variants, exact commands, and related models |
| `/models/compare` | Query-driven comparison for two to four models; intentionally `noindex`     |
| `/about`          | Data provenance, catalog statistics, and stack                              |
| `/roadmap`        | Shipped and deferred product scope                                          |
| `/privacy`        | Privacy and analytics disclosure                                            |

Legacy UUID detail URLs permanently redirect to their stable slugs.

The home page keeps Olli's autoplaying muted character video with sound control and a reduced-motion
poster fallback. Model of the Day rotates at UTC midnight from a deterministic, bounded pool of
popular local models and exposes the exact runnable command.

## Discovery

### Search and sorting

- ✅ Fuse.js fuzzy search across name, description, applications, capabilities, family, license, and parameter labels
- ✅ 200 ms debounced input and `?q=` URL state
- ✅ Relevance order while searching
- ✅ Popular, recently updated, smallest download, largest context, and A–Z sorting
- ✅ Unknown numeric or date values sort last instead of becoming zero

### Filters

- ✅ Availability: `Local`, `Cloud`, or `All`; local is the default
- ✅ Task: chat and writing, coding, vision, agents and tools, reasoning, embeddings, and audio
- ✅ Source-listed capabilities
- ✅ Source-listed applications
- ✅ Aggregate input modalities and parsed quantizations across every variant
- ✅ Source-updated windows: 7, 30, 90, and 365 days
- ✅ Parameter buckets: `≤ 1B`, `1B–4B`, `4B–14B`, `14B–35B`, and `35B+`
- ✅ Memory budgets: 8, 16, 32, and 64 GB
- ✅ Minimum context: 8K, 32K, 128K, and 1M
- ✅ Family and verified-license filters when those fields contain source-backed values
- ✅ Dynamic counts computed against the other active facets
- ✅ URL serialization, dismissible active chips, and reset controls
- ✅ Sticky desktop filters and a native `<dialog>` drawer on smaller screens

Task filters are deterministic mappings over source capabilities, applications, and input modalities. They are not AI classifications.
The current source exposes no normalized family or verified-license values, so those two facets stay hidden instead of guessing; source-backed normalization remains deferred.

### Results

- ✅ Responsive one-, two-, and three-column card grid
- ✅ 24 results initially, followed by explicit “Load more” batches
- ✅ Source description, availability, verified license when present, applications, capabilities, parameters, popularity, context, and update time
- ✅ Variant choice respects the selected memory budget and never treats missing size as zero
- ✅ Exact copy command from the selected variant's full ref: `ollama run model:tag`
- ✅ Accessible empty state and filter reset

## Model detail and comparison

- ✅ Static detail page for every catalog record, including preserved unlisted records
- ✅ Searchable variant table with local/cloud filter
- ✅ Exact ref and tag, digest, download size, parsed parameter label, parsed quantization, context, modality, and memory estimate where known
- ✅ Source-listed applications and direct Ollama source link
- ✅ Source-correction issue link
- ✅ Related models from shared source facts and size proximity
- ✅ Selection and side-by-side comparison of up to four unique models
- ✅ Optional comparison memory budget with per-model fitting variant selection
- ✅ Unknown comparison values remain visibly unknown

An unlisted record stays addressable for old links but receives `noindex` metadata and is omitted from browse results and the sitemap.

## Memory behavior

Memory filtering applies only to local variants with a known download size. The estimate is:

```text
ceil_to_0.5_GiB(download_size_GiB × 1.2 + 1 GiB)
```

This is a rough selection aid, not a promise that a model will run. Context length, Ollama/runtime overhead, GPU offload, the operating system, and concurrent workloads can increase real usage.

## Schema v2

```ts
interface Catalog {
  schema_version: 2;
  generated_at: string;
  source: {
    name: 'ollama';
    url: string;
    model_count: number; // active records returned by the source
  };
  models: ModelSummary[];
}

interface ModelSummary {
  slug: string;
  name: string;
  description: string;
  source_url: string;
  status: 'active' | 'unlisted';
  availability: 'local' | 'cloud' | 'both';
  capabilities: string[];
  applications: string[];
  categories: ('chat' | 'coding' | 'vision' | 'tools' | 'reasoning' | 'embedding' | 'audio')[];
  input_modalities: string[];
  quantizations: string[];
  local_variant_count: number;
  cloud_variant_count: number;
  pulls: number | null;
  tag_count: number;
  source_updated_at: string | null;
  parameter_sizes: string[];
  min_download_size_bytes: number | null;
  max_download_size_bytes: number | null;
  max_context_window: number | null;
  default_variant: Variant | null;
  smallest_local_variant: Variant | null;
  cloud_variant: Variant | null;
  family: string | null;
  license: string | null;
}

interface ModelDetail extends ModelSummary {
  variants: Variant[];
}

interface Variant {
  ref: string; // complete source ref, e.g. "llama3.1:8b-instruct-q4_K_M"
  tag: string;
  digest: string | null;
  availability: 'local' | 'cloud';
  download_size_bytes: number | null;
  parameter: {
    raw: string;
    total_billion: number | null;
    active_billion: number | null;
  } | null;
  quantization: string | null;
  context_window: number | null;
  input_modalities: string[];
  source_updated_at: string | null;
  is_default: boolean;
}
```

### Provenance rules

- Model listing/detail pages provide names, descriptions, URLs, capabilities, applications, pulls, tag counts, update times, and parameter labels.
- Tag pages provide exact refs, digests, download sizes or cloud usage, context windows, and input modalities.
- Parameter and quantization values are parsed from the exact tag string.
- Task categories, aggregate modalities/quantizations, variant counts, availability, official default, smallest known local, cloud recommendation, download-size bounds, and maximum context are deterministic summaries of source fields and variants.
- Missing values remain `null` or empty. A missing license is shown as `Not verified`.
- The catalog performs no LLM or AI enrichment and makes no blanket open-source claim.

## Catalog builder

- ✅ Small Python package under `tools/miner`
- ✅ No database, orchestrator, or LLM dependency
- ✅ Reads the accepted static catalog as its incremental cache
- ✅ Refuses network access unless `OLLAMA_CRAWL_AUTHORIZED=true`
- ✅ Reuses unchanged details; `--force-refresh` is available after parser changes
- ✅ Quarantines a new model whose detail/tags fail and preserves the last good record for an existing model
- ✅ Rejects an empty source, duplicate slugs/tags, catalog/detail mismatches, and a configurable large source-count drop
- ✅ Atomic writes, with detail files written before `catalog.json`
- ✅ Dry run, offline legacy migration, pytest, and Ruff checks
- ✅ Opt-in weekly GitHub workflow that opens or updates a reviewable catalog pull request

## Cross-cutting behavior

- ✅ Statically generated home, browse, informational, and model detail pages
- ✅ Light/dark theme with stored preference and first-paint protection
- ✅ Responsive layouts and 44 px minimum icon-button targets
- ✅ Skip link, semantic landmarks, accessible labels, keyboard controls, and focus styles
- ✅ Canonicals, robots and sitemap metadata, global/per-model Open Graph images, and JSON-LD
- ✅ Vercel Analytics with the documented privacy banner

## Deferred

- ⏸ Measured Apple Silicon/CPU/GPU RAM, VRAM, and tokens-per-second benchmarks
- ⏸ Local Ollama `/api/tags` integration for installed models and direct launch
- ⏸ Source-backed license normalization and commercial-use filtering
- ⏸ Benchmark comparison with identical model, tag, quantization, hardware, and method
- ⏸ Model/pull history, trending models, and opt-in alerts
- ⏸ LocalStorage favorites and shortlists
- ⏸ Semantic search only if deterministic-search metrics show a real gap
- ⏸ A versioned public API only after independent consumer demand
- ⏸ Accounts, cloud sync, comments, and ratings only after measured need
- ⏸ Localization and additional open-license registry sources

Still out of scope: a vector database, runtime backend, PostgreSQL, a new orchestrator,
provider/plugin matrices, AI chat, review/moderation infrastructure, a design-system rewrite,
and list virtualization.

Deferred work should preserve the current rules: source facts remain attributable, unknown data stays unknown, and exact variant refs remain the command source of truth.
