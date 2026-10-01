# Optional changed-case valuation exercise

Use the same supplied synthetic swap as swap-repricing.md. Keep the contract
visible while changing inputs. These are arithmetic exercises, not market
calibration or instructions to adjust a book.

## Begin with a prediction

The bank receives floating and pays fixed. With notional 1,000,000 and two
half-year periods, each fixed payment is 20,000. FO floating forecasts are 3%
and 5%, so net payments are -5,000 and +5,000. Discount factors .98 and .96
produce -4,900 + 4,800 = -100.

Without running code, increase only the second forward by 10 basis points.
The change is .001 in decimal rate, so the cash change is 1,000,000 × .5 × .001
= 500 and the present-value change is 500 × .96 = 480. The new value is 380.
This is exactly linear in that supplied forward under the fixed contract and
discount factors. It is not a universal sensitivity to a market curve quote.

Run `python -m unittest -v test_valuation_transfer.py` beside swap_repricing.py.
Then implement the calculations independently before comparing value().

## Change what is known

Now the second rate has already fixed at 5%. Bumping its forecast must have no
effect: the known fixing supplies the cash flow. If the program still changes
value, it has used the wrong input. Reverse receive/pay direction: both value
and the forward-bump effect reverse signs. Neither change alters the notional.

Finally increase only the first discount factor by .001. The first signed cash
flow is negative, so value falls by 5. A larger factor does not always increase
the value of a signed portfolio. Compute the effect payment by payment before
trying to explain the total.

## Transfer to an unfamiliar break

A colleague reports a difference of 48,000 for the 10 bp second-forward bump.
Inspect the unit conversion first: .10 means ten percentage points, not ten
basis points. Another colleague reports 480 after the fixing is known: that
calculation ignores the fixing. Both numbers can be produced by runnable code;
neither matches the stated input contract.

Try a negative first forecast, then a discount factor greater than one. The
reference accepts finite rates and positive factors, including these cases.
Explain the signed cash changes; do not add arbitrary positivity restrictions
merely because the original fixture had positive rates.

## What this path now establishes

You can calculate and investigate a supplied cash-flow bridge, test direction,
units and fixing precedence, and distinguish a matched total from matched
inputs. Schedule generation, day-count conventions, curve construction,
optional products and desk-specific valuation policy require separate study.
Use the existing daily-P&L workbook next to connect position events to value.
