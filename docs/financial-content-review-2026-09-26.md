# Financial learning book — content review

Reviewed 26 September 2026 against commit 114f057. Review only: the teaching material and live site have not been changed by this review.

## Verdict

A useful orientation for technology/data colleagues, with strong treatment of signs, evidence quality, data lineage and the distinction between accounting and regulatory outputs. It is not yet a complete beginner-to-working-competence book. One example has a substantive perspective/sign error. Most other findings are missing explanations, exercises or reference material rather than incorrect arithmetic.

Scope: all six introductions, 18 main lessons, 67 glossary entries, formula reference, seven lab definitions and calculation functions, six-stage month-end case, CSV/answer key, and the handbook generator. Existing automated checks passed. Independently recomputed all six CSV differences using decimal arithmetic. Source checking covered IFRS fair-value/day-one principles, Basel IPV guidance and selected EU/UK prudent valuation provisions. This is a learning-content review, not certification of every current jurisdictional rule.

## Findings, in priority order

### 1. High — Day-one gain example reverses or leaves unclear the bank's perspective

Location: content/curriculum.js:109, lesson16.

The customer pays100 for an instrument the bank's model values at103, but the sentence calls the difference a3-unit gain. For a bank issuing a liability valued at103 for proceeds100, that is an apparent loss of3. For a bank selling an asset valued at103 for100, the stated numbers also do not establish a gain of3. The buyer's apparent bargain cannot silently become the seller's gain.

Correction: use 'The bank pays100 to acquire an asset with model fair value103; the apparent day-one gain is3, subject to the recognition test.' Add the opposite liability example and explicitly identify whose asset, liability and cash flow are shown. Separate the arithmetic from recognition/deferral. The following paragraph's warning that Level3 does not automatically determine day-one treatment is good.

Source: IFRS9 B5.1.2A, https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2021/issued/part-a/ifrs-9-financial-instruments.pdf .

### 2. Medium — The beginner ramp stops before the concepts needed in the main course

Locations: content/starter.js:27–63; content/curriculum.js:18–35,54–59,78–89.

The introductions successfully explain trades, books, quantities and simple share P&L. Lesson3 then compresses discount factors, curves, swaps, credit spreads, implied volatility, surfaces, correlation, DV01 and vega into one lesson. Later discussions introduce collateral, netting, CET1, RWA and probability without equally concrete foundations. Definitions are present, but recognizing a definition is different from understanding the mechanism.

Add short prerequisite examples: a bond cash-flow timeline and why rates affect its price; one fixed/floating swap payment; an option payoff versus its current value; collateral and netting with two obligations; a balance-sheet-to-capital illustration; and a visual percentile explanation before the uncertainty lab. These can be optional foundation sections so experienced readers can skip them. Expand the capital examples without implying that accounting equity and CET1 are identical.

### 3. Medium — Regulatory formulas are shown before their symbols and sequence are taught

Location: content/curriculum.js:102–107, lesson15.

APVA, FV, PV and EV appear in aggregation expressions without local definitions or a worked calculation. FV could be confused with the accounting bridge's adjusted value, and PV with present value from lesson3 rather than prudent value. The source caveat is correct but cannot supply the missing teaching step.

Define each symbol in the applicable Annex method; show its baseline and prerequisite offsets. Add a small, explicitly scoped example for each method and a separate category-aggregation diagram. The existing capital lab takes an already-final AVA, so it does not fill this gap. Preserve the explicit warning that the case's14k is pre-aggregation and is not a final regulatory AVA.

### 4. Medium — Data-poor core-method fallback is absent

Locations: content/curriculum.js:84–89,96–107.

The material discusses poor evidence and expert judgement but omits the specific fallback in Article7(2)(b) where AVAs cannot be determined under Articles9–17. A learner can therefore understand missing IPV evidence without learning what happens when the standard prudent valuation calculation cannot be performed.

Add a short decision branch distinguishing missing-data investigation, approved expert-based methods and the prescribed fallback. Teach governed escalation and the applicable conditions, rather than introducing a generic zero or ad hoc percentage. This is a coverage gap, not a claim that the existing course explicitly recommends zero.

Source: EU2016/101 Article7, https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A02016R0101-20200626 .

### 5. Medium — The 'full handbook' is not the complete learning pack

Location: handbook.html:3; assets/js/app.js:45–68; practice/answers.md.

The printable handbook includes lessons, their checkpoints, glossary and formulas. It does not reproduce the seven labs' guided experiments, the full six-stage case, or the practice population and answer key. Lesson18 summarizes the case but is not equivalent to the exercise. A saved PDF therefore loses material needed for the user's free-time/offline study.

Add print-friendly lab input/output examples, the entire case, CSV dictionary and exercises. Put answers in a separate appendix so a reader can try the problems before seeing solutions. Either include everything or label it 'lesson handbook' and provide a complete study-pack download.

### 6. Medium — Checkpoints test recognition more than independent understanding

Locations: quizzes across content/curriculum.js and content/starter.js; case questions in assets/js/app.js.

Each lesson has one multiple-choice question, commonly with implausible distractors. Lesson16 is about day-one recognition but its checkpoint tests coupon return instead. Readers can mark lessons complete without demonstrating the main learning objective. That is acceptable progress tracking, but should not be presented as mastery.

For each module add: one unaided numerical problem, one explanation in the learner's own words, one diagnose-the-error task, and a scenario where more than one answer is defensible depending on evidence. Give reasoning for wrong answers. Add a day-one recognition checkpoint and delayed mixed-topic revision. Keep completion voluntary, but distinguish read, practised and checked understanding.

### 7. Medium — Fair-value reporting coverage is thinner than the lesson title suggests

Location: content/curriculum.js:72–77, lesson10.

The hierarchy classification teaching is sound, but reporting focuses on population reconciliation. Add a compact Level3 roll-forward and a sample disclosure record showing techniques, significant unobservable inputs and sensitivity information where applicable. That connects classification to an actual technology/reporting deliverable.

Source: IFRS13 paragraph93, corroborated through the Australian standard setter's IFRS-aligned text (excluding Australian-specific provisions): https://standards.aasb.gov.au/aasb-13-dec-2022 . This is additional learning scope, not a claim that every disclosure applies identically to every instrument.

### 8. Lower — A few important boundary conditions need explicit examples

Location: content/curriculum.js:24–29 and102–107.

Fair-value market selection explains the principal market but not the most-advantageous-market fallback when no principal market exists. Add one two-venue example, preserving the distinction between choosing a market and measuring the price. Source: IFRS-aligned AASB13 paragraphs16–26, https://standards.aasb.gov.au/aasb-13-dec-2022 .

The simplified EU approach gives the threshold and rate but leaves eligibility to 'specific rules'. State the strict less-than threshold, illustrate exactly-matching exclusions and give the breach/escalation timeline in an advanced box. This is a deliberate simplification that should be expanded before the material is used for implementation. Source: EU2016/101 Articles4–6.

### 9. Lower — Source accessibility and claim traceability need maintenance

Location: content/curriculum.js:2–15 and lesson source lists.

Sources are mostly primary and dated versions are honestly labelled. However, the detailed IFRS13 PDF redirected to sign-in during this review. That is an access limitation, not evidence of a broken standard or incorrect lesson. Provide a stable standard landing page and paragraph references alongside any gated PDF. Identify the paragraph/article supporting each technical subsection instead of relying on a whole-standard link.

Retain the good distinction between consultation, enacted rule and future effective date. Maintain a source register with rule version, checked date and change trigger. This review did not establish a fresh legal consolidation for every rule as of the edition date.

## What checked out

- The six CSV rows produce differences of -30k, -25k, +20k, missing, -24k and -30k. The exactly-at-threshold row correctly has no amount breach under the stated toy rule; stale evidence remains unverified.
- The case reconciles:19.96m FO clean →19.93m corrected clean →19.92m after bid-offer →19.96m dirty after40k accrued. The equality of the first and last numbers is coincidental, not an arithmetic error.
- The supplied16k close-out requirement less10k same-source deduction gives6k; adding supplied8k MPU gives14k before aggregation, clearly labelled.
- The1.28155 multiplier is appropriate for the stated one-sided normal illustration. The lab explicitly avoids claiming that a few quotes establish a distribution or a regulatory AVA.
- Bid/ask conventions, significant-input hierarchy, reserve balance versus movement, missing evidence versus zero, and the limits of notional-based comparisons are handled carefully.
- Basel's independent unit and at-least-monthly IPV description is accurately reflected: https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15 .
- The EU/UK separation and warnings against using a consultation as law are valuable. The operational-risk AMA mismatch is presented as unresolved rather than falsely resolved by a rejected Q&A.

## Recommended revision sequence

1. Correct the day-one perspective and add paired asset/liability checks.
2. Extend beginner foundations and explain aggregation notation.
3. Add regulatory fallback and reporting examples with precise source references.
4. Create module-level applied exercises and a complete printable study pack.
5. Recheck source access and rule versions, then review the revised examples independently.

The material is worth building on. Its strongest quality is teaching readers to ask what a number represents and what evidence supports it. The next revision should turn that good orientation into demonstrated problem-solving ability, without pretending the educational calculators implement a bank's production methodology.

Source-check limitations: EBA Q&A2025_7506 returned403 for the regulatory reviewer, so its rejection status was not independently reverified. The EBA RTS status page still described the targeted revision as ongoing; no enacted replacement was located in this review. Status source: https://eba.europa.eu/activities/single-rulebook/regulatory-activities/market-counterparty-and-cva-risk/regulatory-2?version=2024 . UK checks used https://www.prarulebook.co.uk/-/media/pra/files/legal-instruments/2021/pdf/pra2021-13.pdf and https://www.bankofengland.co.uk/prudential-regulation/publication/2026/january/restatement-of-crr-requirements-final-policy-statement .
