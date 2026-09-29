# Ollama Explorer

<table>
<tr>
<td width="240">
  <img src="public/olli.jpg" alt="Olli — Ollama Explorer mascot" width="220" style="border-radius: 16px;" />
</td>
<td>

### A source-backed browser for the Ollama catalog

Search models, distinguish local and cloud variants, compare source-listed facts, and copy an exact `ollama run model:tag` command.

Ollama Explorer is a static catalog viewer. It does not use AI to enrich model records, and it does not assume that every listed model has an open-source license.

🌐 **Live** → [ollama-explorer.vercel.app](https://ollama-explorer.vercel.app)<br>
📦 **Source** → [github.com/serkan-uslu/ollama-explorer](https://github.com/serkan-uslu/ollama-explorer)

</td>
</tr>
</table>

[![GitHub Stars](https://img.shields.io/github/stars/serkan-uslu/ollama-explorer?style=social)](https://github.com/serkan-uslu/ollama-explorer/stargazers)
[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://ollama-explorer.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What it does

- Fuzzy search across names, descriptions, applications, capabilities, families, licenses, and parameter labels
- URL-synced filters for task, local/cloud availability, capability, source-listed application, input modality, quantization, source recency, parameter size, memory budget, context, family, and verified license
- Dynamic facet counts, sorting, active-filter chips, and incremental “Load more” pagination
- Model pages with searchable local/cloud variant tables and exact commands built from each source tag ref
- Side-by-side comparison for up to four models, with optional memory-aware variant selection
- Responsive light/dark UI with keyboard navigation, semantic HTML, and visible focus states
- Static model pages, sitemap, canonical metadata, generated Open Graph images, and JSON-LD

## Data contract

The checked-in schema-v2 catalog is the application's only model-data source:

```text
public/data/catalog.json          # compact browse summaries
public/data/models/<slug>.json    # one detail record with all variants
public/data/legacy-id-map.json    # redirects from the previous UUID routes
```

`catalog.json` records its schema version, generation time, Ollama source URL, active source count, and model summaries. Detail files add the complete variant list.

Source-parsed fields include model names, descriptions, URLs, capabilities, applications, pull and tag counts, source update times, parameter labels, and variant refs, digests, download sizes, context windows, and input modalities. The miner parses parameter and quantization labels from exact source tag names, then derives task categories, aggregate modalities and quantizations, local/cloud variant counts, availability, the official default, smallest known local and deterministic cloud variants, download-size bounds, and maximum context.

Missing data remains `null` or empty. In particular, an unknown license means **not verified**; it is not evidence that a model is open source. No LLM or other AI enrichment runs in the catalog pipeline.
The current catalog has no normalized family or verified-license values, so those optional facets remain hidden until an authoritative source is available.

### Exact commands and availability

Every copy button uses the selected variant's full `ref` without reconstructing it:

```sh
ollama run model:tag
```

Models can be `local`, `cloud`, or `both`; individual variants are `local` or `cloud`. Cloud variants have no local download-size requirement, while local variants can be filtered by their source-listed download size.

### Memory estimate

Memory is an estimate, not a hardware guarantee. For a local variant, the UI applies a small heuristic to its download size: 20% overhead plus 1 GiB, rounded up to the next 0.5 GiB. Long contexts, the Ollama runtime, GPU offload, the operating system, and other workloads can require more memory. Unknown sizes stay unknown and never count as zero.

## Static app and stateless miner

Next.js imports the checked-in JSON at build time. Home, browse, informational, and model detail pages are statically generated; search, filters, comparison selection, and variant filtering run against that same catalog without a production database or model API.

[`tools/miner`](tools/miner) is a small Python catalog builder. It:

1. Reads the last accepted static catalog as its cache.
2. Fetches only new or source-changed model detail and tag pages unless forced.
3. Preserves a last-known-good record after an existing-model fetch failure and quarantines a failing new record.
4. Validates the complete schema-v2 candidate and source-count guardrails.
5. Writes detail files before the manifest, using atomic file replacement.

The miner has no database, orchestrator, or LLM dependency. Network access is refused unless `OLLAMA_CRAWL_AUTHORIZED=true` is explicitly set. The repository workflow runs every day at 03:17 UTC (06:17 Europe/Istanbul), with an incremental refresh on most days and a complete detail/tag refresh each Sunday. When the source data changes, it verifies the miner, tests and builds the site against the candidate catalog, commits only `public/data` to the production branch, and lets the connected Vercel Git integration deploy that commit. A partial crawl is never published; an unchanged catalog produces neither a commit nor a deployment.

## Tech stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| App             | Next.js 16 App Router + React 19                 |
| Language        | TypeScript 5 in strict mode                      |
| Styling         | Tailwind CSS v4 + CSS custom properties          |
| Search          | Fuse.js                                          |
| Catalog builder | Python 3.11, Pydantic, Beautiful Soup, HTTPX     |
| Quality         | Node test runner, pytest, Ruff, ESLint, Prettier |

## Project structure

```text
app/                         # routes, metadata, sitemap, generated OG images
components/                  # shared UI and model discovery features
lib/data/                    # catalog access, filters, search, and model math
lib/types/                   # schema-v2 TypeScript contracts
public/data/                 # checked-in catalog and per-model detail files
tests/                       # catalog and browser-logic checks
tools/miner/                 # authorized, stateless catalog builder
```

## Development

```sh
git clone https://github.com/serkan-uslu/ollama-explorer.git
cd ollama-explorer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command          | Purpose                              |
| ---------------- | ------------------------------------ |
| `npm test`       | Run catalog and browser-logic checks |
| `npm run lint`   | Run ESLint                           |
| `npm run build`  | Build the static application         |
| `npm run format` | Format the repository with Prettier  |

Miner setup and authorized refresh instructions live in [`tools/miner/README.md`](tools/miner/README.md).

## Deferred

Measured hardware benchmarks, local Ollama integration, verified-license normalization, history, favorites, semantic search, a public API, accounts, localization, and additional registries are deliberately deferred. See the [roadmap](https://ollama-explorer.vercel.app/roadmap) for the ordered list and the conditions for adding them.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Source corrections should include the relevant Ollama URL and exact field or tag that differs.

- [Discussions](https://github.com/serkan-uslu/ollama-explorer/discussions)
- [Bug reports](https://github.com/serkan-uslu/ollama-explorer/issues?q=is%3Aissue+label%3Abug)
- [Feature requests](https://github.com/serkan-uslu/ollama-explorer/issues?q=is%3Aissue+label%3Aenhancement)

## License

The Ollama Explorer source code is MIT licensed. Model licenses are separate and must be verified with each model's source.
