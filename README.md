# Learning Notebook

A static, extensible learning library. [Open the live site](https://abdul-shaikh-dev.github.io/learning-notebook/).

## Study

Open `index.html` locally or use the website on a phone. The financial path contains six introductions, 18 main lessons, six foundation explainers, seven labs, five applied practice modules, six mixed revision tasks and a complete printable study pack. AI agents and agent harnesses are planned paths, not available courses.

Reading, practising and self-checking are separate activities. Progress stays in the current browser and origin; it does not automatically sync between a PC and phone. The financial course offers JSON backup/import. Old lesson URLs and existing financial progress remain compatible. Save the full handbook as PDF through its Print button for a portable offline reference; the hosted site itself is not an offline-cached app.

## Repository map

- `index.html`: shared catalog entry point.
- `assets/`: shared catalog reader and design styles.
- `paths/<path-id>/path.json`: a path's metadata and explicit public-file list.
- `paths/financial-foundations/content/`: lessons, foundations, regulatory additions, activities, exercises and evidence register.
- `paths/financial-foundations/runtime/`: specialized course, study-pack rendering and calculations.
- `paths/financial-foundations/practice/`: canonical CSV and answer key.
- `course.html`, `handbook.html`: stable financial entry points, retained for existing bookmarks.
- `content/paths.js`: generated catalog, never edit manually.
- `practice/`: generated legacy download aliases, retained for old links.
- `scripts/`: path scaffolding, synchronization and portable static build.
- `tests/`: financial, catalog, study-pack and compatibility checks.
- `docs/`: authoring, architecture, reviews and historical verification snapshots. These do not enter the deployed artifact.

## Add a subject

Run `node scripts/new-path.cjs my-topic "My topic"`. Edit the new draft's `path.json`, then follow [the authoring guide](docs/adding-learning-paths.md). Standard paths reuse the shared reader; specialized courses can own their own runtime without changing the finance course.

## Validate and publish

```
node scripts/sync-catalog.cjs
node scripts/sync-finance.cjs
node verify.cjs
node scripts/build-pages.cjs
```

Serve the build at a project prefix such as `/learning-notebook/` for browser checks. GitHub Actions builds on pushes; publishing remains an explicit run of `pages.yml` with `publish=true`. Only ready-path allowlisted assets enter `_site/`. The repository is public; excluded source/docs remain visible on GitHub even though they are absent from the website artifact. See [hosting](docs/github-pages.md).

The financial materials use synthetic positions and dated primary-source references. They teach concepts and controls, not a complete production methodology. Exact articles, versions and source-access limitations appear in the evidence register and technical sections.
