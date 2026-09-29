# Mermaid relationship diagrams

The 120 `lesson.diagram` definitions render through Mermaid Tiny 12.0.0. Nodes, connections, text alternatives and step explanations share one definition; authors do not maintain a second graph. Extend `diagram` using the existing nodes/edges/steps schema. Animated `lesson.visual` explorers remain separate.

`assets/js/notebook-mermaid.js` creates a top-to-bottom flowchart with safe generated node IDs, encoded labels, accessible title/description, strict security and SVG text labels. Node highlighting follows the lesson controls. The Mermaid runtime loads only when a diagram is present. Files are local, so saved folders work without a CDN. Rendering failure retains the complete text explanation. Study packs include diagrams and expanded text.

Downloads provide editable `.mmd` source and standalone `.svg` images. Diagram containers support keyboard scrolling on small screens. The diagrams are static and do not introduce additional motion.

Vendor provenance: official npm `@mermaid-js/tiny@12.0.0`, `dist/mermaid.tiny.js`, MIT license in `assets/vendor/mermaid-LICENSE.txt`. Documentation: https://mermaid.js.org/config/usage.html and https://mermaid.js.org/config/accessibility.html.

Validation: `node tests/mermaid-diagrams.cjs`, `node verify.cjs`, and `node scripts/build-pages.cjs`. Inspect the affected rendered diagrams when changing the renderer or dependency, including lesson-step highlights, mobile layout, and study packs.

Finance uses nine additional static maps in content/diagrams.js with the same source/SVG renderer and complete text alternatives. See [the full audit](visual-flow-audit-2026-09-30.md) for coverage and retained-text decisions. Explicit diagram.textExampleSections indices move only authored conceptual flow examples into disclosures; do not mark mixed executable specimens.
