const EXERCISES = {
  "modules": [
    {
      "id": "foundations",
      "title": "Foundations",
      "lessonIds": [1, 2, 3],
      "tasks": [
        {
          "id": "foundations-numeric",
          "type": "numeric",
          "prompt": "A bank owns a long bond with USD 2,000,000 face amount. Its clean price is 97.40 per 100 of face and signed accrued interest is USD 12,000. Calculate the dirty market value in USD. Assume no FX conversion or other adjustments.",
          "numericAnswer": 1960000,
          "tolerance": 0.01,
          "answer": "USD 1,960,000.",
          "reasoning": "Clean value = 2,000,000 × 97.40 / 100 = 1,948,000. Dirty value adds accrued interest: 1,948,000 + 12,000 = 1,960,000. Multiplying by 97.40 without dividing by 100 confuses the quote convention; reporting face amount ignores the market price.",
          "rubric": ["Identify the quote as per 100 of face.", "Calculate USD 1,948,000 clean value.", "Add accrued interest once and label USD 1,960,000 as dirty value."]
        },
        {
          "id": "foundations-explain",
          "type": "explain",
          "prompt": "Explain to a new developer why TradeId, InstrumentId and BookId should not be interchangeable. Use this example: trade T1 buys 100 shares of instrument X and trade T2 buys another 50 shares of X, both allocated to book B. No shares are sold.",
          "answer": "T1 and T2 identify two trade events; X identifies the shared instrument; B identifies the book holding them. The resulting position in X in book B is 150 shares. A position aggregation must preserve links to both trades.",
          "reasoning": "Using InstrumentId as a unique trade key would overwrite or collapse one purchase. Treating the two trades as different instruments would prevent the intended position aggregation. A book contains positions and is not itself a tradable instrument.",
          "rubric": ["Distinguish an event, an instrument and an allocation/book.", "Derive the 150-share position.", "Describe one concrete duplicate-key or aggregation failure."]
        },
        {
          "id": "foundations-diagnose",
          "type": "diagnose",
          "prompt": "A dashboard reports a swap with USD 10m notional as a USD 10m asset. The supplied contract exchanges interest payments only; principal is not exchanged. A separate approved valuation output at the same date is positive USD 80,000 to the bank. Identify the error and propose two clearer dashboard fields.",
          "answer": "The dashboard has substituted the contractual reference amount for market value. Show Notional: USD 10m and Signed market value to bank: +USD 80,000, with the valuation date and currency.",
          "reasoning": "Notional scales interest payments; it is not automatically an asset balance. The positive USD 80,000 supplied valuation is the asset amount in this example. Relabelling notional as exposure without defining exposure would preserve the ambiguity.",
          "rubric": ["Identify the notional/value substitution.", "Keep the two amounts in separately named fields.", "State the bank perspective, currency and valuation date requirement."]
        },
        {
          "id": "foundations-scenario",
          "type": "scenario",
          "prompt": "A bond held by the bank has two independent prices today: 99.10 for a small executable trade and 99.40 as a non-binding mid indication. Your position is much larger than the quoted trade. No principal-market assessment, size analysis or price-convention reconciliation is supplied. Which price would you investigate first, and what evidence could change your choice? You are not being asked to set final fair value.",
          "answer": "Starting with the executable price is defensible because it is transaction evidence, but starting by reconciling the mid against other relevant observations is also defensible. Check accessible relevant market, timestamps, clean/dirty convention, instrument identity, normal transaction conditions and size relevance before concluding.",
          "reasoning": "Executability strengthens evidence but does not make every small trade representative of the whole measurement. A mid indication can inform a measurement but is not automatically an achievable exit price. Picking the higher price solely to improve profit is not an evidence-based choice.",
          "rubric": ["Make a provisional choice with a reason tied to evidence.", "Name at least three missing comparability checks.", "Describe evidence that could reverse the provisional choice and avoid asserting a final value."]
        }
      ]
    },
    {
      "id": "valuation-control",
      "title": "Valuation control",
      "lessonIds": [4, 5, 6, 7],
      "tasks": [
        {
          "id": "control-numeric",
          "type": "numeric",
          "prompt": "A short bond position has signed face amount minus USD 4,000,000. FO clean price is 101.20 and the independent clean price is 101.05, both per 100. Calculate signed IPV difference = independent value minus FO value, in USD. Hold accrued interest fixed and ignore FX.",
          "numericAnswer": 6000,
          "tolerance": 0.01,
          "answer": "+USD 6,000.",
          "reasoning": "−4,000,000 × (101.05 − 101.20) / 100 = +6,000. Independent value is −4,042,000 versus FO value −4,048,000. A lower price makes the signed short value less negative. Applying the long-position sign gives the wrong result; a diagnostic difference alone does not authorise a journal.",
          "rubric": ["Use the signed face amount.", "Apply the per-100 convention and independent-minus-FO order.", "Explain why the short position produces a positive difference."]
        },
        {
          "id": "control-explain",
          "type": "explain",
          "prompt": "A synthetic long asset has an opening accounting deduction of USD 18,000 and a closing deduction of USD 25,000. Explain the closing deduction balance, deduction movement and signed value effect of that movement. Hold the raw value and all other items fixed.",
          "answer": "Closing deduction balance is USD 25,000. Deduction movement is +USD 7,000, while the incremental signed value effect is −USD 7,000. The closing balance is not the current period expense by itself.",
          "reasoning": "The movement is 25,000 − 18,000. Under the stated long-asset deduction convention, a larger deduction lowers value. Booking the full USD 25,000 again as the movement would count the existing opening balance twice.",
          "rubric": ["Separate balance from movement.", "Calculate the USD 7,000 increase.", "Explain the negative value effect under the supplied convention."]
        },
        {
          "id": "control-diagnose",
          "type": "diagnose",
          "prompt": "An IPV report starts with 100 positions. Twenty have no independent source and disappear in an inner join. Of the remaining 80, eight exceed tolerance. The report says: 'Coverage 100%; exceptions 10%; all other positions verified.' Diagnose the report and give the supported metrics.",
          "answer": "Source coverage is 80/100 = 80%; 20/100 = 20% lack a source. Eight of 80 sourced positions exceed tolerance, a 10% sourced-population exception rate, or 8% of the full population. The other 72 sourced positions are within tolerance, not automatically fully verified.",
          "reasoning": "The inner join has hidden missing evidence and changed the denominator. A zero or absent difference is not evidence of agreement. Being within tolerance also does not establish independence, freshness or correct conventions.",
          "rubric": ["Restore the original 100-position denominator.", "Report missing-source status separately from numerical exceptions.", "Label both exception-rate denominators and avoid equating within-tolerance with verified."]
        },
        {
          "id": "control-scenario",
          "type": "scenario",
          "prompt": "Your synthetic policy requires investigation when the absolute IPV difference is greater than USD 10,000, and also requires a separate evidence-quality assessment. A position differs by USD 7,000 from a quote last refreshed 15 days ago. The policy provides no universal maximum age. Can you close the case as a numerical pass? Explain what would justify accepting the evidence or keeping it unresolved.",
          "answer": "The amount test does not breach, but the evidence-quality case cannot be closed from those facts alone. Acceptance could be defensible if documented market activity, relevant newer corroboration and an appropriate age assessment support the quote. Otherwise retain an unresolved evidence status and escalate for investigation.",
          "reasoning": "A difference under tolerance answers only the supplied amount test. Fifteen days is not automatically acceptable or unacceptable without market and policy context. Inventing a universal age cutoff or treating the stale number as zero avoids rather than resolves the evidence issue.",
          "rubric": ["Distinguish the numerical result from evidence status.", "State what corroborating facts would support acceptance.", "Describe the unresolved outcome without inventing a production age limit."]
        }
      ]
    },
    {
      "id": "fair-value-hierarchy",
      "title": "Fair value hierarchy",
      "lessonIds": [8, 9, 10],
      "tasks": [
        {
          "id": "hierarchy-numeric",
          "type": "numeric",
          "prompt": "A synthetic Level 3 asset roll-forward is stated entirely in USD millions: opening balance 12; purchases +3; settlements −2; gains recognised in profit or loss +0.8; losses recognised in other comprehensive income −0.2; transfers into Level 3 +1.5; transfers out −0.6. There are no other movements. Calculate the closing Level 3 balance, in USD millions.",
          "numericAnswer": 14.5,
          "tolerance": 0.000001,
          "answer": "USD 14.5 million.",
          "reasoning": "12 + 3 − 2 + 0.8 − 0.2 + 1.5 − 0.6 = 14.5. Transfers affect the classification population and are not themselves gains or losses. Omitting them breaks the reconciliation even when the total assets of the bank are unchanged.",
          "rubric": ["Use every supplied movement with its sign.", "Keep the answer in USD millions.", "Separate classification transfers from gains and losses."]
        },
        {
          "id": "hierarchy-explain",
          "type": "explain",
          "prompt": "Explain why a model-valued vanilla swap is not automatically Level 3. Assume there is no qualifying Level 1 price, all significant inputs are supported by relevant observable market data, and an unobservable minor input is assessed as insignificant to the entire measurement.",
          "answer": "Under the supplied facts the measurement is Level 2. A model describes the calculation method; the hierarchy describes the evidence supporting the measurement. The insignificant unobservable input does not by itself make the entire measurement Level 3.",
          "reasoning": "Model use and input unobservability are different concepts. Counting unobservable fields or declaring every model Level 3 ignores significance. If a significant input later becomes unobservable, the classification would need reassessment.",
          "rubric": ["Conclude Level 2 under the stated assumptions.", "Separate method from observability.", "Explain the role of significance and a fact that would trigger reassessment."]
        },
        {
          "id": "hierarchy-diagnose",
          "type": "diagnose",
          "prompt": "A classifier assigns Level 2 whenever more than half of a model's inputs are observable. A product has nine observable inputs and one unobservable correlation input. The assessment explicitly concludes that this correlation is significant to the entire measurement. There is no qualifying Level 1 price. Diagnose the rule and state the classification under these facts.",
          "answer": "The count-based classifier is wrong; the measurement is Level 3 because a significant input is unobservable. Store the input-level evidence and significance assessment supporting the measurement-level decision.",
          "reasoning": "Nine observable inputs do not outvote one significant unobservable input. The hierarchy considers the lowest-level input significant to the entire measurement, not a majority vote or the most convenient system flag.",
          "rubric": ["Identify the incorrect majority-vote rule.", "Classify Level 3 using the supplied significance conclusion.", "Retain evidence and significance rationale rather than only a final level flag."]
        },
        {
          "id": "hierarchy-scenario",
          "type": "scenario",
          "prompt": "A valuation uses an unobservable liquidity parameter. A developer asks whether to tag the entire measurement Level 3. No assessment of the parameter's significance is available; other significant inputs are observable and there is no qualifying Level 1 quote. Describe two possible conclusions and the evidence needed to choose.",
          "answer": "If the parameter is significant to the entire measurement, Level 3 follows; if it is not significant and all other significant inputs are observable, Level 2 can follow. Obtain a documented significance assessment, including relevant sensitivity and qualitative considerations, before assigning the final level.",
          "reasoning": "Neither 'one unobservable field always means Level 3' nor 'small current adjustment always means Level 2' is a sufficient assessment. Sensitivity can help, but a single small point estimate does not settle every significance question.",
          "rubric": ["State both conditional outcomes.", "Request a documented significance assessment rather than inventing a universal threshold.", "Explain why the current missing assessment prevents a definitive tag."]
        }
      ]
    },
    {
      "id": "prudent-valuation",
      "title": "Prudent valuation",
      "lessonIds": [11, 12, 13, 14, 15],
      "tasks": [
        {
          "id": "prudence-numeric",
          "type": "numeric",
          "prompt": "A completed and approved regulatory calculation supplies a final AVA deduction of EUR 4m. CET1 before this deduction is EUR 800m and RWA is EUR 8,000m. Hold all other items fixed. Calculate the fall in the CET1 ratio in basis points (enter a positive number for the fall). One basis point is 0.01 percentage point.",
          "numericAnswer": 5,
          "tolerance": 0.000001,
          "answer": "5 basis points: the ratio falls from 10.00% to 9.95%.",
          "reasoning": "After-deduction CET1 is 796m, so 796/8,000 × 100 = 9.95%. The difference is 0.05 percentage point, equal to 5 bp. Calling it a 5% ratio decline confuses basis points with percent; the final AVA is supplied, not calculated by this exercise.",
          "rubric": ["Deduct EUR 4m from capital, not from RWA.", "Calculate both ratios.", "Convert 0.05 percentage point to 5 bp and identify that the final AVA was an input."]
        },
        {
          "id": "prudence-explain",
          "type": "explain",
          "prompt": "In the supplied long-asset teaching case, gross prudent close-out requirement is USD 16,000 and an eligible same-source accounting deduction of USD 10,000 is already included in the fair-value baseline. A separate gross MPU requirement is USD 8,000 with no eligible same-source offset. Explain the incremental amounts and what the sum does and does not represent. No regulatory aggregation result is provided.",
          "answer": "Incremental close-out assessment is max(0, 16,000 − 10,000) = USD 6,000. Incremental MPU assessment is USD 8,000. Their USD 14,000 sum is a diagnostic pre-aggregation amount, not a final regulatory AVA or automatic accounting journal.",
          "reasoning": "The eligible deduction prevents double counting the same source of uncertainty. It is not a general credit against unrelated uncertainty. Adding the two diagnostic components does not establish required scope, category treatment or aggregation.",
          "rubric": ["Calculate USD 6,000 and USD 8,000 separately.", "Explain same-source eligibility and baseline inclusion.", "Label USD 14,000 as pre-aggregation and explicitly withhold a final AVA conclusion."]
        },
        {
          "id": "prudence-diagnose",
          "type": "diagnose",
          "prompt": "A developer implements: 'For every trade, take 0.1% of derivative notional, then halve the result for diversification and post it as an accounting reserve.' Identify at least three independent conceptual errors. This exercise does not provide eligibility, a legal regime or an approved aggregation method.",
          "answer": "The simplified approach cannot be assumed applicable without eligibility and regime; its defined fair-value base is not derivative notional. A blanket 50% reduction is not a universal aggregation rule. A prudential AVA is not automatically an accounting reserve journal. Trade-by-trade calculation may also use the wrong prescribed scope.",
          "reasoning": "A familiar percentage does not supply its legal base or conditions. A method-specific aggregation coefficient cannot be applied to all components. Accounting measurement and prudential capital treatment must remain distinguishable even when linked through eligible offsets.",
          "rubric": ["Identify the wrong base and absent eligibility/regime.", "Reject universal halving without an applicable method.", "Separate prudential deduction from accounting journal and note calculation scope."]
        },
        {
          "id": "prudence-scenario",
          "type": "scenario",
          "prompt": "Two teams propose a USD 9,000 model-risk amount and a USD 6,000 market-price-uncertainty amount for the same exposure. Their notes both mention an illiquid correlation input, but neither explains which uncertainty is covered. Should the system add, offset or remove either amount? State conditional possibilities and the evidence needed; no final AVA can be calculated from these facts.",
          "answer": "Do not choose an arithmetic treatment yet. If the amounts cover genuinely distinct uncertainty sources, both may contribute under the applicable method. If they overlap, the allocation and method need correction to avoid duplication. Obtain the exposure definition, uncertainty decomposition, baselines, methodology and relevant offset/aggregation rules.",
          "reasoning": "Shared wording is not proof that two risks are identical, while two different labels are not proof that they are independent. Arbitrary netting or automatic summation can both misstate the result. Any missing-data or calculation fallback must follow the applicable rule and governed assessment, not a made-up zero.",
          "rubric": ["Present conditional distinct-source and overlap outcomes.", "Request evidence defining what each amount measures.", "Avoid a fabricated final total or unapproved offset."]
        }
      ]
    },
    {
      "id": "working-knowledge",
      "title": "Working knowledge",
      "lessonIds": [16, 17, 18],
      "tasks": [
        {
          "id": "working-numeric",
          "type": "numeric",
          "prompt": "For a bank's long asset, opening dirty value is USD 1,010,000, closing dirty value is USD 1,005,000, and coupon cash received during the period is USD 8,000. There are no trades, FX effects, expenses or other cash flows. Calculate the simplified economic return in USD; do not infer its accounting presentation.",
          "numericAnswer": 3000,
          "tolerance": 0.01,
          "answer": "+USD 3,000.",
          "reasoning": "1,005,000 − 1,010,000 + 8,000 = 3,000. The USD 5,000 fall in value is only one part of return; ignoring the coupon produces a false loss conclusion. The exercise supplies economic cash-flow arithmetic, not all facts needed for financial-statement classification.",
          "rubric": ["Calculate the negative USD 5,000 value movement.", "Include positive USD 8,000 coupon cash once.", "Distinguish economic return from an unsupported accounting-presentation claim."]
        },
        {
          "id": "working-explain",
          "type": "explain",
          "prompt": "At inception the bank pays USD 100 to buy an asset with a model fair value of USD 103. In a separate transaction it receives USD 100 when issuing a liability whose model fair value is USD 103. Explain the apparent day-one result from the bank's perspective for each. Observable-evidence facts needed for the accounting recognition test are not supplied.",
          "answer": "Buying the asset produces an apparent USD 3 gain: asset value 103 less cash paid 100. Issuing the liability produces an apparent USD 3 loss: cash received 100 less liability value 103. These differences do not alone establish immediate accounting recognition; the relevant evidence test must be applied.",
          "reasoning": "The same pair of numbers has opposite implications for an asset purchase and a liability issuance. A customer's payment is not proof of a bank gain. Nor does a model number or a hierarchy label alone settle day-one recognition or deferral.",
          "rubric": ["Identify the asset gain and liability loss with bank perspective.", "State which cash flow and balance-sheet item belong to the bank.", "Separate apparent arithmetic from recognition and request supporting evidence."]
        },
        {
          "id": "working-diagnose",
          "type": "diagnose",
          "prompt": "Yesterday's signed-off run used position snapshot P1, quote snapshot Q1 and method M1. A rerun today reads the latest live positions and quotes, then appends a second journal for the same business event. The developer says it reproduces yesterday because the report date is unchanged. Identify the reproducibility and posting failures and propose controls.",
          "answer": "The rerun does not reproduce yesterday's inputs, and appending the same logical journal breaks idempotency. Pin P1, Q1 and M1 plus relevant overrides/approvals and timestamps; record a run identifier and stable business posting key. A corrected run should have an explicit revision/reversal process rather than silently duplicating postings.",
          "reasoning": "A report date is not an input snapshot. Even numerically identical output can create a business error if posted twice. Deleting all prior output indiscriminately would remove the audit trail rather than establish controlled revision.",
          "rubric": ["Identify both changing inputs and duplicate business effects.", "Specify snapshot, method and approval lineage.", "Propose a stable posting key and traceable correction process."]
        },
        {
          "id": "working-scenario",
          "type": "scenario",
          "prompt": "A model values a newly acquired bank asset above the cash paid. Case A has a qualifying quoted price supporting the difference, or a valuation using only observable market data. Case B relies on an unsupported unobservable assumption. Explain how the recognition investigation differs. You have no approved later release schedule or subsequent events.",
          "answer": "Case A provides the type of evidence relevant to immediate recognition under the day-one test, subject to verifying it actually meets the applicable criteria. Case B requires the prescribed deferral treatment rather than recognition based solely on the model. Do not invent a later release schedule; record the original difference and assess relevant subsequent changes under the applicable requirements.",
          "reasoning": "A positive apparent gain is not its own evidence. Conversely, a model is not automatically disqualified when it uses only observable data under the relevant criterion. Straight-line release because it is easy to code is not a supplied accounting basis.",
          "rubric": ["Distinguish qualifying observable evidence from the unsupported assumption.", "Separate the initial decision from later recognition events.", "Avoid treating Level 3 status or an invented time schedule as the complete recognition rule."]
        }
      ]
    }
  ],
  "revision": [
    {
      "id": "revision-price-units",
      "type": "numeric",
      "prompt": "Return to this after a break, without opening the worked examples. A long bond has USD 6m face amount. FO clean price is 99.80 and the independent clean price is 99.65 per 100. Accrued interest is identical in both valuations. Calculate independent-minus-FO IPV difference in USD.",
      "numericAnswer": -9000,
      "tolerance": 0.01,
      "answer": "−USD 9,000.",
      "reasoning": "6,000,000 × (99.65 − 99.80) / 100 = −9,000. The 0.15 price-point difference is 0.15% of face. Identical accrued interest cancels; adding it again distorts the comparison. The difference remains a diagnostic until investigated.",
      "rubric": ["Preserve the long-position sign and comparison order.", "Use the per-100 scaling.", "Explain why equal accrued interest cancels and why this is not posting authority."]
    },
    {
      "id": "revision-separate-outputs",
      "type": "explain",
      "prompt": "A record shows IPV difference −USD 9,000, accounting dirty value USD 5,975,000, hierarchy Level 2 and a supplied final AVA USD 2,000. Explain in one sentence per field what question it answers. No additional accounting deduction or aggregation should be inferred.",
      "answer": "IPV difference compares independent and FO values. Accounting dirty value is the recognised value including accrued interest under the stated convention. Level 2 describes the significant-input evidence supporting the measurement. The supplied final AVA is a prudential capital deduction result under its applicable method.",
      "reasoning": "The four fields measure different things. The IPV difference is not automatically the accounting adjustment; Level 2 does not mean no uncertainty; the AVA is not automatically another accounting deduction from the supplied dirty value.",
      "rubric": ["Give four distinct explanations.", "Identify dirty value's accrued-interest convention.", "Avoid equating hierarchy, comparison, accounting measurement and capital deduction."]
    },
    {
      "id": "revision-join-error",
      "type": "diagnose",
      "prompt": "One position row has a USD 5m value. A quote table contains three observations for that instrument. A join produces three position rows, and a dashboard now reports USD 15m. The developer proposes dividing every dashboard total by three. Diagnose the issue and outline a correction that preserves the evidence.",
      "answer": "A one-to-many join duplicated the position measure. Keep a separate relation for multiple evidence observations, or select the intended as-of quote using a documented rule before joining into a one-row-per-position valuation view. Reconcile position keys and totals before and after the join.",
      "reasoning": "Dividing by three only happens to reverse this example and fails when quote counts vary. Deleting quotes indiscriminately loses useful evidence. The correction must respect the intended data grain and quote-selection logic.",
      "rubric": ["Identify the mismatch between position grain and evidence grain.", "Reject a blanket divide-by-three fix.", "Preserve evidence and reconcile one-position value of USD 5m."]
    },
    {
      "id": "revision-evidence-change",
      "type": "scenario",
      "prompt": "A Level 2 measurement now uses a proxy because the original input source stopped publishing. The proxy produces almost the same value. You have no current assessment of the proxy's observability, relevance or significance. Can the level and evidence status remain unchanged? Describe the possible outcomes and investigation.",
      "answer": "An unchanged value does not justify unchanged classification or evidence status. Level 2 may remain supportable if relevant observable evidence supports all significant inputs. Level 3 may be required if a significant input is unobservable. Investigate proxy mapping, current corroboration, significance and approval; retain unresolved status until the assessment supports a decision.",
      "reasoning": "Numerical closeness is not evidence equivalence. A proxy is neither automatically invalid nor automatically observable. The price comparison, hierarchy assessment and governance of a source change are related but distinct controls.",
      "rubric": ["Reject unchanged price as sufficient evidence.", "Describe conditional Level 2 and Level 3 outcomes.", "Specify proxy relevance, observability, significance and governance checks."]
    },
    {
      "id": "revision-bridge",
      "type": "numeric",
      "prompt": "A long asset's raw clean value is USD 2,500,000. An approved correction reduces it by USD 12,000, and a separate approved accounting deduction reduces it by USD 7,000. Signed accrued interest is +USD 9,000. Calculate accounting dirty value in USD. A separately supplied prudential amount is not an accounting journal and must not be subtracted here.",
      "numericAnswer": 2490000,
      "tolerance": 0.01,
      "answer": "USD 2,490,000.",
      "reasoning": "2,500,000 − 12,000 − 7,000 + 9,000 = 2,490,000. Corrected clean value is 2,488,000; accounting clean value is 2,481,000. Adding accrued interest once produces dirty value. Subtracting a prudential amount again would mix accounting and regulatory outputs.",
      "rubric": ["Apply the correction and separate deduction once each.", "Add signed accrued interest once.", "Keep the separately supplied prudential output outside this accounting bridge."]
    },
    {
      "id": "revision-day-one-perspective",
      "type": "diagnose",
      "prompt": "A note says: 'The bank receives USD 100 from issuing a liability with model fair value USD 103; therefore the bank earns USD 3 immediately.' Identify the two separate conclusions that need correction.",
      "answer": "First, the bank's apparent arithmetic result is a USD 3 loss: proceeds 100 less liability value 103. Second, immediate recognition of the day-one difference cannot be concluded without the relevant evidence and accounting criteria.",
      "reasoning": "The counterparty's apparent favourable difference cannot be imported as the bank's gain. Fixing that sign does not resolve the separate recognition test. A statement of model fair value supplies neither qualifying observable evidence nor a justified later release rule.",
      "rubric": ["Identify liability issuance and bank perspective.", "Correct the apparent result to a USD 3 loss.", "Separate sign correction from recognition/deferral and identify missing evidence."]
    }
  ]
}
;
