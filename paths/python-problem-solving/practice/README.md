# Python problem solving

Thirty original challenges for Python 3.11 or newer. Use any editor and a terminal.
There are no third-party packages, accounts, network calls or browser runtimes.

## Try one problem

1. Extract the ZIP and open its folder in your terminal.
2. Open `solutions.py`. Find the function named in the notebook challenge.
3. Replace its `raise NotImplementedError` with your attempt. Leave other functions alone.
4. Run `python check.py sum-approved` for the first challenge. Use `python check.py --list` to choose another identifier.
5. Inspect any failing input, expected value, returned value or exception. Revise and rerun.

Use `py` or `python3` instead of `python` if that is how you start Python on your system.
The runner resolves files beside `check.py`, so it does not depend on the current working directory.
Return the answer from the function. Do not print it or read from standard input.
Learner print output is suppressed so failure reports remain readable.

The first run should fail until you implement the function. Every starter is deliberately unfinished.
The runner never substitutes the reference if your file or function is missing.

## Hints and comparison

The notebook has three optional hints for each problem. Read one, try again, and reveal another only if useful.
The worked solution explains its reasoning, costs and common mistakes. You do not need identical code.
The first stage uses basic loops and collections. The second introduces reusable patterns.
The final stage mixes practical tasks without naming the intended technique in the title.

`python check.py --all` checks your attempts. Unfinished functions report failures.
`python check.py --all --reference` checks only the supplied `reference.py`, not your work.
`python -m unittest -v test_runner.py test_reference.py` checks the runner and reference suite.

## What the results mean

The cases are visible in `cases.json`. There is no hidden server judge or leaderboard.
The runner checks returned values and types, and that your arguments remain unchanged.
A pass supports those examples; it does not prove correctness for every possible input or establish asymptotic efficiency.
Complexity notes assume bounded integer operations and average-case dictionary/set lookup unless stated otherwise.
Empty inputs, duplicates, equality boundaries, tie ordering and malformed records matter where the problem contract includes them.

Each challenge has a five-second process timeout for accidental hangs. This is not a security sandbox.
Run your own trusted code; it has your normal local permissions. A timeout is a practical guard, not a performance grade.
Exit codes are 0 for passing checks, 1 for a failed test or timeout, and 2 for a setup or usage problem.

## Practise again

Add your own cases to `cases.json`. Keep the documented function contract or write a separate function for a variation.
Variation prompts are optional, with no supplied grading cases. Reading progress is separate from successful execution.
Try one challenge again after a break, or choose a new one. No written worksheet, timer or streak is required.

Keep your edited `solutions.py` somewhere safe. Extract future downloads into a new folder so they do not overwrite your attempts.
