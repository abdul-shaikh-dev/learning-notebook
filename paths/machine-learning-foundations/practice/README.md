# Machine learning foundations practice

This offline lab predicts whether a fictional support ticket will take more than
24 clock hours to resolve. It uses a CPU and needs no GPU, service or API key.
The generator creates 240 records for the ML exercises. The data analysis path
uses a different, smaller fictional table. Their similar column names do not
make their rows or evaluation results interchangeable.

## Run without installing packages

Use Python 3.11 or newer, open a terminal in the extracted folder and run:

```text
python metrics_lab.py
python -m unittest -v test_metrics.py
```

The demonstration reports TP=FP=FN=TN=1, precision=recall=0.5, MAE=3 and
partition sizes 144, 48 and 48. Eleven tests check independent calculations,
zero denominators, malformed inputs, feature selection and split boundaries.
Write your own confusion-count and MAE functions before comparing the reference.

## Run the model on Windows

Use CPython 3.14 for the tested scientific package pins. Initial installation needs Internet
access. All later runs use local fictional data.

```text
py -3.14 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python ml_lab.py
.venv\Scripts\python -m unittest -v test_ml_lab.py
```

On Linux or macOS create the environment with `python3.14 -m venv .venv` and
use `.venv/bin/python` for the remaining commands. Run all commands from the
extracted folder. The five model tests check training-only statistics, unseen
categories, missing numeric inputs, untouched test selection and repeatability.

## Data contract

One generated row represents one completed fictional ticket. `ticket_id` is
unique; `customer_id` repeats across tickets. `created_date` increases by two
days per row. All generated durations are below 48 hours, so labels mature
before the next row. This deliberately simple timing makes the lab's date
splits valid. Real data needs outcome-availability timestamps and often a gap.

`channel`, `priority`, `team` and `customer_messages` describe intake. The count
is the messages in the submitted intake packet, never the later conversation.
`resolution_hours` is the future outcome. `breached` is exactly
`int(resolution_hours > 24)`. Both outcome columns are excluded from inputs.
The selected feature list also excludes IDs and dates.

The generated relationships and random variation were invented for teaching.
No real customer records appear here. Do not use a score on this table as an
estimate of real support performance or as evidence that a feature causes delay.

## What the model does

The first 144 rows train the pipeline. Three expanding time folds inside those
rows demonstrate cross-validation. Numeric imputation and scaling fit inside
the pipeline; categorical inputs use one-hot encoding with unknown categories
ignored. Logistic regression fits the resulting inputs.

The next 48 rows select among thresholds 0.3, 0.5 and 0.7 using the invented
cost `4*false_negatives + false_positives`. Ties choose the higher threshold.
The last 48 rows evaluate that frozen choice and a training-fitted majority
baseline. No model fitting or threshold selection uses the final test labels.

The default command shows development results only. It records the data checksum,
package version, fold scores, threshold and validation mistakes. After freezing
all choices, run `python ml_lab.py --final` with your virtual environment Python
to reveal final-test counts, baseline results and channel slices.
Numerical model scores can differ across environments; the expected contract
is a complete report with valid partitions, not a promised winning score.

This split asks about later tickets from a population with repeated customers.
It does not test unseen customers. To explore the other question:

```python
from metrics_lab import make_tickets, group_split
train, test = group_split(make_tickets(), {'C000', 'C001'})
assert len(test) == 8
assert not ({r['customer_id'] for r in train} & {r['customer_id'] for r in test})
```

This group split separates customers, but it does not enforce chronological
availability. Combining both constraints is an independent extension.

## Projects

1. Calculate the classification and regression examples by hand. Implement your
   metric functions and test empty input, mismatched rows and undefined ratios.
2. Fit the pipeline. Compare `C=0.1` and `C=1.0` using training cross-validation,
   not the final test. Explain why the preprocessing must fit within each fold.
3. Freeze all choices and run `python ml_lab.py --final`. Write a short
   experiment report with the printed hash, split sizes, baseline,
   frozen threshold, errors and limitations. Explain a validation mistake and
   the new data you would need before considering a real pilot.

The source code is a reference solution. Try each project before opening the
relevant function. The lessons contain worked solutions for comparison. If you
change model settings after inspecting the final test, that test is now part
of development; reserve new data for your next final evaluation.

## Sources and version changes

The lesson references use the official scikit-learn 1.9.1 documentation. Package
pins recreate a teaching environment rather than prescribing current versions.
Before upgrading, rerun both suites and review pipeline, encoding and estimator
API changes. No model files or predictions are uploaded or saved by this lab.
