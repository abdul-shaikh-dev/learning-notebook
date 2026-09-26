# Valuation Lab

Open **index.html** in Edge, Chrome or Firefox. No installation, account or internet connection is needed for the learning content. Internet is only needed to follow the primary-source links.

## A 15-minute routine

1. Open the next lesson in the learning path.
2. Read the main explanation and worked example.
3. Expand “Go deeper” and “Connect it to your data and systems”.
4. Try the related lab and its suggested experiment.
5. Answer the checkpoint and explain the result aloud before marking it complete.

The 18 lessons take roughly three hours to read, with additional time for experiments and the case study. The path covers financial instruments and valuation, IPV, accounting reserves, hierarchy, the nine EU AVA categories, aggregation concepts, CET1, day-one P&L, data lineage and month-end controls.

## Included artifacts

- **index.html** — interactive hub: 18 lessons, seven labs, quizzes, six-stage case, glossary, formula card and source library.
- **handbook.html** — complete expanded text and answer key, ready to print or save as PDF through your browser.
- **sample-positions.csv** — six synthetic positions with short, stale, missing and model-valued cases.
- **practice-answers.md** — expected calculations, control conclusions and data dictionary.
- **content.js** — the reusable learning content; no dependency on a remote service.
- **core.js / app.js / styles.css** — the calculations, interface and styling.
- **verify.cjs** — focused arithmetic and content-integrity checks; run `node verify.cjs` if you edit the material.

Keep these files together when copying the folder. Progress is stored in your browser on this device. File location and browser changes can create a separate storage area. Use **Back up progress** in the sidebar, and **Restore progress** when moving to another location. If browser storage is unavailable, the app remains usable for the current session and shows a reminder to export.

## Scope and conventions

This guide is tailored to technology/data/application work. It teaches general concepts first, with explicitly labelled IFRS and EU prudent valuation references and a few UK distinctions. It is a substantial foundation, not an exhaustive bank methodology or production calculation engine. All positions, amounts, source-quality judgements, tolerances and approvals are synthetic. Regulatory details are sourced as of 26 September 2026, with dated standard editions identified in the source library.

Full curve construction, derivatives pricing, xVA exposure simulation, legal netting, complete AVA calibration/aggregation conditions and regulatory reporting templates need deeper topic-specific material and your bank's applicable policies. The normal-distribution lab is a mathematical illustration, not an approved AVA estimator. The value bridge is before aggregation and uses long assets with positive deduction magnitudes. The hierarchy explorer assumes that a human has assessed observability and significance.

The app makes no external requests. Source links open official references when you choose them. There is no analytics or data upload.
