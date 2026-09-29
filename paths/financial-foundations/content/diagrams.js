/* Visual restatements of the existing financial teaching text. */
const FINANCE_DIAGRAMS = {
  "lesson-3": {
    "title": "Two curve roles, one contract",
    "summary": "Arrows show calculation dependencies. Forecasting a payment and discounting it are different operations.",
    "nodes": [
      {
        "id": "contract",
        "label": "Contract and conventions",
        "description": "Payment dates, terms, currency and collateral basis constrain the calculation."
      },
      {
        "id": "forecast",
        "label": "Forecast curve",
        "description": "Estimates the floating payments specified by the contract."
      },
      {
        "id": "cash",
        "label": "Receive and pay cash flows",
        "description": "Keep the two legs and payment dates distinct."
      },
      {
        "id": "discount",
        "label": "Discount curve",
        "description": "Provides discount factors for bringing each payment to the valuation date."
      },
      {
        "id": "pv",
        "label": "Present value of each leg",
        "description": "Sum the discounted cash flows separately."
      },
      {
        "id": "value",
        "label": "PV received − PV paid",
        "description": "The resulting swap value is not its notional."
      }
    ],
    "edges": [
      {
        "from": "contract",
        "to": "cash",
        "label": "defines terms"
      },
      {
        "from": "forecast",
        "to": "cash",
        "label": "projects floating amounts"
      },
      {
        "from": "cash",
        "to": "pv",
        "label": "payments by date"
      },
      {
        "from": "discount",
        "to": "pv",
        "label": "discount factors"
      },
      {
        "from": "pv",
        "to": "value",
        "label": "combine signed legs"
      }
    ],
    "steps": []
  },
  "lesson-4": {
    "title": "Independent checking needs a conclusion",
    "summary": "A simplified control workflow from the lesson. A numerical difference starts an investigation; it does not authorize a booking.",
    "nodes": [
      {
        "id": "population",
        "label": "Reconcile the population",
        "description": "Keep missing positions visible before comparing prices."
      },
      {
        "id": "evidence",
        "label": "Validate independent evidence",
        "description": "Check instrument, date, independence, units and conventions."
      },
      {
        "id": "compare",
        "label": "Compare or reprice",
        "description": "Use a direct price or independent model inputs on a consistent basis."
      },
      {
        "id": "investigate",
        "label": "Investigate exceptions",
        "description": "Assign an owner and separate data issues from genuine disagreements."
      },
      {
        "id": "approval",
        "label": "Approve the conclusion",
        "description": "Correct, adjust or retain with supporting evidence."
      },
      {
        "id": "signoff",
        "label": "Reconcile and sign off",
        "description": "Record the approved action and its reconciliation to the report."
      }
    ],
    "edges": [
      {
        "from": "population",
        "to": "evidence",
        "label": "complete scope"
      },
      {
        "from": "evidence",
        "to": "compare",
        "label": "usable aligned evidence"
      },
      {
        "from": "evidence",
        "to": "investigate",
        "label": "missing or unreliable evidence"
      },
      {
        "from": "compare",
        "to": "investigate",
        "label": "difference or control trigger"
      },
      {
        "from": "investigate",
        "to": "approval",
        "label": "documented findings"
      },
      {
        "from": "approval",
        "to": "signoff",
        "label": "approved action"
      }
    ],
    "steps": []
  },
  "lesson-8": {
    "title": "Classify the evidence behind the value",
    "summary": "This is a conceptual decision aid, not a product lookup table. Assess the overall measurement and the significance of its inputs.",
    "nodes": [
      {
        "id": "quote",
        "label": "Qualifying Level 1 quote?",
        "description": "An unadjusted quote for an identical instrument in an active market meets the stated Level 1 conditions."
      },
      {
        "id": "l1",
        "label": "Level 1",
        "description": "Use the qualifying measurement; listing alone does not establish these conditions."
      },
      {
        "id": "inputs",
        "label": "Assess the significant inputs",
        "description": "Consider observability and significance to the overall measurement."
      },
      {
        "id": "l3",
        "label": "Level 3",
        "description": "A significant unobservable input determines the classification."
      },
      {
        "id": "l2",
        "label": "Level 2",
        "description": "Other observable inputs support the measurement when Level 1 does not apply."
      },
      {
        "id": "record",
        "label": "Retain the evidence and reason",
        "description": "Classify the measurement, not merely the product or vendor name."
      }
    ],
    "edges": [
      {
        "from": "quote",
        "to": "l1",
        "label": "yes"
      },
      {
        "from": "quote",
        "to": "inputs",
        "label": "no"
      },
      {
        "from": "inputs",
        "to": "l3",
        "label": "significant unobservable input"
      },
      {
        "from": "inputs",
        "to": "l2",
        "label": "significant inputs observable"
      },
      {
        "from": "l1",
        "to": "record",
        "label": "classification"
      },
      {
        "from": "l2",
        "to": "record",
        "label": "classification"
      },
      {
        "from": "l3",
        "to": "record",
        "label": "classification"
      }
    ],
    "steps": []
  },
  "lesson-11": {
    "title": "Accounting value and capital are separate outputs",
    "summary": "The two branches answer different questions. An AVA does not automatically become another accounting journal.",
    "nodes": [
      {
        "id": "raw",
        "label": "Raw valuation",
        "description": "Start from the supported valuation and its scope."
      },
      {
        "id": "booked",
        "label": "Accounting adjustments",
        "description": "Identify amounts already recognized and what uncertainty each addresses."
      },
      {
        "id": "fv",
        "label": "Accounting fair value",
        "description": "Report the accounting result under the applicable measurement basis."
      },
      {
        "id": "uncertainty",
        "label": "Prudential uncertainty assessment",
        "description": "Assess the relevant uncertainty under the applicable regime."
      },
      {
        "id": "remaining",
        "label": "Eligible remaining amount",
        "description": "Recognize only eligible same-source adjustments at the required level; avoid double counting."
      },
      {
        "id": "aggregation",
        "label": "Prescribed aggregation",
        "description": "Apply the relevant method and scope before a final AVA."
      },
      {
        "id": "capital",
        "label": "CET1 deduction",
        "description": "The final regulatory deduction changes capital, not a cash account."
      }
    ],
    "edges": [
      {
        "from": "raw",
        "to": "booked",
        "label": "accounting route"
      },
      {
        "from": "booked",
        "to": "fv",
        "label": "recognized value"
      },
      {
        "from": "raw",
        "to": "uncertainty",
        "label": "prudential route"
      },
      {
        "from": "uncertainty",
        "to": "remaining",
        "label": "gross assessment"
      },
      {
        "from": "booked",
        "to": "remaining",
        "label": "eligible same-source mapping only"
      },
      {
        "from": "remaining",
        "to": "aggregation",
        "label": "eligible amounts"
      },
      {
        "from": "aggregation",
        "to": "capital",
        "label": "final AVA"
      }
    ],
    "steps": []
  },
  "lesson-14": {
    "title": "Follow uncertainty into the appropriate category",
    "summary": "This map explains the allocation relationship in the dated EU teaching reference. It is not a rule that every category applies to every product.",
    "nodes": [
      {
        "id": "credit",
        "label": "Unearned credit spread uncertainty",
        "description": "Assess uncertainty in the relevant credit valuation adjustment."
      },
      {
        "id": "funding",
        "label": "Investing / funding uncertainty",
        "description": "Assess the relevant funding valuation uncertainty."
      },
      {
        "id": "allocation",
        "label": "Allocate by uncertainty source",
        "description": "Credit and funding uncertainty feed the applicable categories; do not add duplicate totals."
      },
      {
        "id": "mpu",
        "label": "Market price uncertainty",
        "description": "Uncertainty in market-derived prices or inputs."
      },
      {
        "id": "coc",
        "label": "Close-out costs",
        "description": "Relevant uncertainty in exit spread economics."
      },
      {
        "id": "model",
        "label": "Model risk",
        "description": "Defensible modelling alternatives; exclude input uncertainty already captured in MPU."
      },
      {
        "id": "others",
        "label": "Other categories assessed separately",
        "description": "Concentration, future administrative costs, early termination and operational risk retain their prescribed treatments."
      }
    ],
    "edges": [
      {
        "from": "credit",
        "to": "allocation",
        "label": "identify source"
      },
      {
        "from": "funding",
        "to": "allocation",
        "label": "identify source"
      },
      {
        "from": "allocation",
        "to": "mpu",
        "label": "market-input component"
      },
      {
        "from": "allocation",
        "to": "coc",
        "label": "close-out component"
      },
      {
        "from": "allocation",
        "to": "model",
        "label": "model component"
      }
    ],
    "steps": []
  },
  "lesson-15": {
    "title": "Keep the aggregation sequence visible",
    "summary": "A conceptual core-approach pipeline from the existing advanced section. Category methods and legal conditions remain in the lesson; this is not a universal haircut formula.",
    "nodes": [
      {
        "id": "evidence",
        "label": "Evidence and exposure",
        "description": "Define the valuation exposure and supported prudent-value assessment."
      },
      {
        "id": "same",
        "label": "Same-source booked adjustment",
        "description": "Map only eligible amounts addressing the same uncertainty at the required level."
      },
      {
        "id": "exposure",
        "label": "Eligible exposure amounts",
        "description": "Keep scope, currency and CET1 impact consistent; do not deduct a booked amount twice."
      },
      {
        "id": "category",
        "label": "Prescribed category aggregation",
        "description": "Apply the method for that category; the Annex factor is not a blanket discount on all categories."
      },
      {
        "id": "totals",
        "label": "Category totals",
        "description": "Avoid duplicate credit and funding uncertainty amounts."
      },
      {
        "id": "total",
        "label": "Total AVA",
        "description": "Combine category results under the applicable rules."
      },
      {
        "id": "cet1",
        "label": "CET1 deduction",
        "description": "Use the final amount in the regulatory capital reconciliation."
      }
    ],
    "edges": [
      {
        "from": "evidence",
        "to": "same",
        "label": "identify overlap"
      },
      {
        "from": "same",
        "to": "exposure",
        "label": "eligible treatment"
      },
      {
        "from": "exposure",
        "to": "category",
        "label": "category-specific method"
      },
      {
        "from": "category",
        "to": "totals",
        "label": "reconcile"
      },
      {
        "from": "totals",
        "to": "total",
        "label": "combine"
      },
      {
        "from": "total",
        "to": "cet1",
        "label": "capital output"
      }
    ],
    "steps": []
  },
  "lesson-17": {
    "title": "Lineage branches into different reporting questions",
    "summary": "Arrows show dependencies, not a single mandatory batch-job order. Versioned snapshots and approvals make reruns explainable.",
    "nodes": [
      {
        "id": "positions",
        "label": "Trade and position snapshot",
        "description": "Record the population and valuation date with stable identifiers."
      },
      {
        "id": "inputs",
        "label": "Normalized market-data snapshot",
        "description": "Preserve the original sources, times, units and selected observations."
      },
      {
        "id": "value",
        "label": "Model valuation",
        "description": "Link the contract, input snapshots and model version."
      },
      {
        "id": "control",
        "label": "Independent check and exceptions",
        "description": "Investigate, resolve and approve the control conclusion."
      },
      {
        "id": "accounting",
        "label": "Accounting adjustments and value",
        "description": "Keep approved adjustments and accounting output traceable."
      },
      {
        "id": "hierarchy",
        "label": "Hierarchy assessment",
        "description": "Classify the evidence supporting the measurement."
      },
      {
        "id": "prudent",
        "label": "Prudential assessment",
        "description": "Map uncertainty and eligible same-source adjustments separately."
      },
      {
        "id": "report",
        "label": "Reconciled reports",
        "description": "Retain reporting batch, approvals and the links back to the inputs."
      }
    ],
    "edges": [
      {
        "from": "positions",
        "to": "value",
        "label": "contract population"
      },
      {
        "from": "inputs",
        "to": "value",
        "label": "selected inputs"
      },
      {
        "from": "value",
        "to": "control",
        "label": "desk result to challenge"
      },
      {
        "from": "control",
        "to": "accounting",
        "label": "approved conclusions"
      },
      {
        "from": "inputs",
        "to": "hierarchy",
        "label": "observability evidence"
      },
      {
        "from": "accounting",
        "to": "hierarchy",
        "label": "measurement assessed"
      },
      {
        "from": "accounting",
        "to": "prudent",
        "label": "same-source mapping"
      },
      {
        "from": "accounting",
        "to": "report",
        "label": "accounting output"
      },
      {
        "from": "hierarchy",
        "to": "report",
        "label": "classification"
      },
      {
        "from": "prudent",
        "to": "report",
        "label": "capital assessment"
      }
    ],
    "steps": []
  },
  "foundation-cash-flows": {
    "title": "Promised payments have dates",
    "summary": "The two-year bond promises these payments. Default risk can prevent receipt; this timeline is not a guarantee.",
    "nodes": [
      {
        "id": "today",
        "label": "Today: buy the bond",
        "description": "Purchase exchanges cash for the contractual rights."
      },
      {
        "id": "year1",
        "label": "Year 1: receive $50",
        "description": "The first annual coupon is 5% of the $1,000 face amount."
      },
      {
        "id": "year2",
        "label": "Year 2: receive $1,050",
        "description": "The final coupon is $50 and principal repayment is $1,000."
      },
      {
        "id": "pv1",
        "label": "Discount the first payment",
        "description": "At the stated flat rate, divide 50 by one year of compounding."
      },
      {
        "id": "pv2",
        "label": "Discount the final payment",
        "description": "Discount 1,050 over two years, not one."
      },
      {
        "id": "sum",
        "label": "Add both present values",
        "description": "At the example’s 5% rate the sum is $1,000."
      }
    ],
    "edges": [
      {
        "from": "today",
        "to": "year1",
        "label": "one year later"
      },
      {
        "from": "year1",
        "to": "year2",
        "label": "one further year"
      },
      {
        "from": "year1",
        "to": "pv1",
        "label": "value at today"
      },
      {
        "from": "year2",
        "to": "pv2",
        "label": "value at today"
      },
      {
        "from": "pv1",
        "to": "sum",
        "label": "first present value"
      },
      {
        "from": "pv2",
        "to": "sum",
        "label": "second present value"
      }
    ],
    "steps": []
  },
  "starter-3": {
    "title": "Positions sit inside internal groupings",
    "summary": "A simplified organization map. Group membership does not imply legal netting or a regulatory trading-book classification.",
    "nodes": [
      {
        "id": "entity",
        "label": "Fictional Bank Ltd",
        "description": "The legal entity holds rights and obligations."
      },
      {
        "id": "desk",
        "label": "Equity desk",
        "description": "The team manages the illustrated books."
      },
      {
        "id": "customer",
        "label": "Customer book",
        "description": "An internal grouping of customer-related positions."
      },
      {
        "id": "hedge",
        "label": "Hedge book",
        "description": "A separate internal grouping managed by the same desk."
      },
      {
        "id": "a",
        "label": "Company A: +11 shares",
        "description": "The customer-book position reflects the three illustrated trade events."
      },
      {
        "id": "c",
        "label": "Company C: +20 shares",
        "description": "Another position in the customer book."
      }
    ],
    "edges": [
      {
        "from": "entity",
        "to": "desk",
        "label": "contains the team"
      },
      {
        "from": "desk",
        "to": "customer",
        "label": "manages"
      },
      {
        "from": "desk",
        "to": "hedge",
        "label": "manages"
      },
      {
        "from": "customer",
        "to": "a",
        "label": "groups"
      },
      {
        "from": "customer",
        "to": "c",
        "label": "groups"
      }
    ],
    "steps": []
  }
};
