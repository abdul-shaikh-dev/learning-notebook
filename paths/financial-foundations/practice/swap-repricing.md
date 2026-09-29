# From a fixed cash flow to a floating-leg swap

Optional extension after the curve investigation. Paper or spreadsheet first; Python 3.11+ is optional. Everything is synthetic. This example teaches input attribution, not a production pricing model or an instruction to post a correction.

See the [visual map of forecast and discount dependencies](https://abdul-shaikh-dev.github.io/learning-notebook/course.html#lesson/3) in the notebook. The text flow below remains a portable reference for readers without diagram rendering.

## Contract before calculation

Our bank receives floating interest and pays 4% fixed on EUR 1,000,000. Two future payments each use a supplied half-year accrual fraction of 0.5. Both rates are still unfixed in the first scenario. The principal is **not exchanged**. There is no spread, fee, collateral cash flow or accrued-interest adjustment in this deliberately simplified contract.

For each payment: floating cash = notional × accrual × projected rate; fixed cash = notional × accrual × fixed rate. Signed net cash is floating minus fixed. Discount each signed net payment and sum. Rates use decimals: 3% is 0.03.

```text
contract + forecast input → projected interest → signed net payment
                                                    × discount factor
                                                    ↓
                                               present value
```

| Payment | Accrual | FO forward | Independent forward | FO factor | Independent factor |
|---|---:|---:|---:|---:|---:|
| 1 | 0.5 | 3.0% | 3.1% | 0.980 | 0.979 |
| 2 | 0.5 | 5.0% | 4.8% | 0.960 | 0.958 |

These projections and factors are supplied independently for teaching. No single-curve identity, market calibration or schedule convention is assumed.

## Try before reading the solution

1. Calculate both fixed payments and FO floating payments. Why is notional not the value?
2. Find FO and independent net present value from the bank's perspective.
3. Change only forecasts, then only factors. Reconcile the two effects to the total difference.
4. Reverse the change order. Does the total change? Do individual components change?
5. Suppose payment 1's rate is already fixed at 3.0%. Which input is no longer eligible to change?

## Worked trace

Each fixed payment is 1,000,000 × 0.5 × 0.04 = EUR 20,000. FO floating payments are 15,000 and 25,000. Net payments −5,000 and +5,000 discount to −4,900 and +4,800: **FO value −100**. The negative value is a liability from this bank's perspective in the simplified measurement; it is not a EUR 1m liability just because that is the notional.

Independent floating payments are 15,500 and 24,000. Net payments −4,500 and +4,000 discount to −4,405.50 and +3,832: **independent value −573.50**. Independent minus FO is **−473.50**.

| Step | Value EUR | Movement EUR |
|---|---:|---:|
| FO forecasts and factors | −100.00 | — |
| Independent forecasts, FO factors | −570.00 | −470.00 forecast effect |
| Independent forecasts and factors | −573.50 | −3.50 discount effect |

Reverse order: changing factors first gives −105 (effect −5); changing forecasts next gives −573.50 (effect −468.50). The total remains −473.50. The attribution convention changes where the cross effect appears. Record the order rather than presenting either component as uniquely determined.

If payment 1 already fixed at 3.0%, use that fixing under both scenarios: its cash stays −5,000 regardless of a new projected rate. Independent total becomes −5,000×0.979 +4,000×0.958 = **−1,063**; difference from FO is **−963**. A fixing and a forecast must be separate fields with dates and provenance.

## Common wrong answers

- EUR 1m as value: notional scales interest but is not exchanged in this contract.
- −21.50 copied from the earlier bond case: those were different fixed cash flows; a floating leg changes projected payments too.
- Changing a historical fixing with a new forward: once fixed, this coupon uses the fixing under the stated contract.
- Calling −473.50 daily P&L: these are competing marks at the same time, not a two-date cash-adjusted P&L series.
- Automatically posting the difference: first align contracts, conventions, source time, curve basis and approved evidence.

## Run and change an input

```text
python swap_repricing.py
python -m unittest -v test_swap_repricing.py
```

Expect FO −100, independent −573.50 and total difference −473.50 EUR; five tests cover values, signs, fixings, attribution order and rejected inputs. Before reversing direction, predict +100 and +573.50. Add a test for identical input sets producing zero difference.

Completion: show the two payment rows, the reconciled bridge, fixing variant and one evidence question. A real implementation also needs schedules, business-day/day-count rules, index resets, curve construction, collateral basis, settled payments and applicable adjustments; these are not demonstrated here.

Primary background: [QuantLib rate-curve teaching slides](https://www.quantlib.org/slides/rate-curves.pdf). This workbook's numbers, simplifications and attribution order are original teaching assumptions.
