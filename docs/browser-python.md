# Browser Python practice

The 30 Python Problem Solving challenges have a plain text editor, Run tests, Stop and a code download. Drafts and not-started/attempted/solved status are stored separately from reading progress. They participate in the existing preview-and-merge progress backup. Local entries win merge conflicts. Editing code changes its status to attempted; users may update status after local practice. A solved status is personal tracking, not a certificate or hidden-judge result.

Each attempt runs in a fresh worker using the pinned, self-hosted Pyodide 0.28.2 core distribution. It executes real CPython against the same cases.json as the terminal runner, checks exact return types and preserves inputs. It catches Python exceptions including SystemExit. The host terminates the worker after five seconds of execution, on Stop, and when leaving the lesson. Runtime startup has a separate 60-second timeout. Results from an old worker cannot update another lesson. Printed output is suppressed to avoid unbounded output buffers.

## Python course starters

The Python course's starter code is an editable block with Run, Stop and Reset to starter. It uses the same worker in `mode:'run'`: the code runs as a script named `main.py` with `__name__ == '__main__'`, with no tests. Printed output and stderr are shown up to 20,000 characters, then cut with a note. Tracebacks keep only the learner's own frames. `sys.exit(0)` counts as success; another exit status is reported. `input()` has no standard input and explains why. The same five-second and 60-second limits, Stop and cleanup on leaving the lesson apply. Edits are kept in `sessionStorage` for the tab, are not part of progress backups, and Reset restores the starter.

Two lessons set `exercise.runLocally` with a reason and keep the static, copyable block: `modules-and-environments` needs two files, and `concurrency-models` uses `asyncio.run`, which needs WebAssembly stack switching. Print packs always show the static block. `tests/browser-python.cjs` runs all 21 other reference solutions in run mode against the real runtime, plus output, exit, stdin and traceback cases. `tests/python-runner.cjs` covers the editor.

## Python course lesson examples

The Python course sets `runExamples`, so 25 of its 27 lesson examples have Run and Edit, as in Design Patterns, Data Structures & Algorithms and Practical Maths & Statistics. Each runs unchanged in run mode, and `tests/browser-python.cjs` checks that its printed output matches its `# Expected output:` block, or that it checks its result with `assert`. The `concurrency-models` and `robust-import-capstone` examples use `ThreadPoolExecutor`; the runtime cannot start threads, so they set `exampleRunLocally` and stay static, highlighted Python with that reason below them. The test runs both and requires the thread error, so if the runtime ever gains threads the test fails and both can be made runnable.

The Python course's offline download includes the runtime files published by Python Problem Solving. The service worker serves a file listed by several courses from any saved owner.

## Data analysis examples stay static

Data analysis with Python shows each lesson's worked example as a highlighted, copyable code panel ending in an `# Output:` block, but has no Run button. Running them in the browser would need NumPy and pandas, with python-dateutil, pytz and six, loaded into the bundled runtime: an estimated 10 MB more to fetch and to save for offline use, on top of the 12 MB runtime. The pinned Pyodide 0.28.2 also ships NumPy 2.2.5 and pandas 2.3.1, not the course's pinned NumPy 2.5.3 and pandas 3.0.6, so its printed output could differ from what the lessons state. The examples are checked instead by `tests/data_analysis_examples.py` in the `data-science` CI job, which runs each one with the pinned libraries in a copy of the practice folder and fails if the printed output differs from the lesson.

## Runtime and offline use

The first browser run fetches approximately 12 MB of runtime assets from this notebook's own host. Runtime files live with the course, outside the global offline shell. Saving Python Problem Solving in Offline & install includes the runtime, cases and lessons in the existing hash-verified course download. No external package installation is implemented. No account, API key, LLM or execution server is needed. The worker is an isolation mechanism for responsiveness, not a security boundary for hostile code; Python's JavaScript bridge exists. The notebook itself does not send draft code to a remote judge.

Source URLs and SHA-256 hashes for the unmodified runtime binaries are in runtime/provenance.json; the upstream license is beside them. Runtime integration follows the [Pyodide worker documentation](https://pyodide.org/en/0.28.2/usage/webworker.html) and [self-hosting documentation](https://pyodide.org/en/0.28.2/usage/downloading-and-deploying.html). Future updates must refresh the files, provenance and license together and rerun the actual WebAssembly checks.

Verification commands:

```
node verify.cjs
node tests/browser-python.cjs
python scripts/sync-problem-solving.py --check
python scripts/build-bundles.py --check
node scripts/build-pages.cjs
```

The WebAssembly test executes all 30 references and rejects wrong values, types, input mutation, missing functions, syntax errors and SystemExit. UI tests cover state, stopping, stale results, navigation cleanup and storage failures. Browser checks additionally exercise real runs, timeout recovery, saved drafts, responsive controls and the offline course download. A finite case set does not prove arbitrary solution correctness or asymptotic efficiency.

Verified on 2 October 2026: saved the complete course on a separate local preview origin, stopped that HTTP server, opened the cached lesson and ran a correct solution successfully. An infinite loop on the regular preview stopped after five seconds and a subsequent correct attempt passed. Drafts survived reload, solved status appeared in the course overview while reading stayed at zero, and controls were inspected in light/dark modes on desktop and tablet. The mobile viewport was checked separately for overflow and reachable controls.
