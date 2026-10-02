# Data analysis practice

These are fictional completed support tickets, one row per ticket. Start with projects.md before reading analysis.py. The scripts are complete references; build your own solution in a separate file and test it with small cases before comparing it.

## Run

Use Python 3.11 or newer for the dataset checks. The pinned analysis libraries require Python 3.12 or newer; the full suite was checked with Python 3.14. No account, GPU or network service is needed to run the analysis. Installing dependencies requires package access once. Reading the lessons and running the dataset checks do not require third-party packages.

From this extracted folder:

```text
python -m unittest -v test_dataset.py
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m unittest -v test_analysis.py
.venv\Scripts\python analysis.py --out report-output
```

On macOS or Linux, replace `.venv\Scripts\python` with `.venv/bin/python`. The tested direct libraries are pandas 3.0.6, NumPy 2.5.3 and Matplotlib 3.11.2. The requirements pin these versions. Transitive dependencies are not fully locked. The report records the versions actually used. After checking a chosen environment, use `python -m pip freeze` to record its full package set if you need to reproduce that environment.

The dataset suite has two tests. The dependency suite has six tests, including invalid inputs, an independently calculated summary, join failure cases and repeatable JSON output. Passing the references does not test your own implementation. Adapt the tests to import your module, or compare independent hand-calculated fixtures first.

The command writes report.json and counts.png under your chosen output directory. It reads input beside the script, so changing the working directory does not select a different dataset. The report has 24 rows, 12 tickets per team and an overall breach rate of 10/24. Chart output needs no display because the script uses the Agg backend. Remove the generated output directory when you no longer need it; do not remove source files.

## Data dictionary

- ticket_id is a unique label, T001 through T024.
- created_date is an ISO calendar date without a timezone, from January 1 through January 24, 2026.
- channel is email or chat, recorded at intake.
- priority is low or high, recorded at intake.
- team is billing or technical, assigned at intake for this exercise.
- customer_messages is a nonnegative whole count of messages supplied at intake. It does not count later messages.
- resolution_hours is the completed duration, unavailable at intake.
- breached is 1 exactly when resolution_hours is greater than 24, and 0 otherwise. Exactly 24 does not breach.

teams.csv has one owner for each team. The owner is fictional and is not a model feature. Required values may not be missing in this kit; extra columns are allowed and ignored by the report. Real data may need a different contract and an explicit quarantine policy.

## Explore and extend

Create a separate copy with a missing duration and explain the denominator you would use for a known-duration mean. Do not silently fill it with zero. Add a histogram of durations, then compare its conclusion with the mean and median. Try threshold rates of 12, 24 and 48 hours while keeping the population fixed.

This small, invented dataset cannot estimate real service performance or support causal claims. The machine-learning path uses a larger separate fictional file with related columns. Do not combine the files as if they were measurements from one service. The prediction task must exclude resolution_hours and breached from its inputs.
