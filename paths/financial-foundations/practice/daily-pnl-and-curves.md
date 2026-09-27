# Two practical finance investigations

All data is synthetic. Work the arithmetic in a spreadsheet or on paper before running the reference. The CSVs and Python files are together at the root of the finance practice ZIP. Python 3.11+ is optional; no packages, market feeds or account access are needed.

Run `python finance_workbook.py` for calculations and `python -m unittest -v test_finance_workbook.py` for five checks. The code uses decimal arithmetic. It is a small fixture, not an arbitrary-file parser or production reporting engine.

## 1. Reconcile two dates, not just two marks

Open `two-date-events.csv`. All prices and deductions are EUR; EURUSD means USD for one EUR. Opening: 100 shares, cost EUR 90 each, market price EUR 100, deduction EUR 20, FX 1.10. During the period: buy 20 at 102; sell 30 at 105; receive dividend EUR 50 on the opening holding. Closing: 90 shares at 104, deduction 35, FX 1.12. All events are settled; all cash flows translate at the supplied event rate. No tax, fees, financing, unsettled balances or other events. Cash balances themselves are outside the valued position; the cash-flow return includes their signed movement once.

Before looking below:

1. Reconcile opening quantity plus trades to closing quantity.
2. Calculate raw and adjusted opening/closing values, cash movement and EUR period return.
3. Convert opening/closing values and each cash flow at their stated rates. Derive USD period return.
4. Explain the difference using local return translated at closing FX, FX on the opening carrying amount, and any cash-rate difference. Do not force an unexplained residual to zero.
5. Derive realised/unrealised amounts under FIFO. Compare a weighted-average cost after the buy. What changes and what remains equal?

### Worked answer

Quantity: 100+20−30=90. Cash:−2, 040+3, 150+50=1, 160 EUR. Raw values: 10, 000→9, 360. Adjusted carrying values: 9, 980→9, 325. Raw period return: 9, 360−10, 000+1, 160=520 EUR. The deduction increases by 15, reducing the period result to 505 EUR.

An independent driver bridge gives 400 (100 opening shares ×4 price move)+40 (20 new shares ×2 gain)+30 (30 sold ×1 above the closing mark)+50 dividend−15 adjustment=505 EUR. This ordering is a chosen explanatory convention, not a universal desk attribution standard.

USD closing carrying amount=9, 325×1.12=10, 444. Opening=9, 980×1.10=10, 978. Cash=1, 160×1.12=1, 299.20. Period return=10, 444−10, 978+1, 299.20=765.20 USD.

Bridge: 505×1.12=565.60 local return; 9, 980×(1.12−1.10)=199.60 opening FX effect; cash-rate difference=0. Sum 765.20, residual 0. If the dividend is translated at 1.11 instead, the cash-rate difference is−0.50 and total 764.70. The script tests this variation.

FIFO: realised 30×(105−90)=450; remaining cost 70×90+20×102=8, 340; closing unrealised 9, 360−8, 340=1, 020. Opening unrealised was 1, 000. Period raw return 450+(1, 020−1, 000)+50=520. Weighted-average cost after purchase is 92: realised 390; closing unrealised 1, 080; 390+(1, 080−1, 000)+50=520. Allocation changes; total does not. These are simple cost allocations, not a recommendation of an accounting or tax policy. The period's financial-statement presentation depends on classification and applicable rules.

### A position event that is not a trade

A two-for-one split after closing changes 90 shares at 104 into 180 shares at 52. Total value remains 9, 360. Cost per share halves, total cost stays fixed and the split alone produces no return in this synthetic example. A cancellation must reverse the original event using its identity; adding a second corrected booking without cancelling the first duplicates the holding.

Trade-date and settled quantities can differ: if the 20-share purchase had not settled, a trade-date view may show 90 shares while settled quantity is 70, with a corresponding unsettled obligation. That is a different reporting basis; do not plug 70 into the settled-case cash equation and call the difference a loss.

## 2. Derive an independent value from inputs

Open `curve-inputs.csv`: a one-year 50 EUR cash flow and a two-year 1, 050 EUR cash flow. Cash flows and timing are identical in both valuations. FO discount factors are 0.95/0.90; independent factors 0.94/0.88. These are supplied factors, not calibrated from live instruments.

Calculate each cash flow's present value under each curve. Explain the signed independent-minus-FO difference by tenor. Before approving a correction, list the evidence you still need: comparable valuation date, currency, collateral/discounting basis, contractual cash-flow conventions and independent-source suitability. Arithmetic alone does not select the correct curve.

### Worked answer

FO=50×0.95+1, 050×0.90=992.50. Independent=50×0.94+1, 050×0.88=971.00. Difference−21.50 EUR:−0.50 from year one and−21 from year two. Reversing all cash-flow signs reverses the value difference. This is a fixed-payment teaching instrument, not a full swap model with floating forecasts.

In a SEPARATE flat annual-rate scenario, discount the same cash flows at 5% and 6%. Values are 1, 000 and 981.666073; exact change−18.333927. The derivative at 5% is−50/1.05²−2×1, 050/1.05³. Multiply by 0.01 for the 100 bp rate move:−18.594104. The approximation residual is+0.260178. The discount-factor bridge was exactly linear in supplied factors; a rate-to-discount-factor transformation is nonlinear. Never apply an unstated sensitivity unit or sign.

## What to submit

A workbook with input rows, independent calculations, signed bridge, residual and written evidence conclusion. Change one event FX rate and one curve factor; predict the effect before recalculation. Explain two ways a mathematically reconciled output can still use invalid evidence.

## References and scope

- [IFRS-aligned AASB13, December2022](https://standards.aasb.gov.au/aasb-13-dec-2022): paragraphs24–26,61–67 and AppendixB present-value techniques. Dated measurement context; Australian-specific provisions are excluded from general IFRS claims.
- [Basel CAP50](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15):50.6–50.8, model controls and independent input verification. These are referenced framework provisions, not a certification of every current local implementation.
- Arithmetic, attribution convention and cost-allocation comparisons above are explicitly defined synthetic teaching examples. Reviewed 27 September 2026; executable checks verify their identities, not legal classification or market calibration.
