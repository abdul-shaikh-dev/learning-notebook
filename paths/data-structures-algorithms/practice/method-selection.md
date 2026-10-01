# Method selection laboratory

Run `python -m unittest -v test_method_selection.py` beside the existing algorithms.py and advanced_algorithms.py. Four test methods compare different objectives and independently check 130 coin cases.

First trace A→B cost9 versus A→C→B cost1+1. Expected: BFS one hop, weighted shortest cost2. Then trace target6 using coins1,3,4: greedy3 coins, DP2 coins. Coins4,6 cannot make3, while every denomination set can make0 using zero coins.

Build extension: implement the one-discount route problem described in Algorithm review. Return minimum cost or None. Treat discount availability as part of state; allow using it at most once. Compare against exhaustive simple state paths for tiny graphs. The new problem is not solved by the reference and is not included in its passing checks.

The provided graph functions assume their documented finite graph/weight contracts. This lab does not benchmark huge targets or certify an asymptotic proof from timings.
