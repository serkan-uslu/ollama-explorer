# Coding rules

Ollama Explorer is a static Next.js application with a checked-in catalog. Keep it that way unless
real usage proves that a runtime service is necessary.

## Architecture

- `public/data/catalog.json` contains compact model summaries used by browse pages.
- `public/data/models/{slug}.json` contains one model's variants and is read only by server code.
- `public/data/legacy-id-map.json` keeps old UUID URLs working.
- `lib/data/models.ts` is the server-only catalog boundary.
- `lib/data/browse.ts` contains pure client-side search, filter and sort logic.
- `tools/miner/` is the stateless, authorized catalog updater.

Do not add a database, runtime API, queue, orchestrator or AI-enrichment layer for catalog work.

## Data rules

- The Ollama slug is the canonical identifier and route key.
- Unknown scalar values are `null`; unknown collections are `[]`.
- Never turn an unknown size into zero or claim it is RAM.
- Only publish source-backed capabilities and applications.
- Do not label a model open source unless its license is verified.
- Every shown command must include a complete `model:tag` reference.
- Client components may receive summaries; they must not import detail JSON.

## UI rules

- Use Server Components by default and `'use client'` only for interaction.
- Keep filter state in the documented URL parameters.
- Selections within one facet are OR; different facets are AND.
- Search defaults to relevance; an empty query defaults to popularity.
- Prefer native controls such as `<dialog>`, `<details>` and semantic tables.
- Preserve keyboard access, visible focus, labels and 44px touch targets.

## Miner rules

- Require `OLLAMA_CRAWL_AUTHORIZED=true` for network access.
- Keep requests sequential with the configured delay.
- Validate the complete candidate before writing output.
- Preserve the last good record on an existing-model fetch failure.
- Quarantine a new model whose detail cannot be fetched.
- Reject empty data, duplicate slugs/tags and source drops over 10%.
- A no-change run must not create a commit or pull request.

## Required checks

```bash
npm test
npm run lint
npm run build
npm run check:bundle

python -m pip install -e 'tools/miner[dev]'
ruff check tools/miner
pytest tools/miner/tests
```

Keep changes small, reuse existing code and delete obsolete paths when their migration window closes.
