# UI Design & Accessibility practice

The extracted files are in one folder. Use Node.js for checks, Python 3 for optional local hosting, and a current browser. No npm packages or credentials are needed.

```
node contrast.test.cjs
node semantics.test.cjs
node contrast.cjs 777777 ffffff
python -m http.server 8890 --bind 127.0.0.1
```

Open http://127.0.0.1:8890/demo.html. Stop the server with Ctrl+C. The demo uses in-memory records; reload clears them. Inputs become text nodes, not HTML.

Foundation: calculate actual solid-colour ratios, explain thresholds and compare two proposed palettes. Intermediate: run the form/dialog/zoom checklist and extend the dashboard while preserving task and focus behaviour. Advanced: add a non-drag reorder interaction, create a release evidence matrix and test with assistive technology.

The baseline checks cover contrast arithmetic, unique IDs, element associations and selected HTML rules. They do not execute a browser, certify WCAG conformance, prove screen-reader behaviour or replace disabled-user evaluation. Manual browser, physical-device and assistive-technology checks must be recorded separately.

Source guidance: WCAG 2.2 Quick Reference and WAI Forms, Images, Tables, Evaluation and APG Dialog tutorials are linked beside the corresponding lessons. Reviewed 2026-09-30; future browser and guideline changes require renewed review.

## Optional connected case

These lessons follow one evolving situation. Read the worked case first; try a changed case aloud or in your own tools when useful. No extra worksheet or written submission is required. These fictional cases provide reasoning practice, not a validated assessment.

- **5. Keyboard navigation and visible focus** (`keyboard-focus`): Debug the existing dashboard by following focus.
- **9. Form labels, instructions and recovery** (`forms-validation`): Clear errors when the state changes.
- **11. Dialogs and focus ownership** (`dialog-pattern`): Track focus ownership as triggers change.

Use existing `demo.html` and `demo.js`. Copy the folder before fault injection. Repair the copy and repeat the changed interaction, including empty and removed-control states. Static checks do not establish keyboard or assistive-technology behavior; record browser observations separately. No new dependencies or API are introduced.
