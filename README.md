# Learning Notebook

A static, extensible learning library. [Open the live site](https://abdul-shaikh-dev.github.io/learning-notebook/).

## Study

Open `index.html` locally or use the website on a phone. The financial path contains six introductions, 18 main lessons, six foundation explainers, seven labs, five applied practice modules, six mixed revision tasks and a complete printable study pack. AI Agents and Agent Harnesses have staged lessons and offline practice workshops.

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

### Visual stories

The financial path opens with a topic map and three visual stories: trades → positions → realised/unrealised P&L, accounting versus prudent adjustments, and entity/desk/book relationships. The sliders and trade steps share tested arithmetic in runtime/story-math.js; course-specific UI lives in runtime/visual-stories.js and styles/visuals.css. Worked versions are included in the printable handbook. The course menu collapses on phones.

### Trade lifecycle walkthrough

Follow one trade through eight stages at course.html#journey/booking. Each stage includes inputs, outputs, illustrative owners, controls, data lineage and a self-check. Switch between usable and stale evidence to compare an approved correction with an unresolved exception. Content and arithmetic live in content/journey.js; runtime/journey.js and styles/journey.css provide the course UI. The same content is included in the printable study pack.

### Programming learning paths

Five paths offer foundations, intermediate development and advanced practice: Python (23 lessons), C# & .NET (24), JavaScript → TypeScript → React (22), SQL Server & T-SQL (24), and Data Structures & Algorithms (20). Each stage includes exit criteria and a practical project with requirements, a self-assessment rubric and a reference approach. These are bounded learning curricula, not exhaustive platform references or proof of professional mastery.

Use index.html#path/<id> for the course overview and #pack/<id> for the complete printable pack, including project references. Practice code runs in the learner's tools; there is no browser code runner. Reading progress and project self-checks are separate, path-specific and local to the browser. Existing lesson IDs and reading progress keys remain compatible.

Validation: all Python lesson examples/exercise solutions and the 18 project tests ran; DSA reference scripts and oracle checks passed. React practice TSX and domain modules passed strict TypeScript compilation, and domain tests ran in Node; illustrative browser-component tests were not executed. New C# console/API examples and HTTP acceptance checks ran using installed .NET 9; the curriculum targets .NET 10 LTS, which was not available. Package-based EF/auth examples remain extensions. SQL fixtures and expected results were checked without a SQL Server engine or live cross-session concurrency test; use a dedicated training instance. Run the curriculum and site checks with node verify.cjs.


### Design and architecture learning paths

Design Patterns (22 lessons) focuses on responsibilities and collaboration inside code: when a pattern helps, how to refactor toward it, and when a plain function or simple class is better. System Design (24 lessons) focuses on service requirements, data flows, capacity, reliability, security and operational tradeoffs. Both use the same three-stage reader, exercises, visual traces, project rubrics and printable packs.

A useful sequence is one programming-language path first, then Design Patterns. SQL Server and basic API experience help with System Design; its foundations introduce the architecture vocabulary before scaling and failure scenarios. You can study both design paths together: code structure and system architecture inform each other, but they solve different kinds of problems.

### AI Agents and Agent Harnesses

Start with AI Agents for model behavior, tool use, context, grounding, planning and evaluation. Continue with Agent Harnesses for the surrounding runtime: state transitions, permissions, approval pauses, execution budgets, retries, persistence boundaries, observability and release review. Python foundations help with the optional runnable workshops; conceptual lessons can be studied without credentials or infrastructure.

The workshops use scripted decisions and synthetic local tools. They test the demonstrated application rules, not a language model's intelligence, real-provider behavior or a production security boundary. Optional live-integration guidance identifies the further evidence needed. Provider-specific references are dated; verify current official documentation before implementing them. No model pricing or availability is assumed.


## Executable release checks

The Pages workflow runs the site checks plus isolated Python workshop suites on
Python 3.11 and 3.14, React strict TypeScript/domain checks on Node 24, and C#
foundation/HTTP acceptance checks on .NET 10. Publishing requires all jobs to pass.
Run the same checks locally from the repository root:

```text
node verify.cjs
python scripts/verify-python.py
npm ci --prefix validation/react --ignore-scripts
npm test --prefix validation/react
python scripts/verify-dotnet.py
```

The .NET runner defaults to net10.0; `--framework net9.0` permits a local comparison
with an installed .NET 9 SDK but does not establish .NET 10 compatibility. Its
temporary API is bound to loopback and stopped after testing. React dependencies
are pinned in validation/react/package-lock.json; they are not published to Pages.
SQL engine/concurrency checks, real-model evaluations and the advanced-project
extensions remain separate from these executable baseline checks.


## Task kits and accessible diagrams

Each ready path can add `resources.json` beside `path.json`. It defines named
files (repository-relative href, role and description), task kits (file IDs,
steps, commands with expected results, prerequisites and notes), lesson-to-task
mappings and a course-specific ZIP folder. The shared reader places the matching
stage project kit beside each lesson and exposes a Files & run instructions
shortcut. Keep a task's complete dependency set in its file IDs.

Practice ZIPs contain flat filenames inside the named course folder plus a
generated START-HERE.txt. Commands must start from that extracted folder and
identify their shell or application where relevant. Explain baseline limitations;
do not imply an illustrative reference implements an advanced extension.

Optional `diagrams.json` maps existing lesson IDs to a title, summary, named nodes,
labelled edges and narrated steps. Steps identify active node IDs and zero-based
edge indices. Preserve the full relationship map while highlighting a step; every
diagram also supplies readable descriptions and all-step text for print.

After changing course files, task metadata or diagrams, run:

```text
python scripts/build-bundles.py
node scripts/sync-catalog.cjs
python scripts/build-bundles.py --check
python tests/resource-bundles.py
node verify.cjs
node scripts/build-pages.cjs
```

Commit the regenerated ZIPs and catalog together with their sources. The release
workflow rejects stale bundles and the public build includes only the explicit
course inventory. The reader and resource links also work when opened via file://.
