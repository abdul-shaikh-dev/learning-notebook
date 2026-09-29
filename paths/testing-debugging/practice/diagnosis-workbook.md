# Observe, explain, then repair

Python 3.11+. Download the complete kit and run commands from its extracted folder. All examples use synthetic data. Work through the predictions before opening the references.

## 1. Step through a real defect

Contract: sum entries from index zero **through** `stop`. For `[4, 8, 16]`, stop 1, predict 12. Run `python diagnosis_lab.py`: it prints 4 and labels the defect deliberately.

Start `python -m pdb diagnosis_lab.py`. At `(Pdb)`, enter:

```text
break inclusive_total_mutant
continue
args
p values
p stop
p values[:stop]
where
next
```

The slice is `[4]`: Python excludes the end index. `where` shows the caller; the input itself is valid. Use `quit` to leave (pdb may offer to restart after program exit). Compare with `inclusive_total`, which includes `stop + 1` and validates the index. Do not fix the example by changing the expected answer to 4.

Run `python -m unittest -v test_diagnosis_lab.DiagnosisTests`. The regression distinguishes the mutant; boundary tests also cover the first and last indices. Transfer: predict the result for `[3, 9, 20]`, stop 2, and add an independent expected-value assertion. Explain why changing only the displayed message would not fix the function.

## 2. Cancel only after the resource is acquired

```text
acquired → started event → wait for release → committed
                            │ cancellation
                            └──────────────→ finally: released
```

Run `python -m unittest -v test_diagnosis_lab.CancellationTests`. The test waits on a readiness event before cancellation, so it does not race cancellation against startup. The two-second timeout is a deadlock guard, not evidence about speed. The final assertions require cancellation to propagate, no commit, and exactly one release. A separate successful run must commit and release.

In a copy, move cleanup out of `finally`: predict which test fails and why. Catching and suppressing `CancelledError` would violate the cancelled-task assertion. This lab models a single synthetic resource; it does not establish cleanup after process termination or repeated cancellation during an asynchronous cleanup operation.

Continue structured sibling-failure practice in the Python path's TaskGroup lab. Component and API tests live in the React and .NET kits; compare their boundaries with this local coroutine test.

## 3. See why all lines is not all paths (optional tool)

Use a disposable virtual environment if installing coverage. Standard-library tests work without it. Review the official coverage documentation before installation.

```text
python -m venv .venv
.venv\Scripts\python -m pip install coverage==7.16.2
.venv\Scripts\python -m coverage run --branch --source=branch_subject -m unittest test_branch_lab.PositiveOnly
.venv\Scripts\python -m coverage report -m
.venv\Scripts\python -m coverage run --branch --source=branch_subject -m unittest test_branch_lab.BothDirections
.venv\Scripts\python -m coverage report -m
```

On macOS/Linux replace `.venv\Scripts\python` with `.venv/bin/python`. First run: every statement executes, but the false direction of `minutes > 0` is missing; expect a partial branch. Second run: both directions are covered. Each `coverage run` replaces the previous measurement. Neither proves correct labels: a test with no assertions could execute the same branches. The synthetic function assumes a numeric input; validation belongs to a separate contract.

## 4. Measure a bounded optimization

Run `python diagnosis_lab.py --benchmark`. It reports all samples and medians for 2,000 unique rows and 200 queries. Both implementations first match independently calculated expected results; dictionary construction stays inside the timed call. Warm-ups reduce first-call effects. Run again and record interpreter, machine, dimensions and both sample distributions.

Prediction: repeated scans do up to rows × queries work; indexing costs roughly rows + queries, with extra memory. Try `python -c "from diagnosis_lab import benchmark; print(benchmark(2000, 1))"`. With one query, construction can cost more than a scan. Do not make a speed threshold a correctness test or infer server throughput from this local closed-loop measurement. Duplicate keys would change the two implementations' semantics; this fixture explicitly uses unique keys.

## Completion evidence

Record: debugger observation, the regression that fails for the mutant, cancellation event order, optional missed branch, and benchmark dimensions/results. Explain one limit for each. These are four separate kinds of evidence.

Sources: [pdb](https://docs.python.org/3/library/pdb.html), [async cancellation](https://docs.python.org/3/library/asyncio-task.html#task-cancellation), [branch coverage](https://coverage.readthedocs.io/en/latest/branch.html), [perf_counter](https://docs.python.org/3/library/time.html#time.perf_counter).
