# Adding and maintaining learning paths

1. Run `node scripts/new-path.cjs topic-id "Topic title"` from the repository. IDs must be unique lowercase hyphenated words. A new path is planned and its lesson payload is excluded from the public catalog.
2. Edit `paths/topic-id/path.json`. Standard paths omit `href` and use `lessons` as an array. Each lesson has a stable id, title, takeaway, sections with title/paragraphs/optional example, and an optional quiz with question/options/zero-based correct/explanation. The scaffold supplies a complete draft example.
3. Add original explanations, explicit assumptions, worked examples, useful wrong-answer reasoning and source references where needed. Review calculations and source versions before marking status ready. The shared reader escapes lesson strings; it does not accept HTML markup.
4. Run `node scripts/sync-catalog.cjs` to regenerate `content/paths.js`. Open index.html to review locally. Generic routes are `#path/topic-id` and `#topic/topic-id/lesson-id`.
5. Run `node verify.cjs` and `node scripts/build-pages.cjs`, then test the built site under its project prefix on desktop and phone. Commit source and generated catalog together. Publishing is a separate authorized workflow dispatch.

## Specialized courses

A course needing its own simulations can set `href` to its HTML entry point and declare its course-owned assets in `publicFiles`, relative to its own path directory. The build reads these manifests; adding a course does not require adding finance-specific switches to the shared catalog. A specialized HTML entry inside its directory must reference shared assets using appropriate relative paths. Add the HTML itself to publicFiles.

Financial foundations reads on the shared course page like any standard path. Its root `course.html` is the
practice studio (calculators and lab worksheets, the month-end case, the trade journey, visual stories and module
practice), and `handbook.html` prints the complete study pack. The studio content lives in
`paths/financial-foundations/practice.json` (`labs`, `labGuides`, `caseSteps`, `exercises`, `journey`,
`visualStories`, `population`) and is built into the course data with the lessons, so both pages load one file.
`scripts/manifest.cjs` checks that every lesson it names (module `lessonIds`, visual-story `lessons`, journey
`lesson`) exists, and reads `population.csv` and `population.key` into the practice rows and answer key. Studio
pages link to lessons at `index.html#topic/financial-foundations/<id>`.

Use a unique local-storage key and documented backup schema. Generic reader keys are `learning-notebook:path:<id>:v1`. The financial practice studio keeps only its `study` object (practised/checked flags by module) under `valuation-lab-v1`; this is an internal key, not website branding. Reading progress uses the generic key.

## Content ownership

Keep a path's lessons, quizzes, sources, labs and practice material inside its own directory. Share design/reader utilities only when they are truly subject-independent. Preserve historical review documents; publish a new response/verification record rather than rewriting them.

Edit the finance lessons, sources, glossary and diagrams in `path.json`, `glossary.json` and `diagrams.json`, as
for any other course. The practice studio and the handbook read them from the generated course data
(`content/courses/financial-foundations.js`) through `runtime/course-data.js`, so they need no copy. The files in
`paths/financial-foundations/content/` hold only studio material: labs and worksheets, the month-end case, module
practice, the practice population and the trade journey. Exercises and studio links still number the main lessons
1–18 (lesson 15 to 32 on the shared page). `tests/finance-parity.cjs` checks that every feature of the original reader
still has a home.

The finance printable pack and interactive app read the same practice population, built from the canonical CSV and answer key under the finance practice directory. After editing them, run `node scripts/sync-catalog.cjs` to rebuild the course data and `node scripts/sync-finance.cjs` to refresh the old download aliases in the site root. The sample CSV is unquoted; the build fails clearly if quoted fields are introduced, requiring a real CSV parser.

## Source review

A source record needs issuer/jurisdiction, edition or effective period, exact paragraph, check date, access status and change trigger. An access date is not proof that a legal rule remains current. Record proposals and future-effective text as such. If a source becomes gated, keep its official landing page and a clearly identified accessible primary-source companion.

## Publication boundaries

Manifests have an explicit publicFiles allowlist. Planned lesson payloads and nonlisted files are not bundled. This protects the website build from accidental extras; it does not make files secret in a public GitHub repository. Keep private material out of the repository entirely.
## Staged programming curricula

Standard paths can supply `stages`, ordered as foundation, intermediate and advanced. Each stage contains `id`, `title`, `description`, `exitCriteria` (strings) and `project` with `title`, `brief`, `requirements`, `rubric` and `solution`. Assign every lesson a matching `stage` ID; preserve existing lesson IDs. Keep lessons in reading order as well as stage order.

The shared reader groups lessons, shows project self-check controls, and includes reference approaches in the printable pack. Reading uses the existing v1 key; project self-assessment uses `learning-notebook:path:<id>:assessments:v1`. Neither is a certification. Paths without stages retain the basic reader.

For downloadable exercises, list files in `publicFiles` relative to the path directory and supply `downloads` entries with a `title` and repo-relative `href`. Document runtime requirements and distinguish executable reference code from illustrative fragments and learner extensions.

## Per-lesson references and exercise verification

Every ready standard lesson requires a `references` array. Each entry contains
`title`, an HTTPS `url`, a specific `section`, `reviewed` in YYYY-MM-DD format,
and `scope` explaining the version, applicability and limits. These appear beside
the lesson and in its printable pack. A review date records an editorial check;
it does not establish continued regulatory or API validity. Prefer primary sources.

A section may also carry `evidence`: notes naming the exact paragraph it relies on, each with
`label`, an HTTPS `url` and optional `paragraph`, `checked` (YYYY-MM-DD) and `status`. They appear
under the section and in the printable pack. Course `sources` may add `note`, `edition`, `checked`,
`access` and `changeTrigger`; sources with edition or check details form a source register on the
course overview, introduced by the optional path-level `sourcesNote`.

A section with an `example` may add `exampleNote`, a paragraph shown after the example. A lesson may give its
reading time in whole `minutes`. Lessons and the course may list `activities`: links to practice pages, tasks or
files outside the lesson, each with a `title`, a relative or HTTPS `href` and an optional `description`. They appear
after the lesson exercise or on the course overview, and in the printable pack, under the path-level
`activitiesTitle` (default "Practice activities").

Calculation exercises add `numericAnswer` and optional `tolerance` (absolute, default 0.01) and `unit`.
The lesson offers a number check before the worked answer; `rubric` lists self-check criteria shown
with the worked answer and in the printable pack.

Quiz answers retain their original zero-based `correct` index. The reader places
options in a stable, balanced display order; do not change source answer indices
to match the screen. Quizzes should test plausible misconceptions, with explanations.

Register practice files in both `publicFiles` and `resources.json`, attach their
task to relevant lesson IDs, and include runnable commands and expected results.
Regenerate with `node scripts/sync-catalog.cjs` and
`python scripts/build-bundles.py`; verify with `node verify.cjs` and
`python tests/resource-bundles.py`. Add executable Python suites to
`scripts/verify-python.py`; framework suites live in `validation/react` and
`scripts/verify-dotnet.py`. Clearly distinguish locally verified tests, CI checks,
opt-in external services and learner extensions.

## Glossary and quick reference

An optional `paths/<id>/glossary.json` gives the course a glossary page at `#glossary/<id>`, linked from
its course tools and lesson contents. It holds `terms` (each `term` and `definition`), optional
`title`, `intro` and search `placeholder`, and `reference` blocks: a table (`columns` and equal-length
`rows`) or a numbered list (`items`), each with a `title` and optional `intro`. Optional `plainTerms`
(and `plainIntro`) give plain-language words: each lesson that mentions one shows it under "Words for
this lesson". Alternative spellings are separated by " / ". Terms join the notebook search, and the
glossary prints at the end of the course pack. `scripts/manifest.cjs` validates the file.

## Container and infrastructure practice files

The public-file allowlist accepts YAML (`.yaml` and `.yml`) and the exact
basenames `Dockerfile` and `.dockerignore`. Declare each explicitly in the
course manifest and resource kit. ZIP generation normalizes these UTF-8 text
files to LF, as it does other source files. ZIPs flatten filenames: avoid
duplicate basenames and document any directories a learner must create.

Infrastructure exercises must name their required tools, target context and
namespace, expected result, cleanup and execution limits. Keep local
simulations and static manifest checks distinct from evidence obtained by
running a real container, cluster or identity provider.

## Keep the reading flow clear

Teach the mechanism in the lesson, then show one concrete example and an exercise.
Give each paragraph a distinct job. Replace repeated instructions such as “trace the
example and explain the boundary” with an explanation of what the example does.
Keep takeaways short and write quiz feedback that explains the decision.

Wrap inline code in lesson paragraphs in backticks: function and variable names,
calls, file names, commands with their flags, settings and SQL keywords, for example
``Run `python -m unittest test_lab.py`, then inspect `parse_record` ``. Mark a whole
expression as one span (`` `df.loc[mask, "column"]` ``) rather than its pieces. The
reader renders each span as `<code>`; search indexes the text without the backticks.
`node tests/inline-code.cjs` flags likely unmarked code. Maths notation and names that
only look like code belong in `tests/inline-code-allow.json`, optionally limited to one
course as `"course-id: entry"`.

The reader keeps lesson explanations and complete diagram walkthroughs visible.
Motion, quiz answers and reference solutions remain optional. Course overviews show
one stage navigation and keep project assessment details out of the main reading
list. Practice bundles and relevant guides are linked beside the exercise; complete
file inventories and run instructions live at the task route. Preserve these routes
and source detail when simplifying copy.

“Read & continue” explicitly records reading and opens the next lesson in one action.
The separate next-lesson link navigates without recording completion. Opening a page
never counts as completing it. Keep reading, quiz and project assessment independent.


## Problem-solving challenges

`paths/python-problem-solving/challenges.json` owns the 30 original problems,
examples, visible cases, optional hints and worked reasoning. Run
`python scripts/sync-problem-solving.py` after edits; use `--check` to detect
stale generated reader metadata, starters, reference code and cases. Do not edit
that path's generated `path.json`, `resources.json`, `solutions.py`, `reference.py`,
`cases.json` or practice README directly. Run attempts in an extracted learner folder.

The shared exercise reader supports `challenge`, `command`, `hints`, `reasoning`,
`complexity`, `pitfalls` and `transfer`. Hints and solutions start collapsed;
the printable pack includes their complete text. Coding challenges use executable
cases instead of a second quiz. Reading completion does not record a passing solution.

The runner and its tests remain authored files. Register new problem contracts in
the independent `test_reference.py` suite as needed. Run the supplied references
and runner tests, then rebuild bundles, catalogs and the public site.
