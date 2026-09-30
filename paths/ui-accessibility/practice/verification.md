# Verification record — 2026-09-30

Executed on Windows with the installed Node.js runtime:

- `node contrast.test.cjs`: passed black/white and identical pairs, symmetry, threshold examples and invalid input.
- `node semantics.test.cjs`: passed static unique-ID, reference-target, language, label/dialog/status, no-positive-tabindex, safe-text, focus and reduced-motion guardrails.

These checks do not execute a browser and do not certify WCAG conformance. Browser tasks, physical phone installation and screen-reader execution require separately recorded evidence. Use audit-checklist.md and mark unexecuted checks honestly. A 44px-high demo button is a design choice; AA target sizing has a different criterion and exceptions.
