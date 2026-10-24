# Interactive concept explorers

Author a `paths/<path-id>/visuals.json` object keyed by existing lesson IDs. The manifest attaches each entry as `lesson.visual`; catalog generation includes it in lesson search and printable study packs. No new route or JavaScript is needed for another explorer.

Each entry has `title`, `intro`, `scope`, optional `sources` (title/url), and `scenarios`. Give each scenario an id, label, and at least three complete `steps`. Each step has title, explanation, nodes, edges, and optional tables. Compare at least two meaningful cases rather than decorative variants.

Nodes: id, label, detail, x, y, tone (`neutral`, `active`, `success`, `warning`). Use up to six 200×90 boxes on the 1000×450 coordinate canvas; x 0–780, y 0–330. Keep labels short (25 characters) and detail below 52 characters. Edges reference node IDs with `from`, `to`, and `label`. Tables have caption, columns, and rows; every row must match the column count. State what changes in prose; never encode meaning in color alone. Explain teaching-model boundaries and cite primary sources where appropriate.

Run `node scripts/sync-catalog.cjs`, `node verify.cjs`, and `node scripts/build-pages.cjs`. The concept explorer tests check every snapshot, all interaction boundaries, print coverage and selected algorithm outcomes. The current 30-explorer coverage assertion should be updated intentionally when adding more lessons. Inspect desktop and phone layouts; diagrams scroll locally on narrow screens, with text alternatives and semantic tables.

2026-09-27: added 27 explorers across .NET, React, DSA, SQL Server, Design Patterns, System Design and Kubernetes (54 scenarios; 164 snapshots). This supplements existing diagrams and finance stories; it does not imply every lesson requires a diagram.

Explorers support opt-in Play/Pause, 1/2/4/7-second pacing (2 seconds by default) and replay. Manual navigation or a scenario change pauses playback. Stable node identities move between positions; changed node content gets a short focus transition. Movement is explanatory snapshot playback, not a real-time simulation. Reduced-motion preferences use still snapshots. Playback pauses when the tab is hidden, stops at the final step and is cleaned up when leaving the lesson. Print packs retain every snapshot. Verify lifecycle behavior with node tests/visual-playback.cjs.
For movable values, author a stable motionKey on each node across snapshots. Sorting uses value identity so values visibly move into order. In the generic fallback, unconnected nodes with motion keys render as a horizontal sequence on desktop and an ordered vertical view on phones. Concrete sorting scenes use value bars at both widths.

## Concrete scenes

All 30 current explorers register a concept-specific renderer through `NotebookScenes.register(lessonId, render)` in `assets/js/scenes-{dsa,apps,infra,patterns,data}.js`. Load the registry before the family modules and `learning-tools.js`. New lessons without a renderer retain the generic diagram fallback.

Renderers receive the authored snapshot plus `{scenario, scenarioIndex, index, previous, key, print}`. Use `NotebookScenes.escape` for authored text. Derive displayed outcomes from that snapshot; do not display completed work during a pending step. Keep stable `data-motion-node` identities for the same logical object across snapshots, and change identity when an instance is replaced. Scope SVG IDs with `key` so printed packs do not collide.

The shared controller owns playback, manual steps, reduced-motion handling and focus restoration. An optional `data-scene-next` button advances the teaching sequence, not a live external operation. Preserve all explanations, source tables, connection descriptions and model boundaries below the scene. Wide diagrams need keyboard-accessible scroll regions and a mobile scroll cue. Print hides interactive scene actions.

Run `node tests/verify.cjs` and `node scripts/build-pages.cjs`. `tests/concrete-scenes.cjs` renders all 184 snapshots and checks scene coverage, text preservation and unique print IDs. Browser-check any new scene at desktop and phone widths, including alternative scenarios and final states.

## Step focus

Every step after a scenario's first names what it is about with `focus`: a list of the motion keys drawn for that step, whole or without the renderer prefix (`pod-b` for `data-motion-node="infra-pod-b"`, `join-104`). Use the whole key where the prefix carries meaning, such as `emitted-B` beside the tree node `recursion-B`. Each key must name exactly one drawn element. The reader labels exactly those elements, "New" when the key was not drawn in the previous step and "Changed" otherwise, with an outline. The label is static text: it appears with reduced motion, in dark mode and in printed packs. Motion, when allowed, fades in only focused elements.

Choose the change the explanation is about, not every element whose wording differs; most snapshots reword unchanged objects. Mark consequences only when the step teaches them, and leave unchanged state unmarked when its stability is the lesson. Use `"focus": []` when a step changes only commentary. When a step directs attention without a state change, add a short `focusLabel` such as "Check" or "Compare" (12 characters at most).

`tests/explorer-focus.cjs` renders each focused step, rejects keys that are not drawn or are ambiguous, keeps scenario openings unmarked and requires focus on every later step of every explorer. When a meaningful change has no motion key of its own, use `[]` or mark the nearest drawn element honestly rather than a neighbour; giving it a key is a renderer change. The generic diagram fallback keeps its earlier change cue for steps without focus.

2026-10-22: authored focus for all 27 explorers (110 transitions). Six use `[]`: two commentary-only plan steps, two strategy steps before any result is drawn, and two decorator returns whose change appears in text without a motion key.

## Data explorers

2026-10-24: added three explorers to the maths, data analysis and machine learning courses (6 scenarios; 20 snapshots), drawn by `assets/js/scenes-data.js`. Each scenario pair contrasts a correct and an incorrect outcome:

- **Practical Maths & Statistics, "Compare centre and distribution":** a 100 ms request moves the mean from 10 to 28 ms while the median stays 10 ms. A missing duration entered as 0 drops the mean to 8 ms; keeping it missing and reporting it leaves both at 10 ms.
- **Data Analysis, "Summarize groups with counts":** ten tickets split by team (A: 1 breach in 2, B: 1 in 8). The ticket-weighted rate is 2 / 10 = 20%; averaging the team rates gives 31.25%.
- **Machine Learning, "Choose a threshold with explicit costs":** validation costs (4 × FN + FP) of 5, 4 and 1 at thresholds 0.5, 0.7 and 0.3 choose 0.3. The frozen rule costs 5 on the test; lowering it to 0.2 after seeing the test reports 1, but the test has then chosen the rule.

These renderers read their data from each snapshot's tables (observations, ticket scores and the rule), compute the summaries themselves and draw them; `tests/concrete-scenes.cjs` checks that the drawn figures match the authored text. The groupby scene's ten tickets are fixed in the renderer, and its per-team summary table is checked against them. All figures come from the lessons' worked examples and the lab's `score >= threshold` rule in `paths/machine-learning-foundations/practice/metrics_lab.py`; the code-based ones (mean, median, rates, confusion counts) were also checked with Python's `statistics` module.
