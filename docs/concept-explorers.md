# Interactive concept explorers

Author a `paths/<path-id>/visuals.json` object keyed by existing lesson IDs. The manifest attaches each entry as `lesson.visual`; catalog generation includes it in lesson search and printable study packs. No new route or JavaScript is needed for another explorer.

Each entry has `title`, `intro`, `scope`, optional `sources` (title/url), and `scenarios`. Give each scenario an id, label, and at least three complete `steps`. Each step has title, explanation, nodes, edges, and optional tables. Compare at least two meaningful cases rather than decorative variants.

Nodes: id, label, detail, x, y, tone (`neutral`, `active`, `success`, `warning`). Use up to six 200×90 boxes on the 1000×450 coordinate canvas; x 0–780, y 0–330. Keep labels short (25 characters) and detail below 52 characters. Edges reference node IDs with `from`, `to`, and `label`. Tables have caption, columns, and rows; every row must match the column count. State what changes in prose; never encode meaning in color alone. Explain teaching-model boundaries and cite primary sources where appropriate.

Run `node scripts/sync-catalog.cjs`, `node verify.cjs`, and `node scripts/build-pages.cjs`. The concept explorer tests check every snapshot, all interaction boundaries, print coverage and selected algorithm outcomes. The current 27-explorer coverage assertion should be updated intentionally when adding more lessons. Inspect desktop and phone layouts; diagrams scroll locally on narrow screens, with text alternatives and semantic tables.

2026-09-27: added 27 explorers across .NET, React, DSA, SQL Server, Design Patterns, System Design and Kubernetes (54 scenarios; 164 snapshots). This supplements existing diagrams and finance stories; it does not imply every lesson requires a diagram.

Explorers support opt-in Play/Pause, 4/7/10-second pacing and replay. Manual navigation or a scenario change pauses playback. Stable node identities move between positions; changed node content gets a short focus transition. Movement is explanatory snapshot playback, not a real-time simulation. Reduced-motion preferences use still snapshots. Playback pauses when the tab is hidden, stops at the final step and is cleaned up when leaving the lesson. Print packs retain every snapshot. Verify lifecycle behavior with node tests/visual-playback.cjs.
For movable values, author a stable motionKey on each node across snapshots. Sorting uses value identity so values visibly move into order. Unconnected nodes with motion keys render as a horizontal sequence on desktop; phones retain the ordered vertical view.
