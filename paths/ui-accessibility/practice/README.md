# UI Design & Accessibility practice

Files are flat after extraction. Requirements: Node.js for checks; Python 3 for optional local hosting; a current browser. No npm packages or credentials are needed.

```
node contrast.test.cjs
node semantics.test.cjs
node contrast.cjs 777777 ffffff
python -m http.server 8890 --bind 127.0.0.1
```

Open http://127.0.0.1:8890/demo.html. Stop the server with Ctrl+C. The demo uses in-memory records; reload clears them. Inputs become text nodes, not HTML.

Foundation: calculate actual solid-colour ratios, explain thresholds and compare two proposed palettes. Intermediate: run the form/dialog/zoom checklist and extend the dashboard while preserving task and focus behaviour. Advanced: add a non-drag reorder interaction, create a release evidence matrix and test with assistive technology.

Baseline checks cover arithmetic, IDs/associations and explicit semantic guardrails. They do not execute a browser, certify WCAG conformance, prove screen-reader behaviour or replace disabled-user evaluation. Manual browser, physical-device and assistive-technology checks must be recorded separately.

Source guidance: WCAG 2.2 Quick Reference and WAI Forms, Images, Tables, Evaluation and APG Dialog tutorials are linked beside the corresponding lessons. Reviewed 2026-09-30; future browser and guideline changes require renewed review.
