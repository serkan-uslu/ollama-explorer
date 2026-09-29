# SEO Guide — Ollama Explorer

## Implemented

| Item                                   | Location                              | Behavior                                                                         |
| -------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| Title template and default description | `app/layout.tsx`                      | Shared site metadata with page-level overrides                                   |
| Canonicals                             | Public indexable pages                | Stable production URL for home, browse, informational, and slug detail pages     |
| Model metadata                         | `app/models/[id]/page.tsx`            | Source name, description, capabilities, and applications                         |
| Production robots policy               | `app/layout.tsx`, `app/robots.ts`     | Index and follow public production pages                                         |
| Preview protection                     | `next.config.ts`                      | `X-Robots-Tag: noindex, nofollow` on non-production Vercel deployments           |
| Sitemap                                | `app/sitemap.ts`                      | Static routes plus active model slugs; dates come from source/catalog timestamps |
| Global Open Graph image                | `app/opengraph-image.tsx`             | Generated 1200×630 product image                                                 |
| Model Open Graph metadata              | `app/models/[id]/page.tsx`            | Page-specific title and description with the shared product image                |
| WebSite JSON-LD                        | `app/page.tsx`                        | Site identity plus `SearchAction` for `/models?q=`                               |
| Model JSON-LD                          | `app/models/[id]/page.tsx`            | `SoftwareApplication` and `BreadcrumbList`                                       |
| Visible breadcrumbs                    | `app/models/[id]/page.tsx`            | Home → Models → model                                                            |
| Semantic layout                        | App pages and shared layout           | Landmarks, heading hierarchy, skip link, and accessible controls                 |

The root layout supplies global Open Graph and Twitter defaults; model routes provide page-specific title and description values while reusing the shared product image.

## Indexing rules

- Active model slugs are statically generated and included in the sitemap.
- Legacy UUID routes permanently redirect to the canonical slug.
- Preserved `unlisted` model pages use `noindex, follow` and are omitted from browse results and the sitemap.
- `/models/compare` uses `noindex, follow` because query parameters create many equivalent comparison combinations.
- Non-production Vercel deployments send an `X-Robots-Tag` header that blocks indexing.
- The sitemap uses each model's source update time when known and falls back to the catalog generation time.

No model count is hard-coded into metadata or the sitemap; both read the checked-in schema-v2 catalog.

## Content and data rules

- Describe the catalog as **source-backed**, not AI-enriched.
- Do not call every catalog entry open source. A missing license is `Not verified`, and model licensing is separate from this repository's MIT license.
- Use the complete source variant ref in command copy and previews: `ollama run model:tag`.
- Distinguish `local`, `cloud`, and `both` availability.
- Label memory as an estimate derived from download size. It varies with context, runtime, GPU offload, the operating system, and other workloads.
- Keep unknown values unknown; do not turn missing sizes, dates, licenses, or counts into zero-value claims.
- Link model assertions back to each record's `source_url` on Ollama.

These rules keep search snippets and social previews aligned with the product instead of overstating catalog completeness or model licensing.

## Structured data

### Homepage

`WebSite` includes the production URL, source-backed product description, and a `SearchAction` targeting:

```text
https://ollama-explorer.vercel.app/models?q={search_term_string}
```

### Model detail

Each model page emits:

- `SoftwareApplication` with the source name, description, capabilities/applications as keywords, and supported desktop operating systems
- `BreadcrumbList` matching the visible breadcrumb navigation

Structured data intentionally omits ratings, prices, benchmark claims, and license assertions that are not in the source-backed catalog.

## Deferred

- `hreflang` until localized routes exist
- PWA manifest and install metadata until offline/PWA support exists
- Review/rating structured data until a real moderated review system exists
- Dataset/API structured data until a stable hosted API is published

## Release checklist

- [ ] Production canonical host is unchanged or every metadata constant is updated together
- [ ] `npm test` passes the catalog contract
- [ ] `npm run build` generates active model routes and the sitemap
- [ ] Unlisted records remain absent from `/models` and `/sitemap.xml`
- [ ] A local-only, cloud-only, and mixed model show the correct availability and exact command
- [ ] Rich Results Test accepts the homepage and a representative model page
- [ ] A production response is indexable and a preview deployment returns `X-Robots-Tag: noindex, nofollow`
