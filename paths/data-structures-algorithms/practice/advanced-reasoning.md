# Advanced algorithm reasoning and feedback

Run `python -m unittest -v test_advanced_oracles.py` from this directory. The original reference checks still run when `advanced_algorithms.py` is imported. Use these tests after writing your own solutions too: change the import to your module, keeping the same function contracts.

## Dijkstra invariant and counterexample

Immediately before taking a current minimum distance from the heap, that entry is the cheapest known route through already explored edges. With nonnegative weights, a route through any unprocessed vertex cannot improve a settled minimum: reaching that vertex already costs at least the popped distance, and the remaining edge adds at least zero. A stale heap entry is skipped because a better entry was later inserted.

Trace A→B at 8, A→C at 2, C→B at 1. After A: B=8, C=2. Pop C, improve B to 3. The old B=8 entry remains in the heap but is stale. A plausible wrong algorithm marks B final when first discovered and returns 8. Negative edges break the proof: a later negative edge could improve a settled vertex, so this function rejects them.

The independent small-graph oracle repeatedly relaxes every edge up to V−1 times. Its different selection rule helps find bugs that a second copy of the heap algorithm would share. Zero edges, unreachable vertices, competing routes and a negative-edge rejection are included. The bounded cases do not prove correctness for every graph.

## Knapsack recurrence and counterexample

Let F(i,c) be the best value using only the first i items at capacity c. Then F(i,c)=max(F(i−1,c), F(i−1,c−weight_i)+value_i) when the item fits; otherwise F(i,c)=F(i−1,c). The first branch skips it; the second takes it once. A one-dimensional implementation visits capacities *downward* so `dp[c-weight]` still represents the previous item prefix. With one item (weight 2, value 3) and capacity 4, an upward loop would read its own new value and incorrectly return 6. The correct 0/1 answer is 3.

The oracle enumerates subsets, including the empty subset, so it can check negative values and repeated equal items independently of the recurrence. It is exponential and intentionally restricted to tiny inputs. Try changing the loop direction, then watch the single-item case fail; restore it and add a case whose best choice is two lighter items over one heavy item. Explain the state meaning, recurrence, initialization and traversal order before claiming the solution is correct.

Passing examples alone misses classes of errors: one shortest-path sample may never produce a stale heap entry, and one knapsack sample may not expose accidental item reuse. Keep the input contract in `advanced_algorithms.py` in mind: finite nonnegative graph weights, positive integer item weights and nonnegative integer capacity. These checks are learner feedback, not a correctness proof or a validator for arbitrary untrusted input.
