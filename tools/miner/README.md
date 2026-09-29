# Ollama Explorer miner

Small, stateless catalog builder. It reads the last accepted static catalog as its cache,
refreshes only new or source-changed models, validates the complete candidate, then writes
the v2 JSON files atomically. It has no database, orchestrator, or LLM dependency.

Summary facets are deterministic derived data, not AI enrichment:

- `input_modalities` and `quantizations` are sorted unions across every variant.
- `local_variant_count` and `cloud_variant_count` count every exported variant.
- `max_download_size_bytes` is the largest known downloadable local variant; unknown sizes
  stay unknown and cloud usage tiers are never converted into bytes.
- `categories` uses only source fields: `chat` requires a text-input variant and excludes
  embedding models; `coding` requires the `code`/`coding` capability or a named coding
  application (Claude Code, Cline, Codex, Continue, OpenCode); `vision` and `audio` use the
  matching capability or input modality; `tools`, `reasoning`, and `embedding` use their
  matching source capabilities (`thinking` also maps to `reasoning`).

These fields are convenience indexes. They do not assert license, family, speed, complexity,
quality, or benchmark facts. Existing schema-v2 files that predate the fields are upgraded in
memory from their variants when loaded.

The miner also writes `public/data/variant-index.json` for exact browse filtering without
shipping every detail record in the client bundle. Its versioned contract is:

```text
{ schema_version: 1, generated_at, models: { [active_slug]: VariantIndexRecord[] } }
```

Model keys and records are sorted by slug and full variant ref. Unlisted models are excluded.
Each record contains only `ref`, `tag`, `availability`, `download_size_bytes`, parameter
`raw`/`total_billion`, `quantization`, `context_window`, `input_modalities`, and `is_default`.
Unknown values remain `null`; download size is the input to Explorer's documented memory
estimate and is not rewritten as a measured RAM requirement.

## Setup

```sh
python -m venv .venv
.venv/bin/pip install -e 'tools/miner[dev]'
```

Convert the existing legacy catalog without using the network:

```sh
.venv/bin/python -m ollama_miner --repo-root . --migrate-legacy path/to/models.json
```

Run an authorized refresh:

```sh
OLLAMA_CRAWL_AUTHORIZED=true .venv/bin/python -m ollama_miner --repo-root .
```

Pass `--force-refresh` after changing detail/tag parsing rules. Routine runs deliberately
reuse details whose source signature has not changed.

Install CI's reproducible dependency set from `requirements.lock`. Regenerate it after changing
`pyproject.toml` with the compile command recorded at the top of the lock file.

`OLLAMA_REQUEST_DELAY` defaults to 0.5 seconds. `OLLAMA_MINER_TOKEN` adds a bearer token,
and `OLLAMA_BASE_URL` selects an explicitly authorized compatible source. The command refuses
network access until `OLLAMA_CRAWL_AUTHORIZED=true` is set. Transient transport failures, HTTP 429,
and HTTP 5xx responses are retried three times with bounded exponential backoff; `Retry-After` is
honored up to 60 seconds, while permanent HTTP 4xx responses fail immediately.

The workflow has the same authorization guard. Set the repository Actions variable
`OLLAMA_CRAWL_AUTHORIZED=true` only after the source owner has authorized the crawl. It runs daily
at 03:17 UTC and can also be started manually. Most runs reuse unchanged detail pages; Sunday runs
perform a complete detail/tag refresh, and the manual trigger exposes the same option. The workflow
uses `--fail-on-partial`, so a quarantined new model or a preserved stale model stops publication.
A changed candidate must pass Ruff, pytest, the web test suite, lint, the production build, and the
client-bundle check before the workflow commits only `public/data` to the production branch. The
connected Vercel Git integration then deploys that commit. An unchanged catalog produces neither a
commit nor a deployment.

```sh
.venv/bin/pytest tools/miner/tests
.venv/bin/ruff check tools/miner
```
