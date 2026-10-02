# Build a session summary

Create `my_summary.py` beside this guide. Export `summarize(rows)` and use only the standard library. Start from an empty file; the reference is optional.

Each row has exactly the fields `id`, `topic` and `minutes`. IDs must be nonempty strings unique within the batch. Trim topics and reject blank topics. Accept integer minutes from 0 through 1440, excluding booleans. Reject invalid input with ValueError. Return `(topic, total)` pairs sorted by descending total then topic alphabetically. Do not modify input. Empty input returns `[]`.

Use three rows: ID a with Python and 20 minutes, ID b with SQL and 30 minutes, and ID c with Python and 10 minutes. The expected output is `[('Python',30),('SQL',30)]`. A second row with ID a is rejected even if its contents match. A separate valid ID with the same topic counts normally.

Run `python summary_checks.py my_summary`. Five test methods cover several cases. Run `python summary_checks.py` to check the separate reference. Tests are executable feedback; no written submission is required.

After it passes, add a minimum-total filter without changing the default behavior. Check threshold 30 keeps both topics, 31 keeps neither, and zero still includes a zero-minute topic. This extension is intentionally not implemented by the reference. This exercise does not implement persistence, concurrency control or a service.
