# Interactive concept explorers

Author a `paths/<path-id>/visuals.json` object keyed by existing lesson IDs. The manifest attaches each entry as `lesson.visual`; catalog generation includes it in lesson search and printable study packs. No new route or JavaScript is needed for another explorer.

Each entry has `title`, `intro`, `scope`, optional `sources` (title/url), and `scenarios`. Give each scenario an id, label, and at least three complete `steps`. Each step has title, explanation, nodes, edges, and optional tables. Compare at least two meaningful cases rather than decorative variants.

Nodes: id, label, detail, x, y, tone (`neutral`, `active`, `success`, `warning`). Use up to six 200×90 boxes on the 1000×450 coordinate canvas; x 0–780, y 0–330. Keep labels short (25 characters) and detail below 52 characters. Edges reference node IDs with `from`, `to`, and `label`. Tables have caption, columns, and rows; every row must match the column count. State what changes in prose; never encode meaning in color alone. Explain teaching-model boundaries and cite primary sources where appropriate.

Run `node scripts/sync-catalog.cjs`, `node verify.cjs`, and `node scripts/build-pages.cjs`. The concept explorer tests check every snapshot, all interaction boundaries, print coverage and selected algorithm outcomes. They count explorers rather than expecting a total, failing only below a floor of 40, so adding an explorer needs no test edit. Inspect desktop and phone layouts; diagrams scroll locally on narrow screens, with text alternatives and semantic tables.

2026-09-27: added 27 explorers across .NET, React, DSA, SQL Server, Design Patterns, System Design and Kubernetes (54 scenarios; 164 snapshots). This supplements existing diagrams and finance stories; it does not imply every lesson requires a diagram.

Explorers support opt-in Play/Pause, 1/2/4/7-second pacing (2 seconds by default) and replay. Manual navigation or a scenario change pauses playback. Stable node identities move between positions; changed node content gets a short focus transition. Movement is explanatory snapshot playback, not a real-time simulation. Reduced-motion preferences use still snapshots. Playback pauses when the tab is hidden, stops at the final step and is cleaned up when leaving the lesson. Print packs retain every snapshot. Verify lifecycle behavior with node tests/visual-playback.cjs.
For movable values, author a stable motionKey on each node across snapshots. Sorting uses value identity so values visibly move into order. In the generic fallback, unconnected nodes with motion keys render as a horizontal sequence on desktop and an ordered vertical view on phones. Concrete sorting scenes use value bars at both widths.

## Concrete scenes

Every explorer registers a concept-specific renderer through `NotebookScenes.register(lessonId, render)` in `assets/js/scenes-{dsa,apps,infra,patterns,data,engineering}.js`. Renderers are keyed by lesson ID alone, so an explorer lesson's ID must not be used by any other explorer lesson, in any course. Load the registry before the family modules and `learning-tools.js`. New lessons without a renderer retain the generic diagram fallback.

Renderers receive the authored snapshot plus `{scenario, scenarioIndex, index, previous, key, print}`. Use `NotebookScenes.escape` for authored text. Derive displayed outcomes from that snapshot; do not display completed work during a pending step. Keep stable `data-motion-node` identities for the same logical object across snapshots, and change identity when an instance is replaced. Scope SVG IDs with `key` so printed packs do not collide.

The shared controller owns playback, manual steps, reduced-motion handling and focus restoration. An optional `data-scene-next` button advances the teaching sequence, not a live external operation. Preserve all explanations, source tables, connection descriptions and model boundaries below the scene. Wide diagrams need keyboard-accessible scroll regions and a mobile scroll cue. Print hides interactive scene actions.

Run `node tests/verify.cjs` and `node scripts/build-pages.cjs`. `tests/concrete-scenes.cjs` renders every snapshot and checks that every explorer has a renderer and every renderer an explorer, text preservation and unique print IDs. Browser-check any new scene at desktop and phone widths, including alternative scenarios and final states.

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

## Networking, Git, data engineering and messaging explorers

2026-11-01: added four explorers (8 scenarios; 28 snapshots). The DNS, rebase and inbox scenes are in `assets/js/scenes-infra.js`; the batch replay scene is in `assets/js/scenes-data.js`. Each pair contrasts a correct and an incorrect outcome:

- **Networking & the Web, "TTL and stale DNS observations":** an answer stored at t=10 with TTL 5 is returned at t=14.99 and not at t=15; a new resolution is a separate step. A connection opened at t=10 keeps sending to the old address after the cache refreshes. The rule is the lab's `now < expiry` in `paths/networking-web/practice/network_foundation.py`.
- **Git & Team Workflows, "Rebase private history":** rebasing an unpublished topic gives T1 a new parent and ID. Rebasing a topic a teammate built on leaves the same change twice after their merge; coordinating lets them replay their work onto the new commit. Commit IDs are illustrative.
- **Data Engineering, "Safe replay and batch identity":** `import_csv` commits sept-01 once, returns replay for the same bytes and rejects changed bytes. An append-only loader run twice holds 4 rows and 4,000 cents for a 2-order, 2,000-cent file. The scene counts rows and cents from the snapshot's orders table.
- **Messaging, "Durable inbox and idempotency":** with the inbox, a redelivered e-17 leaves the audit total at 7, a second consumer processes it under its own key and a changed payload is rejected. With an in-memory set, a restart forgets e-17 and the total becomes 14, as the lab's additive projection would.

`tests/concrete-scenes.cjs` checks the drawn row counts, TTL marks, commit parents and totals against the authored snapshots.

## Agents, harness, security, testing, observability and Linux explorers

2026-11-04: added six explorers to courses that had none (12 scenarios; 37 snapshots), drawn by `assets/js/scenes-engineering.js`. Each pair contrasts a correct and an incorrect outcome:

- **AI Agents, "Follow one bounded agent loop":** a script that only searches runs through `run(ScriptedSource(script), max_steps=3)` and stops as `budget_exhausted` after three proposals, with SQL-07 as its only evidence and no answer. The same script in a loop with no counter makes six calls and never reaches a terminal status.
- **Agent Harnesses, "Operation identity and uncertain effects":** the fake store commits note N1 and receipt C2, then the reply is lost. Retrying with C2 returns N1 without writing again, and reusing C2 with changed text raises `IntentConflict`. Retrying as a new call C3 writes a second note, N2.
- **Application Security, "Enforce tenant, owner and action authorization":** Alice (red) may update her document a. With the lab's check, changing the path to Bob's b or to tenant blue's c answers 404 and changes nothing. A handler that checks only the session answers 200 and overwrites both.
- **Testing & Debugging, "Diagnose flakiness before rerunning":** a 30-second token issued at 1000 s is checked after real work. The check lands at 1012, 1031 and 1015 s on different runs, so the test passes, fails and passes. With an injected `FakeClock`, `advance(29)` is valid and one more second reaches the exclusive expiry at 1030 s on every run.
- **Observability & Performance, "Percentiles and the slow tail":** twenty requests per release. Release A has a mean of 42 ms and a nearest-rank p95 of 60 ms; release B has a mean of 33 ms and a p95 of 150 ms. Judged by the mean alone, B looks 9 ms faster.
- **Linux & Operating Systems, "Users, groups and permission bits":** bo, in group analysts, can traverse `/srv/reports` at mode 750 and read `q3.csv` at 640, but not write it. At directory mode 700 the open fails at the directory, and changing the file to 666 does not help.

The renderers compute each outcome from the snapshot's tables: the proposal count against the budget, notes per intent, the handler's tenant and owner checks, the token's expiry, the mean and nearest-rank p95, and the permission class and bits. `tests/concrete-scenes.cjs` checks that what is drawn matches the authored text. `tests/explorer_lab_facts.py` replays the agent, harness, security and observability figures against `workshop.py`, `harness_workshop.py`, `security_lab.py` and `telemetry.py`. The testing and Linux kits have no clock or permission code, so those two scenes apply the lessons' rules: valid while `now < issued + ttl`, and a directory needs x to traverse.
