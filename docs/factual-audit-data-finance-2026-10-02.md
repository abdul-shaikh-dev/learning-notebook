# Factual audit: mathematics, data, machine learning and finance

Reviewed 2026-10-02 against baseline `4efaedb`. This ledger covers 87 lesson records: three paths of 21 and finance with six starter lessons plus 18 main lessons. Takeaways, explanations, worked examples, exercises, solutions, checks and quizzes were read. Finance extensions, activity cases, diagrams and workbooks were also read. Each row records a representative claim check, not a verbatim inventory of every sentence.

Evidence distinguishes source-supported concepts from original fictional examples. All 21 mathematics example blocks executed and their outputs were compared with the printed answers. Isolated suites passed: mathematics 20, ML metrics 11, finance 14 and dataset 2. Pinned scientific suites passed: analysis 6 and ML 5. The analysis suite includes the new empty-date/NaT regression cases. Python 3.14 ran the local checks; minimum Python 3.11 compatibility was not separately executed. NumPy 2.5.3, pandas 3.0.6, Matplotlib 3.11.2 and scikit-learn 1.9.1 were installed for scientific checks.

Independent expected-value checks also passed for NumPy reductions, pandas alignment and joins, missingness, scaler output, the CSV shape, normal quantile, and finance JS bond/IPV/bridge/capital/PV/uncertainty calculations. Finance UI regression tests check persistence/routing and are not evidence for accounting validity. Legal claims were compared with the specifically dated provisions below; this is not certification of a bank reporting regime. Direct EUR-Lex and some EBA retrievals were restricted. Official indexed text was used for the RTS, CRR, Annex and EBA questions, with the limitation retained. AASB full text was accessible; only IFRS-aligned paragraphs were used. No paid IFRS edition, current supervisory interpretation, live market calibration or institution policy was verified.

The 2024 EBA consultation and April 2025 minutes were checked through official indexed text. The minutes record postponement, not an adopted amendment. The rejected 2025_7506 question was checked as a rejection, not relied upon as interpretive guidance. PRA 2021/13 and PS 3/26 were retrieved; the latter becomes effective on 1 January 2027. No claim that all later or jurisdiction-specific amendments were exhaustively excluded is made.

## Primary references

- [PY](https://docs.python.org/3.11/library/stdtypes.html)
- [STAT](https://docs.python.org/3.11/library/statistics.html)
- [PROB](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability)
- [EV](https://openstax.org/books/introductory-statistics-2e/pages/4-2-mean-or-expected-value-and-standard-deviation)
- [SAMPLE](https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling)
- [EXP](https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics)
- [CI](https://openstax.org/books/introductory-statistics-2e/pages/8-1-a-single-population-mean-using-the-normal-distribution)
- [DOT](https://textbooks.math.gatech.edu/ila/dot-product.html)
- [MAT](https://textbooks.math.gatech.edu/ila/matrix-multiplication.html)
- [PD](https://pandas.pydata.org/docs/user_guide/10min.html)
- [MISSING](https://pandas.pydata.org/docs/user_guide/missing_data.html)
- [INDEX](https://pandas.pydata.org/docs/user_guide/indexing.html)
- [GROUP](https://pandas.pydata.org/docs/user_guide/groupby.html)
- [MERGE](https://pandas.pydata.org/docs/reference/api/pandas.merge.html)
- [RESHAPE](https://pandas.pydata.org/docs/user_guide/reshaping.html)
- [SCALE](https://pandas.pydata.org/docs/user_guide/scale.html)
- [NP](https://numpy.org/doc/stable/user/absolute_beginners.html)
- [PLOT](https://matplotlib.org/stable/users/explain/quick_start.html)
- [HASH](https://docs.python.org/3.11/library/hashlib.html)
- [LEAK](https://scikit-learn.org/stable/common_pitfalls.html)
- [CV](https://scikit-learn.org/stable/modules/cross_validation.html)
- [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html)
- [LINEAR](https://scikit-learn.org/stable/modules/linear_model.html)
- [PREP](https://scikit-learn.org/stable/modules/preprocessing.html)
- [STANDARD](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html)
- [PIPE](https://scikit-learn.org/stable/modules/compose.html)
- [CURVE](https://scikit-learn.org/stable/modules/learning_curve.html)
- [LOGISTIC](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html)
- [BOND](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds)
- [OPTION](https://www.finra.org/investors/investing/investment-products/options)
- [F13](https://standards.aasb.gov.au/aasb-13-dec-2022)
- [F9](https://standards.aasb.gov.au/aasb-9-dec-2022)
- [BASEL](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15)
- [RTS](https://eur-lex.europa.eu/eli/reg_del/2016/101/oj/eng)
- [ANNEX](https://eur-lex.europa.eu/eli/reg_del/2020/866/oj/eng)
- [UK](https://www.prarulebook.co.uk/-/media/pra/files/legal-instruments/2021/pdf/pra2021-13.pdf)
- [UK2027](https://www.bankofengland.co.uk/prudential-regulation/publication/2026/january/restatement-of-crr-requirements-final-policy-statement)
- [EBA](https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2016_2658)
- [REJECTED](https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2025_7506)
- [CRR](https://eur-lex.europa.eu/eli/reg/2013/575/2026-01-01/eng)
- [QL](https://www.quantlib.org/slides/rate-curves.pdf)

## Lesson ledger

| Path | Lesson | Evidence | Check and result |
|---|---|---|---|
| practical-maths-statistics | `logic-and-conditions` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Truth table, conjunction and De Morgan exercise checked; all four printed cases agree. |
| practical-maths-statistics | `sets-and-overlap` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Intersection Bea; union size 4; inclusion-exclusion exercise 10+8-3=15. |
| practical-maths-statistics | `functions-and-domains` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Input-domain rejection and cost(3)=86; composition order gives 49 versus 19. |
| practical-maths-statistics | `units-and-rates` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | 200 requests / 40 seconds = 5/s. Fixed equal-duration guarantee wording; unequal durations can coincidentally yield the same mean. |
| practical-maths-statistics | `percentages-and-change` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | 100 times 1.2 times .8 = 96; relative change and percentage-point denominators differ. |
| practical-maths-statistics | `powers-and-growth` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Doubling 8 three times gives 64; adding 8 three times gives 32; 5 times 3^4 = 405. |
| practical-maths-statistics | `algebra-and-scaling` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Integer capacity floor gives 6 items costing 20; exercise equation gives q=7. |
| practical-maths-statistics | `mean-median-and-outliers` | [STAT](https://docs.python.org/3.11/library/statistics.html) | Example mean 28, median 10; exercise mean 6, median 3 with tail 18. |
| practical-maths-statistics | `variance-and-spread` | [STAT](https://docs.python.org/3.11/library/statistics.html) | For 2,4,6, population variance 8/3, sample variance 4 and sample SD 2. |
| practical-maths-statistics | `probability-and-complements` | [PROB](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability) | Enumerated two fair flips: at least one head .75; independent three failures .008. |
| practical-maths-statistics | `conditional-probability` | [PROB](https://openstax.org/books/introductory-statistics-2e/pages/3-3-two-basic-rules-of-probability) | Conditioning changes denominator; 8/17 about .470588, not sensitivity 8/10. |
| practical-maths-statistics | `sampling-and-selection` | [SAMPLE](https://openstax.org/books/introductory-statistics-2e/pages/1-2-data-sampling-and-variation-in-data-and-sampling) | All six pair means are 3,4,5,5,6,7 and average 5. Corrected citation from experimental design to sampling. |
| practical-maths-statistics | `expected-value` | [EV](https://openstax.org/books/introductory-statistics-2e/pages/4-2-mean-or-expected-value-and-standard-deviation) | Weighted durations .9*1+.1*11=2. Linearity of expectation does not require independence. |
| practical-maths-statistics | `uncertainty-and-intervals` | [CI](https://openstax.org/books/introductory-statistics-2e/pages/8-1-a-single-population-mean-using-the-normal-distribution) | Known-sigma normal interval [48.04,51.96]; quadrupling n halves SE and margin; coverage is procedural. |
| practical-maths-statistics | `vectors-and-coordinates` | [DOT](https://textbooks.math.gatech.edu/ila/dot-product.html) | Vector sum [3,7], norm sqrt(13); doubled [3,4] has norm 10. |
| practical-maths-statistics | `dot-products-and-scores` | [DOT](https://textbooks.math.gatech.edu/ila/dot-product.html) | Quantity-price dot product 110; exercise dot product 1; orthogonal nonzero vectors cosine 0. |
| practical-maths-statistics | `matrices-and-shapes` | [MAT](https://textbooks.math.gatech.edu/ila/matrix-multiplication.html) | Matrix-vector example [110,170]; 2x3 exercise gives [14,23]; shape validation checked. |
| practical-maths-statistics | `correlation-and-causation` | [STAT](https://docs.python.org/3.11/library/statistics.html) | Perfect positive correlation is 1; constant-input correlation undefined; no causal implication. |
| practical-maths-statistics | `experiments-and-confounding` | [EXP](https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics) | Seeded assignment creates disjoint groups of four; randomisation balances in expectation, not necessarily in one sample. |
| practical-maths-statistics | `feature-scaling` | [STANDARD](https://scikit-learn.org/stable/modules/generated/sklearn.preprocessing.StandardScaler.html) | Population SD scaling uses training statistics; [2,4,6] maps 8 to about 2.44949. |
| practical-maths-statistics | `decision-and-capstone` | [MAT](https://textbooks.math.gatech.edu/ila/matrix-multiplication.html) | Weighted scores .8/.64 change to .65/.7 with equal weights; ranking depends on stated objective. |
| data-analysis-python | `question-and-grain` | [GROUP](https://pandas.pydata.org/docs/user_guide/groupby.html) | Ticket and message grains distinguished; six tickets with two breaches give 2/6, not 2/18. |
| data-analysis-python | `load-and-inspect` | [PD](https://pandas.pydata.org/docs/user_guide/10min.html) | CSV has 24 rows, eight columns and unique IDs; preview cannot establish full-column uniqueness. |
| data-analysis-python | `numpy-arrays` | [NP](https://numpy.org/doc/stable/user/absolute_beginners.html) | Axis sums [5,7,9] and [6,15]; array arithmetic differs from list repetition. |
| data-analysis-python | `types-and-dates` | [PD](https://pandas.pydata.org/docs/user_guide/10min.html) | Zero is a measurement, missing is not; required parsed NaT dates now rejected in reference validator. |
| data-analysis-python | `select-and-filter` | [INDEX](https://pandas.pydata.org/docs/user_guide/indexing.html) | Parenthesised Boolean filters preserve explicit subset denominator; 2/5 high-priority rate .4. |
| data-analysis-python | `missing-and-duplicates` | [MISSING](https://pandas.pydata.org/docs/user_guide/missing_data.html) | Corrected isna() description to Boolean mask; summing counts missing cells; [4,NA,8] mean 6 versus filled mean 4. |
| data-analysis-python | `indexes-and-alignment` | [INDEX](https://pandas.pydata.org/docs/user_guide/indexing.html) | Series add by label; A=12/B=21; loc[5] label differs from iloc[5] position. |
| data-analysis-python | `derive-and-validate` | [PD](https://pandas.pydata.org/docs/user_guide/10min.html) | Strict >24 flags 23.9/24/24.1 as false/false/true; >= counts the boundary. |
| data-analysis-python | `group-and-denominators` | [GROUP](https://pandas.pydata.org/docs/user_guide/groupby.html) | Group rates require weighting by counts; 1/2 plus 1/8 gives 2/10, not 31.25%. |
| data-analysis-python | `joins-and-cardinality` | [MERGE](https://pandas.pydata.org/docs/reference/api/pandas.merge.html) | Duplicate lookup doubles matches; many_to_one rejects duplicates; unmatched coverage checked separately. |
| data-analysis-python | `distributions-and-outliers` | [STAT](https://docs.python.org/3.11/library/statistics.html) | [2,3,4,5,86] has mean 20, median 4; valid extreme is not automatically an error. |
| data-analysis-python | `dates-and-aggregation` | [PD](https://pandas.pydata.org/docs/user_guide/10min.html) | Absent date can be zero only with known complete collection; grouping versus reindexing checked. |
| data-analysis-python | `charts-for-questions` | [PLOT](https://matplotlib.org/stable/users/explain/quick_start.html) | Bars compare category counts; histogram bins durations; generated PNG signature and report counts tested. |
| data-analysis-python | `reshape-for-comparison` | [RESHAPE](https://pandas.pydata.org/docs/user_guide/reshaping.html) | Grouped counts preserve total when unstacked; billing high3/low2 sums5. |
| data-analysis-python | `association-and-comparison` | [EXP](https://openstax.org/books/introductory-statistics-2e/pages/1-4-experimental-design-and-ethics) | Comparing within case-mix groups does not rule out unmeasured confounding or prove intervention effect. |
| data-analysis-python | `validation-functions` | [PD](https://pandas.pydata.org/docs/user_guide/10min.html) | Finite numeric conversion alone cannot validate negative duration; required fields and rule agreement checked. |
| data-analysis-python | `functions-and-tests` | [GROUP](https://pandas.pydata.org/docs/user_guide/groupby.html) | Independent fixture expectations: two tickets, one breach, means 16 and 36; runtime suite passed. |
| data-analysis-python | `chunking-and-weighting` | [SCALE](https://pandas.pydata.org/docs/user_guide/scale.html) | Chunk weighting uses sum/count: 2*10+8*30 over10=26; quiz gives15. |
| data-analysis-python | `reproducible-report` | [HASH](https://docs.python.org/3.11/library/hashlib.html) | Qualified hash equality as practical evidence, not mathematical identity; byte-identical repeat report tested. |
| data-analysis-python | `sensitivity-and-limits` | [PD](https://pandas.pydata.org/docs/user_guide/10min.html) | On 8,24,40,60, strict thresholds12/24/48 give .75/.5/.25; >40 gives .25. |
| data-analysis-python | `handoff-to-modeling` | [LEAK](https://scikit-learn.org/stable/common_pitfalls.html) | Only information available at prediction time may enter intake features; completed-only data has selection limits. |
| machine-learning-foundations | `prediction-question` | [LEAK](https://scikit-learn.org/stable/common_pitfalls.html) | Intake prediction target is later >24h breach; the fictional policy is not measured intervention efficacy. |
| machine-learning-foundations | `features-and-targets` | [LEAK](https://scikit-learn.org/stable/common_pitfalls.html) | Four allowed fields exclude resolution_hours and breached; fixture explicitly supplies intake availability. |
| machine-learning-foundations | `simple-baselines` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | Majority baseline 18/20=.9 accuracy and zero recall; median4 predicts MAE3 for3,9. |
| machine-learning-foundations | `holdout-splits` | [CV](https://scikit-learn.org/stable/modules/cross_validation.html) | 240 rows split144/48/48 in time order; labels mature within48h between intakes. |
| machine-learning-foundations | `classification-metrics` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | TP6/FP2/FN3/TN9 gives precision .75, recall2/3, accuracy .75; undefined denominators represented as None. |
| machine-learning-foundations | `regression-metrics` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | Residual magnitudes2/4 give MAE3, MSE10, RMSEsqrt10; squared loss emphasises large errors. |
| machine-learning-foundations | `class-imbalance` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | 5 positives/100 permits .95 all-negative accuracy; one positive changes recall by .2. |
| machine-learning-foundations | `fit-a-regression` | [LINEAR](https://scikit-learn.org/stable/modules/linear_model.html) | Linear prediction5+2*3=11 and residual4; exercise6+1.5*4=12. |
| machine-learning-foundations | `fit-a-classifier` | [LOGISTIC](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html) | Inclusive .6 threshold on .59/.60/.91 gives0/1/1; probabilities are not guaranteed calibration. |
| machine-learning-foundations | `prepare-features` | [PREP](https://scikit-learn.org/stable/modules/preprocessing.html) | Corrected binary ordinal example to three categories with artificial equal spacing; binary indicator remains valid. |
| machine-learning-foundations | `pipeline-training` | [PIPE](https://scikit-learn.org/stable/modules/compose.html) | Imputation/scaling/encoding fitted inside pipeline on training only; unknown category handling explicit. |
| machine-learning-foundations | `cross-validation` | [CV](https://scikit-learn.org/stable/modules/cross_validation.html) | Fold recall .5/.75/1 averages .75; local TimeSeriesSplit and mature outcomes respect teaching timeline. |
| machine-learning-foundations | `overfitting-regularization` | [LOGISTIC](https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html) | Smaller C means stronger regularisation; selection belongs to training CV, not test evaluation. |
| machine-learning-foundations | `learning-curves` | [CURVE](https://scikit-learn.org/stable/modules/learning_curve.html) | 6/12,8/12,9/12 give .5,2/3,.75; hypothetical curve does not prove adding data will always help. |
| machine-learning-foundations | `leakage-audit` | [LEAK](https://scikit-learn.org/stable/common_pitfalls.html) | No target-derived fields; disjoint ticket IDs are necessary but do not alone prove leakage absent. |
| machine-learning-foundations | `time-and-group-splits` | [CV](https://scikit-learn.org/stable/modules/cross_validation.html) | Time split addresses later tickets; group holdout addresses new customers; shared customers explicitly reported. |
| machine-learning-foundations | `error-analysis` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | Email8/10 and chat1/2 combine9/12; slice uncertainty depends on counts; only validation error rows listed. |
| machine-learning-foundations | `threshold-policy` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | Costs4FN+FP at thresholds .3/.5/.7 are1/5/4; predeclared tie break picks higher threshold. |
| machine-learning-foundations | `reproduce-an-experiment` | [LEAK](https://scikit-learn.org/stable/common_pitfalls.html) | Data/config/version records support repeatability; same seed is not cross-platform bitwise guarantee. |
| machine-learning-foundations | `distribution-change` | [PREP](https://scikit-learn.org/stable/modules/preprocessing.html) | Input checks can precede mature outcome metrics; unknown categories ignored by encoder still require monitoring. |
| machine-learning-foundations | `model-review-capstone` | [METRIC](https://scikit-learn.org/stable/modules/model_evaluation.html) | Corrected instructions to run --final only after freezing; five model tests verify test labels do not select threshold. |
| financial-foundations | `starter-1` | [BOND](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds) | Instrument rights/obligations; bond principal and coupon differ; option right differs from obligation. |
| financial-foundations | `starter-2` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Signed event quantities build holdings; cancellations reverse original event rather than add replacement twice. |
| financial-foundations | `starter-3` | [BASEL](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15) | Internal book/desk grouping is a supplied organisation convention, not proof of legal netting rights. |
| financial-foundations | `starter-4` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Price times quantity gives value; value change plus period cash gives the defined economic result. |
| financial-foundations | `starter-5` | [BASEL](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15) | Independent checking and controls grounded in CAP50.3 and50.7; ownership varies by firm. |
| financial-foundations | `starter-6` | [PY](https://docs.python.org/3.11/library/stdtypes.html) | Trade-record identifiers, units, signed quantity and report scope checked against supplied row. |
| financial-foundations | `lesson-1` | [BOND](https://www.investor.gov/introduction-investing/investing-basics/investment-products/bonds-or-fixed-income-products/bonds) | Per-100 bond pricing, clean/dirty accrued bridge, and derivative notional distinction checked. |
| financial-foundations | `lesson-2` | [F13](https://standards.aasb.gov.au/aasb-13-dec-2022) | Paragraphs16-26/69-71; market example picks principal A102 despite lower net proceeds; no principal gives B101. |
| financial-foundations | `lesson-3` | [QL](https://www.quantlib.org/slides/rate-curves.pdf) | Forecast and discount roles distinct; PV formula checked; swap values -100/-573.50, difference -473.50. |
| financial-foundations | `lesson-4` | [BASEL](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15) | CAP50.7 independent verification at least monthly; comparison starts investigation, not automatic approval. |
| financial-foundations | `lesson-5` | [BASEL](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15) | 20m face times -.15/100=-30k; exactly equal threshold is not strict breach; stale evidence remains unverified. |
| financial-foundations | `lesson-6` | [F13](https://standards.aasb.gov.au/aasb-13-dec-2022) | 10.2m-.1m-.06m-.04m=10m; deduction stock20 to35 contributes -15 to period result. |
| financial-foundations | `lesson-7` | [F13](https://standards.aasb.gov.au/aasb-13-dec-2022) | Counterparty/own-credit and portfolio conditions checked; 100-80-15 residual5 needs supplied enforceability assumptions. |
| financial-foundations | `lesson-8` | [F13](https://standards.aasb.gov.au/aasb-13-dec-2022) | Lowest significant input controls whole-measurement hierarchy; model complexity alone does not imply Level3. |
| financial-foundations | `lesson-9` | [F13](https://standards.aasb.gov.au/aasb-13-dec-2022) | Significance is contextual; no universal numeric materiality rule invented; vendor quote is not proof of observability. |
| financial-foundations | `lesson-10` | [F13](https://standards.aasb.gov.au/aasb-13-dec-2022) | Paragraphs93-95 transfers/disclosure; example rollforward100+20-12-5+4+8-3=112. |
| financial-foundations | `lesson-11` | [CRR](https://eur-lex.europa.eu/eli/reg/2013/575/2026-01-01/eng) | Capital deduction kept separate from accounting journal; 10.2-.2=10, .5-.2=.3 diagnostic residual. |
| financial-foundations | `lesson-12` | [RTS](https://eur-lex.europa.eu/eli/reg_del/2016/101/oj/eng) | One-sided normal quantile illustration checked independently; not treated as empirical regulatory estimate. |
| financial-foundations | `lesson-13` | [RTS](https://eur-lex.europa.eu/eli/reg_del/2016/101/oj/eng) | Half-spread .2 per100 on10m=20k; residual30k-20k=10k before applicable aggregation. |
| financial-foundations | `lesson-14` | [REJECTED](https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2025_7506) | RTS category mapping checked; rejected EBA question supplies no substantive answer resolving historical AMA wording. |
| financial-foundations | `lesson-15` | [ANNEX](https://eur-lex.europa.eu/eli/reg_del/2020/866/oj/eng) | M1=4/M2=5 for supplied998/990/996; strict EU threshold and .1% factor, UK13bn and future2027 text kept distinct. |
| financial-foundations | `lesson-16` | [F9](https://standards.aasb.gov.au/aasb-9-dec-2022) | B5.1.2A evidence test checked; apparent asset+3/liability-3 not automatic recognition; coupon return+3000. |
| financial-foundations | `lesson-17` | [BASEL](https://www.bis.org/committees/bcbs/basel-framework/standard/cap/50/inforce/2019-12-15/published/2019-12-15) | Lineage and idempotency recommendations checked against fixture; matching aggregate does not establish row completeness. |
| financial-foundations | `lesson-18` | [RTS](https://eur-lex.europa.eu/eli/reg_del/2016/101/oj/eng) | 19.93m-.01m+.04m=19.96m; diagnostic6k+8k=14k is explicitly not a final regulatory AVA. |

Additional primary references checked: [DummyRegressor](https://scikit-learn.org/stable/modules/generated/sklearn.dummy.DummyRegressor.html) for the median baseline and [Google monitoring guidance](https://developers.google.com/machine-learning/crash-course/production-ml-systems/monitoring) for distribution-change monitoring. Both are now linked from the relevant lesson.
