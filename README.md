# Learning Notebook

A personal, customizable notebook for learning software, AI, financial concepts and everyday skills. Follow a learning path, study a worked example, or return to a diagram and practice task whenever you have time.

**[Open the notebook](https://abdul-shaikh-dev.github.io/learning-notebook/)** · **[Browse the source](paths/)**

The notebook currently contains **30 learning paths and 668 lessons and challenges**. It is a static site with no account requirement, available on desktop and mobile through GitHub Pages.

## Choose a learning path

| Area | Courses |
| --- | --- |
| Programming | [Python Problem Solving](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/python-problem-solving) · [Python](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/python) · [C# & .NET](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/dotnet) · [JavaScript → TypeScript → React](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/react) · [SQL Server & T-SQL](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/sql-server) · [Data Structures & Algorithms](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/data-structures-algorithms) |
| Design and building products | [Design Patterns](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/design-patterns) · [System Design](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/system-design) · [UI Design & Accessibility](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/ui-accessibility) · [Full-Stack Project Journey](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/full-stack-journey) |
| AI | [AI Agents](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/ai-agents) · [Agent Harnesses](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/agent-harnesses) |
| Engineering foundations | [Git & Team Workflows](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/git-team-workflows) · [Testing & Debugging](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/testing-debugging) · [Application Security](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/application-security) · [Networking & the Web](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/networking-web) · [Linux & Operating Systems](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/linux-operating-systems) |
| Data and distributed systems | [Data Engineering](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/data-engineering) · [Messaging & Event-Driven Systems](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/messaging-events) · [Observability & Performance](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/observability-performance) |
| Delivery and infrastructure | [Delivery & Operations](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/delivery-operations) · [Kubernetes](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/kubernetes) · [Cloud & Infrastructure as Code](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/cloud-infrastructure) |
| Personal effectiveness | [Time, Attention & Energy](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/time-attention-energy) · [Task & Project Management](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/task-project-management) · [Habits & Behaviour Change](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/habits-behaviour-change) · [Learning How to Learn](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/learning-how-to-learn) · [Self-Awareness & Communication](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/self-awareness-communication) · [Plan and Review Your Week](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#path/weekly-planning-journey) |
| Financial concepts | [Financial foundations](https://abdul-shaikh-dev.github.io/learning-notebook/course.html#explore) |

## Study at your own pace

Start at a course overview to see its prerequisites, learning outcomes and stages. Courses cover foundations and intermediate practice, with selected advanced exercises. Financial foundations has its own beginner introductions, main lessons, visual stories and labs.

- Read the explanations and worked examples directly. Animations and interactive diagrams are optional.
- Download practice files beside each exercise. The guides explain which local tools you need. Code examples include copy controls and syntax highlighting.
- Use **Read & continue** to mark a lesson as read and open the next one. Opening a lesson does not mark it complete. Quizzes do not block navigation.
- Find a topic through search, the course map, lesson navigation or a printable study pack. The [financial handbook](https://abdul-shaikh-dev.github.io/learning-notebook/handbook.html) is also available as one continuous reference.

The personal effectiveness paths include a [browser practice studio](https://abdul-shaikh-dev.github.io/learning-notebook/paths/time-attention-energy/practice/lab.html) for planning and reflection. Studio entries stay in memory unless you explicitly export them; a chosen review date does not schedule a notification.

The Python Problem Solving path contains 30 original challenges with optional hints and worked reasoning. Download its ZIP, edit `solutions.py`, and run each challenge locally with `check.py`. Tests do not require an account or packages; passing them is separate from reading progress.

## Offline access and progress

On the hosted site, open **Offline & install** to install the notebook where your browser supports it, or save individual courses for offline reading. Saved courses include their lesson assets and practice files. External sources, live APIs and workshop dependencies still need their own connection or installation. Browser storage can be evicted, so check your downloads before travelling. See [offline behavior and validation](docs/pwa.md).

Reading progress is stored in the current browser for the current site address. There is no account or automatic synchronization between your phone, PC and local file copy. Use **Progress & backups** to export and restore a JSON backup when moving devices or browsers. Keep personal exports outside this public repository.

## Run locally

For reading, open `index.html` directly, or serve the repository from its root:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. Reading does not require a frontend build or package installation. Direct file URLs do not support service workers; to test offline installation, build and serve `_site/` instead:

```sh
node scripts/build-pages.cjs
python -m http.server 8877 --bind 127.0.0.1 --directory _site
```

## Customize or add a subject

Author course content in `paths/<id>/`; generated catalogs and bundles are rebuilt from those files. To create a new planned path:

```sh
node scripts/new-path.cjs my-topic "My topic"
```

Follow the [authoring guide](docs/adding-learning-paths.md) to add lessons, prerequisites, examples, diagrams and practice resources, then make the path ready when its content is complete.

| Location | Purpose |
| --- | --- |
| `index.html`, `assets/` | Shared library, reader, navigation and visual components |
| `paths/<id>/path.json` | Canonical course metadata, lessons and public-file inventory |
| `paths/<id>/resources.json`, `paths/<id>/practice/` | Course task kits, commands and downloadable workshop files |
| `paths/<id>/diagrams.json`, `paths/<id>/visuals.json` | Authored diagrams and concept explorers, where present |
| `paths/financial-foundations/content/`, `paths/financial-foundations/runtime/` | Financial course content and its dedicated reader |
| `course.html`, `handbook.html` | Stable entry points for the financial course and study pack |
| `practice/personal-effectiveness-studio/` | Shared browser planning and reflection studio |
| `content/` | Generated catalog, lazy course payloads and local search index |
| `scripts/`, `tests/` | Generation, verification and deployment tooling |
| `docs/` | Authoring notes, technical guides and dated review records |

## Verify changes

After editing course content or resources, regenerate the practice bundles and catalog, then verify the results:

```sh
python scripts/build-bundles.py
node scripts/sync-catalog.cjs
python scripts/build-bundles.py --check
python tests/resource-bundles.py
node verify.cjs
node scripts/build-pages.cjs
```

If editing problem-solving challenges, first run `python scripts/sync-problem-solving.py` to rebuild the lessons, starters, references and test cases from `paths/python-problem-solving/challenges.json`. Extract practice downloads into a separate learner folder before editing attempts. If editing the shared personal studio, first run `node scripts/sync-personal-studio.cjs`. If editing the canonical financial CSV or answer key, first run `node scripts/sync-finance.cjs`. Commit the source and its regenerated outputs together.

Executable workshop checks are separate from site/content checks:

```sh
python scripts/verify-python.py
npm ci --prefix validation/react --ignore-scripts
npm test --prefix validation/react
python scripts/verify-dotnet.py
python scripts/verify-fullstack.py
```

Use the tool versions and setup instructions in the relevant workshop guide. SQL Server execution is opt-in for the full-stack runner through `--sql-server`; live AI providers and real authentication exercises also require separate setup. A passing content check alone does not mean those integrations have been executed.

## Publish to GitHub Pages

The existing public repository hosts the notebook at **https://abdul-shaikh-dev.github.io/learning-notebook/**. Pushes to `main` run validation and build checks; publication is an explicit workflow dispatch:

```sh
gh workflow run pages.yml -f publish=true --ref main
```

The build publishes an allowlisted `_site/` directory containing the ready courses and their assets. Tests, internal documentation and verification snapshots are excluded from the site, but remain visible in the public source repository. Preview under a `/learning-notebook/` path when checking GitHub Pages URL compatibility.

## Scope

This is a personal learning resource, with sources, worked examples and practice to support understanding. Course stages describe the material's depth; completing them is not certification or proof of production experience. Financial examples use synthetic data, and deployment, security, live integrations and operation under load need experience beyond the notebook exercises.
