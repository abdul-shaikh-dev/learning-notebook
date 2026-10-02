const ADVANCED = [
  {
    "lessonId": 2,
    "title": "Choose the market before measuring the price",
    "paragraphs": [
      "Use the accessible principal market even if another venue offers a better price. Without a principal market, select the most advantageous accessible market using net proceeds after transaction and transport costs. Transaction costs then stay outside fair value; location-related transport costs can affect it."
    ],
    "example": "Synthetic financial asset; no transport costs. Venue A: price 102, transaction cost 4, net 98. Venue B: price 101, cost 1, net 100. If A is principal, fair value is 102. If neither is principal, choose B; fair value is 101, not net proceeds of 100.",
    "sourceIds": [
      "ifrs",
      "ifrsdetail"
    ],
    "citations": [
      {
        "label": "IFRS-aligned AASB 13 (December 2022 compilation)",
        "url": "https://standards.aasb.gov.au/aasb-13-dec-2022",
        "paragraph": "16–26; Appendix A, most advantageous market",
        "checkedDate": "2026-09-26",
        "status": "Accessible primary standard-setter text; Australian-specific provisions excluded."
      }
    ]
  },
  {
    "lessonId": 10,
    "title": "From Level 3 classification to a reporting record",
    "paragraphs": [
      "Recurring Level 3 reporting reconciles opening and closing balances. Disclose movements separately, transfer reasons/timing policy, P&L lines and unrealised P&L for holdings remaining at period-end. Also explain techniques, significant unobservable inputs and valuation processes. Sensitivity disclosures depend on the measurement and significance conditions in paragraph 93(h)."
    ],
    "example": "Synthetic asset class, €m:\nOpening 100 + purchases 20 − sales 12 − settlements 5 + issues 0 + P&L gains 4 + OCI 0 + transfers in 8 − transfers out 3 = closing 112.\nDisclosure record: discounted cash flow; unobservable credit spread 450bp; reasonably possible range 400–500bp; revalued totals 115–109. Explain assumptions, input relationships, transfer reasons and the applicable significance assessment.",
    "sourceIds": [
      "ifrs",
      "ifrsdetail"
    ],
    "citations": [
      {
        "label": "IFRS-aligned AASB 13 (December 2022 compilation)",
        "url": "https://standards.aasb.gov.au/aasb-13-dec-2022",
        "paragraph": "93(d)–(h), 94–95",
        "checkedDate": "2026-09-26",
        "status": "Accessible primary standard-setter text; illustrative numbers are original."
      }
    ]
  },
  {
    "lessonId": 15,
    "title": "Annex aggregation: decode every symbol",
    "paragraphs": [
      "These formulas concern MPU, close-out and model-risk categories. FV is exposure-level fair value after identifiable same-source accounting adjustments. PV here means prudent value, not present value. EV is the expected value across possible exposure values. Alpha is the aggregation factor; the referenced Annex sets it to 50% after 2020. APVA is the exposure amount after aggregation treatment; sum APVAs within the category to obtain its AVA.",
      "Method 1: APVA = (1 − alpha) × (FV − PV). Method 2: APVA = max(0, FV − alpha × EV − (1 − alpha) × PV). Keep consistent exposure, currency and uncertainty source. Never subtract the same booked adjustment again."
    ],
    "example": "Synthetic long-asset exposure, €k, same uncertainty source:\nRaw value 1,000; eligible booked deduction 2 → FV 998. Supplied PV 990; EV 996; alpha 0.50.\nMethod 1: 0.50 × (998 − 990) = 4.\nMethod 2: max(0, 998 − 0.50×996 − 0.50×990) = 5.\nThese are alternative calculations, not amounts to add together.",
    "sourceIds": [
      "eu"
    ],
    "citations": [
      {
        "label": "EU 2020/866 amendment, Annex",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32020R0866",
        "paragraph": "Annex: formulas, definitions and aggregation factor",
        "checkedDate": "2026-09-26",
        "status": "Verified in official EUR-Lex indexed text; replaces the Annex of 2016/101."
      },
      {
        "label": "EU 2016/101",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0101-20200626",
        "paragraph": "8(3)–(4); 9(6), 10(7), 11(7)",
        "checkedDate": "2026-09-26",
        "status": "Consolidated direct page blocked during this check; official indexed text and archival reproduction checked."
      }
    ]
  },
  {
    "lessonId": 15,
    "title": "Keep the aggregation sequence visible",
    "paragraphs": [
      "First define the valuation exposure and calculate its prudent value under the relevant category method. Map only accounting adjustments that address that same uncertainty at the required calculation level. An unrelated reserve cannot reduce this result. Respect the CET1-impact proportion and non-negative AVA requirements.",
      "Next calculate the eligible exposure amounts, apply that category's prescribed aggregation, and combine category results. Credit-spread and investing/funding uncertainty feed the MPU, close-out and model-risk categories as required; do not add them twice. Categories outside the Annex do not receive an automatic 50% discount. A supplied prudent value or expected value is an assumption in these teaching examples, not something the formula itself estimates."
    ],
    "example": "Teaching flow: evidence → exposure/prudent value → eligible same-source booked adjustment → exposure AVA → prescribed category aggregation → category totals → total AVA → CET1 deduction.\nIf two Method-1 exposures produce APVAs of €4k and €3k, their category AVA is €7k. That is still not the bank's all-category total.",
    "sourceIds": [
      "eu"
    ],
    "citations": [
      {
        "label": "EU 2016/101",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32016R0101",
        "paragraph": "7(1); 8; 12(2); 13(2)",
        "checkedDate": "2026-09-26",
        "status": "Original official text checked through indexed extracts; use alongside the 2020 Annex amendment."
      }
    ]
  },
  {
    "lessonId": 15,
    "title": "Simplified approach: eligibility, matching and breach timeline",
    "paragraphs": [
      "The referenced EU threshold is strictly below €15bn. Exactly €15bn fails the condition. Exclude exactly matching offsetting fair-valued assets and liabilities; include other values only in proportion to how valuation changes affect CET1. This is not permission to net all longs against all shorts.",
      "Test both the individual institution and consolidated group. A consolidated breach requires the core approach throughout the consolidation. After two consecutive quarters failing the condition, an institution using the simplified approach must immediately notify its competent authority and agree a plan to implement the core approach within the following two quarters."
    ],
    "example": "Synthetic scope check: €16bn gross absolute values includes an exactly matching €1bn asset/€1bn liability pair. Excluding both leaves €14bn; assume full CET1 impact otherwise and group eligibility. Simplified AVA = 0.001 × €14bn = €14m.\nSeparate timeline: Q1 €15bn and Q2 €15.2bn → notify immediately after Q2 and agree transition within Q3–Q4. Do not wait until Q4 to raise the issue.",
    "sourceIds": [
      "eu"
    ],
    "citations": [
      {
        "label": "EU 2016/101",
        "url": "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A32016R0101",
        "paragraph": "4–6",
        "checkedDate": "2026-09-26",
        "status": "Official indexed text verified; direct access can be restricted."
      },
      {
        "label": "EU 2016/101, original EU text archived by UK legislation service",
        "url": "https://www.legislation.gov.uk/eur/2016/101/chapter/II/2015-10-26?view=plain",
        "paragraph": "4(1)–(4), 5–6",
        "checkedDate": "2026-09-26",
        "status": "Verified in official indexed text; this citation supports the EU historical rule, not a current UK €15bn threshold."
      }
    ]
  },
  {
    "lessonId": 12,
    "title": "When the ordinary core calculation cannot be performed",
    "paragraphs": [
      "A missing feed first creates an evidence problem to investigate. It does not by itself prove that Articles 9–17 are impossible to apply: a permitted, documented expert-based method may still be available. Record the failed method, affected instruments and escalation decision.",
      "If Articles 9–17 cannot be applied to certain positions, Article 7(2)(b) prescribes a fallback: include 100% of net unrealised profit on the related instruments, plus 10% of derivative notional, plus 25% of |fair value − unrealised profit| for non-derivatives. Unrealised profit is the positive fair-value change since inception, using first-in-first-out. The last two terms apply to their respective instrument types. This fallback is distinct from the simplified 0.1% approach."
    ],
    "example": "Synthetic non-derivative, full CET1 impact: inception value €100k; current FV €108k; positive unrealised profit €8k. Fallback = €8k + 25% × |€108k − €8k| = €33k.\nSeparate derivative: €2m notional, €10k qualifying unrealised profit → €10k + 10%×€2m = €210k. Neither example is a routine haircut for an otherwise calculable position.",
    "sourceIds": [
      "eu"
    ],
    "citations": [
      {
        "label": "EU 2016/101 Article 7 reproduced by FCA",
        "url": "https://www.handbook.fca.org.uk/techstandards/CRD/2016/reg_del_2016_101_oj.pdf",
        "paragraph": "7(2)(b)(i)–(iii), final subparagraph",
        "checkedDate": "2026-09-26",
        "status": "Verified via official indexed full Article 7 extract; direct FCA PDF now redirects to a JavaScript application."
      },
      {
        "label": "EU 2016/101",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0101-20200626",
        "paragraph": "7(2)(b); 9(5)(b), 10(6), 11(4)–(6)",
        "checkedDate": "2026-09-26",
        "status": "Use the dated EU reference; no claim of a complete September 2026 legal consolidation."
      }
    ]
  },
  {
    "lessonId": 17,
    "title": "Make a rule traceable and maintainable",
    "paragraphs": [
      "A source record should identify the issuer, jurisdiction, document title, exact article or paragraph, edition/effective date, checked date, access result and change trigger. A calculation record should reference that rule version. The day a PDF was downloaded is not its effective date.",
      "For this edition, the detailed IFRS 13 PDF requires sign-in. The stable IFRS standard page remains a useful entry point; the AASB December 2022 compilation supplies accessible IFRS-aligned paragraphs, excluding Australian-specific provisions. EU source checks used official indexed text where direct access was blocked. This records evidence limits without treating a blocked link as a change in law.",
      "A future amendment, reporting-date change or regulator clarification should trigger a review of affected lessons, formulas and fixtures together. Keep historical reviews immutable and add a new review record. Label proposals separately from enacted requirements."
    ],
    "example": "Example source record:\nissuer: European Commission\nrule: 2016/101, Annex as amended by 2020/866\nclaim: alpha=50% after 31 December 2020\nchecked: 2026-09-26\nevidence: official indexed Annex text\nchange trigger: amended Annex or changed reporting regime\nstatus: dated learning reference; revalidate for a production reporting date",
    "sourceIds": [
      "eu",
      "ifrs",
      "ifrsdetail"
    ],
    "citations": [
      {
        "label": "IFRS 13 official standard landing page",
        "url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-13-fair-value-measurement/",
        "paragraph": "Standard landing page; detailed PDF paragraphs 16–26 and 93",
        "checkedDate": "2026-09-26",
        "status": "Stable entry point; detailed 2022 PDF redirected to sign-in in this check."
      },
      {
        "label": "EU 2020/866",
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32020R0866",
        "paragraph": "Annex final sentence",
        "checkedDate": "2026-09-26",
        "status": "Official indexed text checked; effective-period distinction retained."
      }
    ]
  }
];
