# From a value to a state transition

Use the existing pinned practice project: `npm ci`, then `npm test -- foundation-data.test.ts` and `npm run build`.

Work through `values`, `functions`, `typescript` and `state` in that order. The focused files do not render React: they isolate the input and state decisions that components depend on.

Four tests cover zero versus missing input, rejecting numeric strings and extra fields, preserving frozen inputs, and repeated completion. A passing test command proves runtime examples; the build separately checks TypeScript contracts.

Independent change: add `{type:'set-minutes', id:string, minutes:number}`. Accept 0..1440 integer minutes; reject NaN, fractional, negative and oversized values before changing any row. Unknown IDs preserve contents. Add tests for 0, 1440, 1441 and a frozen input. The exhaustive switch should fail to compile until the new action has a branch. No server validation, persistence or concurrent edits are implemented here.
