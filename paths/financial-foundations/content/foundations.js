const FOUNDATIONS = [
  {
    "id": "cash-flows",
    "title": "A bond is a timeline of payments",
    "lessons": [
      1,
      3
    ],
    "paragraphs": [
      "A cash flow is money paid or received at a particular time. A plain two-year bond with face value $1,000 and a 5% annual coupon promises $50 after year one and $1,050 after year two: the last coupon plus repayment. These are contractual promises, not guaranteed receipts if the issuer defaults.",
      "Present value asks how much those future payments are worth today. In this simplified example, discount each payment at the same annual rate, then add the results. A market price can also reflect credit, liquidity and other effects; the flat-rate example isolates timing.",
      "With the promised payments fixed, a higher discount rate makes each present value smaller. That is the basic reason an ordinary fixed-rate bond price tends to fall when required yields rise. It is not a universal direction rule for every security."
    ],
    "example": "Time:       Today          Year 1         Year 2\nCash flow:  Buy the bond    Receive $50    Receive $1,050\nAt 5%: 50 / 1.05 + 1,050 / 1.05² = $1,000.00\nAt 6%: 50 / 1.06 + 1,050 / 1.06² = $981.67\nAt 0%: 50 + 1,050 = $1,100.00",
    "check": "Why is the final cash flow $1,050 rather than $1,000?",
    "answer": "It contains both the final $50 coupon and the $1,000 principal repayment. Counting only principal omits a payment."
  },
  {
    "id": "swaps-options",
    "title": "Swaps and options: payment is not value",
    "lessons": [
      1,
      3,
      7
    ],
    "paragraphs": [
      "A fixed-for-floating interest-rate swap exchanges interest amounts. Assume a bank pays 4% fixed and receives a floating rate on $1m for a half-year period with accrual fraction 0.5. If the floating rate for that payment is 5%, it receives $25,000 and pays $20,000. If payment netting applies, the net receipt is $5,000. The $1m notional is only the reference amount in this example.",
      "That one payment is not the entire swap value. Before settlement, value depends on all remaining expected net payments, their dates and discounting. A future floating payment may be unknown today, so a forecast curve is needed. A discount curve supplies discount factors. Different maturities can have different rates.",
      "A call option gives its holder the right to buy an underlying asset at a strike price. With strike $100, its expiry payoff per share is max(share price − 100, 0). At expiry prices $90, $100 and $120, payoffs are $0, $0 and $20. If the premium paid was $7, simple profit at expiry before financing/fees is −$7, −$7 and +$13.",
      "Before expiry, an option price is not simply its payoff at today’s share price. Remaining time and possible outcomes matter. Volatility describes dispersion; implied volatility is the model input consistent with an observed option price. A surface supplies inputs at different strikes and maturities. These examples introduce meaning, not a full option-pricing model."
    ],
    "example": "Swap period: $1m × (5% − 4%) × 0.5 = +$5,000 to the bank\nCall expiry payoff at share price $120: max(120 − 100, 0) = $20\nCall simple profit after $7 premium: $20 − $7 = $13",
    "check": "Can the swap’s $1m notional or its next $5,000 payment be used as its total fair value?",
    "answer": "No. The notional sizes payments; the next payment is only one cash flow. Value considers the remaining contract and current inputs."
  },
  {
    "id": "sensitivities",
    "title": "Translate an input move into money",
    "lessons": [
      3,
      9
    ],
    "paragraphs": [
      "A sensitivity answers a local “what if” question. Here +$12,000 per basis point means that increasing the specified rate input by 1bp increases value by approximately $12,000. A move of −2bp therefore suggests −$24,000. Other systems use different signs or bump definitions.",
      "Vega measures response to a volatility change. If vega is $5,000 per volatility percentage point, a move from 20% to 21% suggests +$5,000 for positive vega. The change is one volatility point, not a 100% or 1.00-decimal change.",
      "Correlation concerns how variables move together. It can matter for a payoff linked to two shares. It is neither the volatility of one share nor a guarantee of future co-movement. Changing an uncertain correlation and repricing helps investigate significance.",
      "These are local approximations. Large moves, option curvature and interactions can break a simple sensitivity-times-move estimate. Hold other inputs fixed when isolating an effect, then compare with full repricing."
    ],
    "example": "Rate move: 5.00% → 4.98% = −2bp\nSigned sensitivity: +$12,000/bp → approximate change −$24,000\nVolatility move: 20% → 21% = +1 vol point\nVega: +$5,000/vol point → approximate change +$5,000",
    "check": "Does a volatility move from 20% to 21% equal 1bp?",
    "answer": "No. It is one percentage point, or 100 basis points in percentage arithmetic. Use the stated vega unit rather than reusing a rate sensitivity unit."
  },
  {
    "id": "collateral-netting",
    "title": "Netting and collateral change exposure",
    "lessons": [
      7,
      13
    ],
    "paragraphs": [
      "Suppose the same counterparty owes the bank $100 on one contract and the bank owes it $80 on another. The arithmetic net is $20. Whether the bank may rely on that net after default depends on enforceable agreements and the applicable method. Matching a customer name in two rows does not establish legal netting.",
      "Collateral is security supporting an obligation. If an eligible $15 collateral amount covers a $20 exposure, the residual in this simplified example is $5. Real exposure calculations also consider timing, eligibility, haircuts, disputes, future changes and agreement terms. Collateral does not erase the original trades.",
      "Keep payment netting, close-out netting, accounting balance-sheet offset and valuation aggregation distinct. Permission for one does not automatically permit the others. These concepts explain why agreement and legal-entity identifiers matter to CVA, funding and risk systems."
    ],
    "example": "Contract A: bank is owed $100\nContract B: bank owes $80\nArithmetic net: $20, conditional on the relevant netting treatment\nEligible collateral: $15\nSimplified current uncovered amount: $5",
    "check": "Two trades share a customer ID. Is that enough to net them in a production calculation?",
    "answer": "No. Establish the legal entities, agreement, enforceability and conditions of the particular calculation. Otherwise the apparent $20 may not be the eligible net exposure."
  },
  {
    "id": "capital",
    "title": "From a balance sheet to a capital ratio",
    "lessons": [
      11,
      15
    ],
    "paragraphs": [
      "A balance sheet separates assets, liabilities and equity. If a simplified bank has assets of $1,000 and liabilities of $900, accounting equity is $100. Equity is the residual, not a special cash account.",
      "Regulatory capital starts from eligible components and applies prescribed adjustments. Accounting equity is not automatically CET1. Assume, purely for illustration, the bank’s capital reconciliation produces CET1 of $80 after all other eligibility rules and adjustments.",
      "Risk-weighted assets (RWA) are a regulatory risk measure used as a denominator. They are not simply the assets shown on the balance sheet. With RWA of $800 and CET1 of $80, the ratio is 10%. A final AVA deduction of $2 gives CET1 of $78 and a ratio of 9.75%, holding everything else fixed.",
      "The deduction reduces the regulatory measure. It is not a $2 cash payment and does not by itself change the accounting fair-value journal. Nor does this single ratio establish the bank’s total regulatory compliance."
    ],
    "example": "Accounting equity: $1,000 − $900 = $100\nAssumed eligible CET1 after other adjustments: $80\nBefore AVA: $80 / $800 = 10.00%\nAfter final $2 AVA: $78 / $800 = 9.75%\nChange: −0.25 percentage points = −25bp",
    "check": "Does the $2 AVA deduction mean the bank pays $2 cash to someone?",
    "answer": "No. It changes the regulatory capital calculation. Cash, accounting equity and regulatory capital are different measures."
  },
  {
    "id": "probability",
    "title": "Read a percentile before using it",
    "lessons": [
      12
    ],
    "paragraphs": [
      "Imagine 100 equally weighted plausible prices sorted from low to high. A low-tail point has most outcomes above it; a high-tail point has most outcomes below it. Percentiles describe location within a specified distribution, not a guaranteed future selling price.",
      "In the continuous normal distribution assumed by the lab, mean minus 1.28155 standard deviations is the 10th percentile. There is 10% model probability below it and 90% above. For a long asset, a lower price is adverse. For a short position, the adverse direction is higher, so the corresponding point is the 90th percentile.",
      "Mean 100 and standard deviation 0.20 give approximately 99.7437 and 100.2563. Doubling standard deviation doubles the distance from the mean. A standard deviation is a measure of spread, not a bid-offer quote or a fixed regulatory haircut.",
      "Real valuation evidence is not automatically a normal distribution. Dependent dealer quotes, sparse observations and stale prices can make a naive statistical calculation misleading. The lab illustrates direction and probability only; calibration, expert judgement and the regulatory method are separate steps."
    ],
    "example": "Long direction:  10% below | 99.7437 | 90% above\nCentre:          100.0000\nShort direction: 90% below |100.2563 | 10% above\nAssumed standard deviation: 0.20 price points",
    "check": "Does a 90% certainty objective mean deducting 10% of every position?",
    "answer": "No. The percentage describes probability under a specified assessment, not the size of a price haircut."
  }
];

FOUNDATIONS.push(...[
  {
    "id": "daily-pnl",
    "title": "Reconcile a whole day, including cash and FX",
    "lessons": [
      16,
      17
    ],
    "paragraphs": [
      "Opening quantity 100 plus 20 bought minus 30 sold leaves 90 shares. In the downloadable EUR case, raw carrying value falls from 10,000 to 9,360, but net cash received is 1,160. Raw period economic return is therefore 520, not a loss of 640.",
      "A deduction rising from 20 to 35 reduces the local result by 15 to 505 EUR. Translate each carrying value and cash flow at its supplied rate: opening EURUSD 1.10, closing and event rates 1.12. The reporting-currency result is 765.20 USD.",
      "One explicit attribution convention translates local return at closing FX and separates FX on the opening carrying amount and on cash flows. The bridge is 565.60 + 199.60 + 0 = 765.20 USD. Different attribution order can allocate interactions differently; the total must still reconcile.",
      "The workbook also compares FIFO with weighted-average cost and a two-for-one split. Cost allocation changes the realised/unrealised split, while the stated total economic result is unchanged. A split changes units and per-share price without creating a gain by itself."
    ],
    "example": "Opening adjusted value EUR 9,980 ×1.10 = USD 10,978\nClosing adjusted value EUR 9,325 ×1.12 = USD 10,444\nSigned cash EUR 1,160 ×1.12 = USD 1,299.20\nReturn: 10,444 −10,978 +1,299.20 = USD 765.20",
    "check": "If the dividend alone translates at 1.11 instead of 1.12, where does the change appear?",
    "answer": "The EUR 50 dividend contributes USD 0.50 less cash. Add a −0.50 cash-FX term; USD return becomes 764.70. Local EUR return stays 505."
  },
  {
    "id": "curve-repricing",
    "title": "Reprice the same cash flows with different inputs",
    "lessons": [
      3,
      4,
      9
    ],
    "paragraphs": [
      "A fixed two-payment instrument pays EUR 50 in year one and EUR 1,050 in year two. FO discount factors are 0.95 and 0.90; independent factors are 0.94 and 0.88. Multiply each payment by its factor and sum.",
      "FO value is 992.50; independent value 971.00. The −21.50 difference decomposes into −0.50 for year one and−21.00 for year two. This exact input bridge is linear in discount factors. It is not a full swap pricer because the cash flows are fixed.",
      "In a separate flat annual-rate example, changing 5% to 6% gives exact value change−18.333927. A derivative-based first-order estimate gives−18.594104: the 0.260178 residual reflects curvature. Rates and discount factors are different input coordinates.",
      "Before selecting a curve, check valuation date, currency, collateral/discounting basis, contractual conventions and source independence. Matching arithmetic is not evidence that the chosen curve is suitable."
    ],
    "example": "FO: 50×0.95 +1,050×0.90 =992.50\nIndependent: 50×0.94 +1,050×0.88 =971.00\nDifference:−21.50 =50×(−0.01)+1,050×(−0.02)",
    "check": "Why does exact discount-factor attribution reconcile while the rate sensitivity has a residual?",
    "answer": "PV is linear in fixed cash flows times supplied discount factors. Discount factors are nonlinear functions of rates, so a first-order rate approximation omits curvature. Both need aligned units and evidence."
  }
]);

// Floating-leg worked extension: keep the existing lesson and bookmarks.
{
 const swap = FOUNDATIONS.find(f => f.id === 'swaps-options');
 swap.resourceTask = 'swap-repricing';
 swap.paragraphs.push('After lesson 3 and the fixed-cash-flow curve example, open swap-repricing.md for the optional two-payment extension. Calculate one floating and fixed payment first, then value both payments. Compare forecast and discount changes only after that baseline reconciles. The later daily-P&L exercise is a separate task and is not needed to start this same-time comparison.');
}
