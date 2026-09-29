# On-demand notebook content

`node scripts/sync-catalog.cjs` generates the full editorial/test catalog plus the public lightweight `content/catalog.js` and `content/courses/<path>.js` chunks. Do not edit generated files. The homepage metadata contains course labels, lesson IDs/titles and stage IDs so resume, completion counts and backups work without loading lesson bodies.

`assets/js/notebook-loader.js` loads a course on a path, topic, resource or printable-pack route, and loads the search index on the search route. Classic same-origin scripts preserve the existing non-module architecture; no fetch/CDN dependency is introduced. Course and search URLs carry content hashes. Requests are deduplicated, route changes invalidate pending rendering, and failed requests provide a retry button. Progress storage keys and formats are unchanged.

The public build excludes the monolithic `content/paths.js`, while retaining it locally for editorial and regression tooling. Planned paths have metadata only and no public course chunk. Stale chunks left in an authoring folder are not included in the explicit production inventory.

Run `node tests/lazy-loading.cjs` for loading/race/retry checks and `node scripts/sync-catalog.cjs --check` for generated consistency. Browser-check direct links, search, progress backups, resource pages and printable packs after loader changes.

Initial course/search data decreased from 3,761,074 bytes to approximately 41 KB uncompressed. This comparison excludes other scripts/styles and is not a network speed benchmark. Search still loads its complete index once requested; each course loads its complete content once requested.
