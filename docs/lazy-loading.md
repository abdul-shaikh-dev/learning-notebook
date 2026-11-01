# On-demand notebook content

`node scripts/sync-catalog.cjs` generates the full editorial/test catalog plus the public lightweight `content/catalog.js` and `content/courses/<path>.js` chunks. Do not edit generated files. The homepage metadata contains course labels, lesson IDs/titles and stage IDs so resume, completion counts and backups work without loading lesson bodies.

`assets/js/notebook-loader.js` loads a course on a path, topic, resource or printable-pack route, and loads the search index on the search route. Classic same-origin scripts preserve the existing non-module architecture; no fetch/CDN dependency is introduced. Course and search URLs carry content hashes. Requests are deduplicated, route changes invalidate pending rendering, and failed requests provide a retry button. Progress storage keys and formats are unchanged.

## Lesson-only code and styles

The code highlighter, code panels, Mermaid diagrams, the concept-explorer scenes and their styles are used only on path, topic, resource and pack pages. `index.html` lists these 18 files as `<meta name="lesson-asset" content="…">` placeholders: styles where their `<link>` used to be, so the cascade order is unchanged, and scripts at the end of the head, in the order they must run (the scene registry before the scenes). The first of those routes adds each real tag beside its placeholder, with scripts set to run in document order, and renders once the course and every asset have loaded. Later lesson pages need nothing more. A failed file shows the usual retry, which requests only what failed. Home, search, progress and review never fetch them. The service worker still caches every file under `assets/`, so offline lessons are complete. Bump a file's `?v=` in its placeholder, as before.

Measured with `node` driving headless Chrome over gzip, cold cache, Fast 3G and 4× CPU throttling (median of five), before → after:

| Page | First contentful paint | Transferred | Requests |
| --- | --- | --- | --- |
| Home | 1,092 → 896 ms | 205 → 118 KB | 46 → 28 |
| Search | 1,168 → 808 ms | 507 → 420 KB | 46 → 28 |
| Progress & backups | 1,168 → 828 ms | 205 → 118 KB | 45 → 27 |
| A lesson | 1,168 → 812 ms | 244 → 244 KB | 46 → 46 |

A lesson transfers the same files, after its first paint instead of before. `tests/lesson-assets.cjs` checks the placeholders, their order, that other routes fetch nothing, that rendering waits for every asset, and the retry.

## Build

The public build excludes the monolithic `content/paths.js`, while retaining it locally for editorial and regression tooling. Planned paths have metadata only and no public course chunk. Stale chunks left in an authoring folder are not included in the explicit production inventory.

Run `node tests/lazy-loading.cjs` for loading/race/retry checks and `node scripts/sync-catalog.cjs --check` for generated consistency. Browser-check direct links, search, progress backups, resource pages and printable packs after loader changes.

Initial course/search data decreased from 3,761,074 bytes to approximately 41 KB uncompressed. This comparison excludes other scripts/styles and is not a network speed benchmark. Search still loads its complete index once requested; each course loads its complete content once requested.
