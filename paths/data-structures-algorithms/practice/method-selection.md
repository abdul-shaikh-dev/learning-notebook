# Method selection laboratory

Run `python -m unittest -v test_method_selection.py` beside the existing algorithms.py and advanced_algorithms.py. Four test methods compare different objectives and independently check 130 coin cases.

First compare the direct edge from A to B, which costs 9, with the route through C, whose two edges cost 1 each. BFS finds the one-hop route. Weighted shortest-path search finds the route costing 2. Then make a target of 6 using coins worth 1, 3 and 4. Greedy selection uses three coins; dynamic programming finds two. Coins worth 4 and 6 cannot make 3. Any denomination set can make 0 using no coins.

For an independent extension, implement the one-discount route problem described in Algorithm review. Return minimum cost or None. Treat discount availability as part of state; allow using it at most once. Compare against exhaustive simple state paths for tiny graphs. The new problem is not solved by the reference and is not included in its passing checks.

The provided graph functions assume their documented finite graph/weight contracts. This lab does not benchmark huge targets or certify an asymptotic proof from timings.
