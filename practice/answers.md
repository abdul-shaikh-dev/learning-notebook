# Practice population: answer key

All positions, thresholds and approvals are synthetic. USD throughout. Compare clean prices on an aligned basis. Signed difference = independent value − FO value. The learning threshold is breached only when absolute difference is strictly greater than the threshold. This is a triage rule, not booking authority.

| Trade | FO clean/supplied value | Independent clean/supplied value | Signed difference | Amount trigger | Evidence conclusion |
|---|---:|---:|---:|---|---|
| BOND-001 | 19,960,000 | 19,930,000 | −30,000 | Yes | Current source; investigate and use scenario's approved correction |
| BOND-002 | 4,900,000 | 4,875,000 | −25,000 | No: exactly at threshold | Unverified: stale, regardless of amount |
| BOND-003 | −10,100,000 | −10,080,000 | +20,000 | Yes | Current source; positive signed difference for short |
| BOND-004 | 2,850,000 | Missing | Missing | Cannot determine | Missing evidence; retain position and route gap |
| SWAP-001 | 450,000 | 426,000 | −24,000 | Yes | Supplied input-repriced values; inspect aligned curves and configuration |
| OPTION-001 | 2,000,000 | 1,970,000 | −30,000 | Yes | Supplied model estimate; not proof of observable evidence or automatic booking |

## Case bridge for BOND-001

1. FO clean value = 20m × 99.80 / 100 = 19.96m.
2. Independent clean value = 20m × 99.65 / 100 = 19.93m.
3. Supplied approved correction = −30k.
4. Separate approved bid-offer deduction = 10k. Accounting clean FV = 19.92m.
5. Fixed accrued interest = 40k. Accounting dirty FV = 19.96m.
6. Scenario evidence supports Level 2: no qualifying Level 1 quote; all significant inputs observable.
7. Supplied gross close-out requirement 16k less eligible same-source booked 10k gives 6k before aggregation.
8. Supplied residual MPU requirement 8k with zero eligible same-source offset gives 8k before aggregation.
9. Diagnostic pre-aggregation sum = 14k. Final regulatory AVA is NOT calculated by this exercise.

The price correction aligns the central mark; it is not assumed to address the separately supplied residual MPU uncertainty. An accounting adjustment can only offset an AVA assessment when it addresses the same uncertainty at the appropriate level.

## Investigations to practise

- Leave BOND-004 in the population with missing fields. Compare how a left join and an inner join against prices affect coverage.
- Duplicate a source row and check whether a naive join doubles face amount and value.
- Change one quote from clean to dirty and observe the false discrepancy if conventions are not aligned.
- Keep source quality and amount-trigger status in separate columns.
- Avoid netting favourable and adverse differences before investigation; totals can hide offsetting exceptions.
- Compare the option's Level 3 classification with its numerical difference. A smaller difference would not automatically change the level.

## Data dictionary

- `SignedFaceOrNotional`: bond signed face amount; derivative notional is context, not market value.
- `FOCleanPrice`, `IndependentCleanPrice`: per-100 bond clean mid quotes. Empty means missing or not applicable, never zero by default.
- `FOValue`, `IndependentValue`: directly supplied derivative values for comparison.
- `SignedAccruedInterest`: position-level currency amount; unchanged in these exercises.
- `SourceQuality`: separate evidence assessment; a fresh model estimate is not automatically observable market evidence.
- `LearningTolerance`: synthetic amount threshold; not a regulatory rule.
- `IllustrativeFVLevel`: supplied classification except BOND-004, where evidence is intentionally insufficient.
- `SignificantUnobservableInput`: supplied teaching judgement, not an automatically calculated production significance test.
