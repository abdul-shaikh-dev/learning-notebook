# Review response and verification — 26 September 2026

This is a new record. The original financial content review is retained unchanged.

| Finding | Resolution |
|---|---|
| Day-one perspective | Corrected bank purchase example; paired liability explanation; replaced checkpoint with recognition/deferral question. |
| Beginner ramp | Six optional foundation explainers with cash-flow, payoff, sensitivity, netting, capital and percentile examples. Contextual links from relevant lessons. |
| Aggregation notation | Defined FV/PV/EV/APVA and alpha, worked both methods, same-source adjustment sequence and category totals. |
| Core fallback | Added Article7 decision branch, verified formula and separate derivative/non-derivative worked examples. |
| Incomplete handbook | Full study pack now consumes shared content: lessons, foundations, seven worksheets, complete case, six practice records/dictionary, exercises, sources and separate answer appendix. |
| Shallow checkpoints | 20 applied module tasks and6 delayed mixed tasks with wrong-turn reasoning and rubrics; numeric feedback; reading/practising/self-check tracking separated. |
| Reporting coverage | Added Level3 roll-forward and example disclosure record, sensitivity conditions and paragraph references. |
| Boundary conditions | Principal/most-advantageous market example; strict EU threshold, exactly matching exclusion and breach timeline. |
| Source maintenance | Section-level references plus source register, checked dates, access limitations and review triggers; stable IFRS entry point and identified AASB companion. |

## Extensibility

Finance content/runtime/practice now lives under paths/financial-foundations. Each path has a path.json manifest; catalog generation and the public-file build read those manifests. A new-path scaffold creates draft standard-reader courses. Draft teaching payloads are excluded from the generated catalog. Root course/handbook and original practice URLs remain compatible, as does the original financial progress key and backup schema. Historical snapshots were not edited.

## Verification

- Existing financial arithmetic and content checks passed.
- New coverage checks validate all5 module sets,26 tasks, numeric answers,6 foundation sections,7 worksheets,6 case stages and6 CSV records in the printable pack.
- Independent content review checked new worked financial examples; clarified retained quantile precision for the uncertainty worksheet.
- Generic course fixtures verify rendering, escaping, progress, and missing routes. Scaffold tests verify draft exclusion, ready publication, and duplicate/unsafe ID rejection.
- Legacy progress and new practice flags survive validation/import. Browser completion and self-check state persisted after reload.
- Built output tested under a path prefix: old root lesson URL redirects, corrected day-one quiz, new technical sections, lab output and study-pack coverage worked.
- Browser checked at390px phone and1280px desktop viewports. No horizontal phone overflow on the foundations or study pack; no observed console errors. Desktop progress/backup controls visible.
- The study pack contains approximately21,600 words of rendered text including exercises, answers and references. Print styles are supplied; a separately exported PDF was not generated or page-by-page reviewed in this revision.

Regulatory examples remain dated learning references. Source-access restrictions and the unresolved operational-risk cross-reference are documented, not silently treated as resolved current law.
