# Testing & Debugging practice

Python 3.11+, standard library only. Keep all files together.

```text
python testing_foundation.py
python testing_integration.py
python testing_concurrency.py
python -m unittest -v test_testing_labs.py
```

Reference outputs

- testing_foundation.py: `5`
- testing_integration.py: `7`
- testing_concurrency.py: `stale edit rejected (1, 8)`

## Limits and safe use

The parser/file/thread references are local and deterministic except the allowed winning thread. Temporary directories isolate file tests; barriers establish race conditions. Replacement is single-writer in a trusted directory, not a power-loss or multi-process transaction. Generated property cases are a finite seeded suite, not Hypothesis or exhaustive fuzzing. The original three-stage suite does not cover browser/E2E deployment or distributed recovery. The additional guided diagnosis kit separately exercises local async cleanup and a bounded benchmark; coverage tooling is optional.

The references implement all three stage baselines. Read project-workbook.md for requirements, rubrics and reference reasoning. Rebuild the small stages yourself, then compare outputs. Keep new exercises separate from supplied verification evidence.

Primary source sections were reviewed on 2026-09-27. Local test results follow; these do not establish unexecuted internet or deployment behavior.

Local verification on 2026-09-27: Python 3.14; 10 regression tests passed. Reference script commands also executed successfully.

## Guided diagnosis extension

Open diagnosis-workbook.md for a real pdb session, event-ordered cancellation cleanup, optional branch coverage, and a measured scan/index comparison. Run `python -m unittest -v test_diagnosis_lab.py test_branch_lab.py`. These are separate from the original historical ten-test verification record.
