# Personal effectiveness verification — 2026-10-01

Six additions: Time, Attention & Energy; Task & Project Management; Habits & Behaviour Change; Learning How to Learn; Self-Awareness & Communication; and Plan and Review Your Week. Together they contain 117 lessons, 18 assessed stage projects and 31 structured Mermaid diagrams. The whole notebook now has 29 paths and 638 lessons including financial introductions.

## Content and implementation review

- Lesson scenarios, exercise checks and stage rubrics were strengthened to be topic-specific. Research findings, expert guidance and adapted planning rules have scoped references reviewed on 2026-09-30.
- Capacity examples distinguish elapsed time from still-available time. Weekly scenario ledgers reconcile before and after agreed deferrals; an unused Monday hour is not reused after Tuesday.
- Diagrams use concrete relationships, appropriate decision branches and feedback loops. Everyday examples and project approaches render as prose; existing executable examples retain code rendering.
- Every lesson and stage resolves to named practice files. Lesson worksheets are labelled separately from stage projects. The studio opens directly beside bundles and task instructions.
- The studio is maintained once in `practice/personal-effectiveness-studio`; portable course copies are generated and checked for drift. It makes no network requests or browser-storage writes for entries. Entries are transient, with an explicit JSON export and no import or automatic sync.

## Executed verification

- `node verify.cjs`: all existing and new checks passed. Checked 170 task routes, 1,234 search destinations, 34,219 rendered/static links and all 182 generic diagrams, plus the existing nine financial maps.
- `python scripts/build-bundles.py --check`: 29 reproducible bundles passed. `python tests/resource-bundles.py`: 18 bundle tests passed.
- `node scripts/build-pages.cjs`: 499 public files built with portable local HTML references. Git whitespace checks passed.
- Studio browser checks: disruption shortfall 30 minutes, scope reduction, blocked work counted against WIP, permitted transitions, literal markup kept as text, habit plan, recall/reveal, conversation feedback, invalid export recovery and return link. The exported `my-practice.json` was found and its synthetic capacity values checked.
- All five studio activities checked at a 390 × 844 viewport: labelled controls and no page overflow. Temporary viewport reset afterward.
- Saved all six courses through the PWA UI, then stopped the local preview server. Each of 31 intended lessons was matched by its exact heading before checking its rendered SVG; all rendered offline at desktop and 390 × 844 without page overflow. All six studios loaded offline in their course-specific starting activity; capacity interaction still worked.

## Limits

Screen-reader sessions, physical-device testing and evaluation of long-term real-world behaviour change were not performed. Worksheets and scenarios are educational adaptations, not clinical tools or validated personal-performance measures. A small personal experiment supports local choices and does not establish universal causation. A chosen review date does not schedule a notification. Private exports require the learner to retain and protect their own file.

The browser download-event wait did not report completion in the in-app browser, although the generated file appeared in the default Downloads folder and was inspected directly. The UI therefore accurately says “Export requested” rather than claiming a confirmed saved file.
