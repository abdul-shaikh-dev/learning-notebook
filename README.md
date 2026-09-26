# Learning Notebook

Open **index.html** in Edge, Chrome or Firefox. No installation, account or internet connection is needed for the learning content. Internet is only needed to follow the primary-source links.

## A 15-minute routine

1. Open the next lesson in the learning path.
2. Read the main explanation and worked example.
3. Expand “Go deeper” and “Connect it to your data and systems”.
4. Try the related lab and its suggested experiment.
5. Answer the checkpoint and explain the result aloud before marking it complete.

The 18 lessons take roughly three hours to read, with additional time for experiments and the case study. The path covers financial instruments and valuation, IPV, accounting reserves, hierarchy, the nine EU AVA categories, aggregation concepts, CET1, day-one P&L, data lineage and month-end controls.

## Find your way around

The learning path groups all 18 lessons into five expandable modules. Each module shows its purpose, duration, completion count and related practice. Search the course by topic or show only unfinished lessons. Every lesson has an outline for jumping to the concept, example, deeper explanation, systems connection or checkpoint.

| Module | Lessons | Focus |
|---|---|---|
| Foundations | 1–3 | Trade values, fair value and market data |
| Valuation control | 4–7 | IPV, evidence, exceptions and reserves |
| Fair value hierarchy | 8–10 | Observability, significance and classification |
| Prudent valuation | 11–15 | AVAs, uncertainty, aggregation and capital |
| Working knowledge | 16–18 | P&L, data lineage and the month-end case |

## Folder guide

```text
index.html                 Open this to learn
handbook.html              Full printable reading edition
README.md                  How to use this project
verify.cjs                 Stable verification entry point
content/
  curriculum.js            All lessons, quizzes, glossary and sources
assets/
  css/styles.css           Presentation and responsive layout
  js/app.js                Navigation, learning views and interaction
  js/core.js               Educational calculations
practice/
  sample-positions.csv     Six synthetic positions
  answers.md               Calculations, control conclusions and dictionary
tests/
  verify.cjs               Arithmetic, content and link checks
docs/
  verification-initial.md  Original verification snapshot
  preview-initial.png     Original visual snapshot
```

Run `node verify.cjs` from the root to check the learning content and calculations. The root HTML filenames and lesson URL fragments are unchanged, and existing browser progress continues to use the same storage key.

Keep these files together when copying the folder. Progress is stored in your browser on this device. File location and browser changes can create a separate storage area. Use **Back up progress** in the sidebar, and **Restore progress** when moving to another location. If browser storage is unavailable, the app remains usable for the current session and shows a reminder to export.

## Scope and conventions

This guide is tailored to technology/data/application work. It teaches general concepts first, with explicitly labelled IFRS and EU prudent valuation references and a few UK distinctions. It is a substantial foundation, not an exhaustive bank methodology or production calculation engine. All positions, amounts, source-quality judgements, tolerances and approvals are synthetic. Regulatory details are sourced as of 26 September 2026, with dated standard editions identified in the source library.

Full curve construction, derivatives pricing, xVA exposure simulation, legal netting, complete AVA calibration/aggregation conditions and regulatory reporting templates need deeper topic-specific material and your bank's applicable policies. The normal-distribution lab is a mathematical illustration, not an approved AVA estimator. The value bridge is before aggregation and uses long assets with positive deduction magnitudes. The hierarchy explorer assumes that a human has assessed observability and significance.

The app makes no external requests. Source links open official references when you choose them. There is no analytics or data upload.


## New to trading?

Start with **Start from zero** in the app: six introductions explain instruments, trades, positions, books, desks, price/value, P&L and the control workflow. Then move into the original 18-lesson course. Main lessons include expandable plain-language term help. All 24 lessons are included in the printable handbook. Existing main-course lesson links and saved progress remain compatible.

## GitHub Pages and phone access

See [the hosting guide](docs/github-pages.md). Run `node scripts/build-pages.cjs` to create `_site/`, a static deployment artifact with relative URLs that work at `/learning-notebook/`. No server-side application, account login or installation is needed to use the site.

The GitHub Actions workflow validates and packages the site on pushes. Publishing is a separate manual workflow action (`publish: true`) after Pages has been enabled. Your private repository can remain private, but a standard personal-account Pages website is public. GitHub Pro or another eligible plan is required to publish Pages from a private repository. A private website requires a different supported access-control arrangement.

Progress is saved separately on each device/browser and origin. It does not automatically sync between your PC, local files and the hosted phone site. Back up progress on one and restore the JSON on the other if desired. Source links require internet; the hosted site needs connectivity to load initially. No offline caching or installable-app support is promised.

## Multiple learning paths

Open index.html for the subject catalog. The current course is in course.html. AI agents and agent harnesses are planned entries, not completed courses. See [Adding learning paths](docs/adding-learning-paths.md) for the reusable lesson schema, progress isolation and publishing steps.
