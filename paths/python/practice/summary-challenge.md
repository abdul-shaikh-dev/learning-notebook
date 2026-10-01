# Build a session summary

Create `my_summary.py` beside this guide. Export `summarize(rows)` and use only the standard library. Start from an empty file; the reference is optional.

Each row has exactly `id`, `topic`, `minutes`. IDs are nonempty strings unique within the batch. Trim topics, reject blank topics, accept only integer minutes 0..1440 (not booleans). Reject invalid input with ValueError. Return `(topic, total)` pairs sorted by descending total then topic alphabetically. Do not modify input. Empty input returns `[]`.

Input: a/Python/20, b/SQL/30, c/Python/10. Output: `[('Python',30),('SQL',30)]`. A second row with ID a is rejected even if its contents match. A separate valid ID with the same topic counts normally.

Run `python summary_checks.py my_summary`. Five test methods cover several cases. Run `python summary_checks.py` to check the separate reference. Tests are executable feedback; no written submission is required.

After it passes, add a minimum-total filter without changing the default behavior. Check threshold 30 keeps both topics, 31 keeps neither, and zero still includes a zero-minute topic. This extension is intentionally not implemented by the reference. No persistence, concurrency or service guarantee is implied.
