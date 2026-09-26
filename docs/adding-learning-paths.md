# Adding and maintaining learning paths

1. Run `node scripts/new-path.cjs topic-id "Topic title"` from the repository. IDs must be unique lowercase hyphenated words. A new path is planned and its lesson payload is excluded from the public catalog.
2. Edit `paths/topic-id/path.json`. Standard paths omit `href` and use `lessons` as an array. Each lesson has a stable id, title, takeaway, sections with title/paragraphs/optional example, and an optional quiz with question/options/zero-based correct/explanation. The scaffold supplies a complete draft example.
3. Add original explanations, explicit assumptions, worked examples, useful wrong-answer reasoning and source references where needed. Review calculations and source versions before marking status ready. The shared reader escapes lesson strings; it does not accept HTML markup.
4. Run `node scripts/sync-catalog.cjs` to regenerate `content/paths.js`. Open index.html to review locally. Generic routes are `#path/topic-id` and `#topic/topic-id/lesson-id`.
5. Run `node verify.cjs` and `node scripts/build-pages.cjs`, then test the built site under its project prefix on desktop and phone. Commit source and generated catalog together. Publishing is a separate authorized workflow dispatch.

## Specialized courses

A course needing its own simulations can set `href` to its HTML entry point and declare its course-owned assets in `publicFiles`, relative to its own path directory. The build reads these manifests; adding a course does not require adding finance-specific switches to the shared catalog. A specialized HTML entry inside its directory must reference shared assets using appropriate relative paths. Add the HTML itself to publicFiles. Finance retains root course.html/handbook.html as compatibility entry points.

Use a unique local-storage key and documented backup schema. Generic reader keys are `learning-notebook:path:<id>:v1`. The financial course retains `valuation-lab-v1` solely to preserve existing progress; this is an internal compatibility key, not website branding. Its `study` object stores practised/checked flags by module, while original `done` and `starterDone` arrays track reading. Old backup files remain accepted.

## Content ownership

Keep a path's lessons, quizzes, sources, labs and practice material inside its own directory. Share design/reader utilities only when they are truly subject-independent. Preserve historical review documents; publish a new response/verification record rather than rewriting them.

The finance printable pack and interactive app consume the same content files. Edit canonical CSV/answer key under the finance practice directory, then run `node scripts/sync-finance.cjs` to regenerate the embedded printable data and old download aliases. Current sample CSV is unquoted; the synchronizer fails clearly if quoted fields are introduced, requiring a real CSV parser.

## Source review

A source record needs issuer/jurisdiction, edition or effective period, exact paragraph, check date, access status and change trigger. An access date is not proof that a legal rule remains current. Record proposals and future-effective text as such. If a source becomes gated, keep its official landing page and a clearly identified accessible primary-source companion.

## Publication boundaries

Manifests have an explicit publicFiles allowlist. Planned lesson payloads and nonlisted files are not bundled. This protects the website build from accidental extras; it does not make files secret in a public GitHub repository. Keep private material out of the repository entirely.
## Staged programming curricula

Standard paths can supply `stages`, ordered as foundation, intermediate and advanced. Each stage contains `id`, `title`, `description`, `exitCriteria` (strings) and `project` with `title`, `brief`, `requirements`, `rubric` and `solution`. Assign every lesson a matching `stage` ID; preserve existing lesson IDs. Keep lessons in reading order as well as stage order.

The shared reader groups lessons, shows project self-check controls, and includes reference approaches in the printable pack. Reading uses the existing v1 key; project self-assessment uses `learning-notebook:path:<id>:assessments:v1`. Neither is a certification. Paths without stages retain the basic reader.

For downloadable exercises, list files in `publicFiles` relative to the path directory and supply `downloads` entries with a `title` and repo-relative `href`. Document runtime requirements and distinguish executable reference code from illustrative fragments and learner extensions.
