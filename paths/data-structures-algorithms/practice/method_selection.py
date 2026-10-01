"""Competing methods for the same inputs; Python 3.11+, standard library."""
def min_coins(coins, target):
    if type(target) is not int or target < 0 or any(type(c) is not int or c <= 0 for c in coins):
        raise ValueError('nonnegative target, positive integer coins required')
    best = [0] + [None] * target
    for amount in range(1, target + 1):
        candidates = [best[amount-c] + 1 for c in coins if c <= amount and best[amount-c] is not None]
        if candidates: best[amount] = min(candidates)
    return best[target]

def greedy_coins(coins, target):
    # Deliberately limited heuristic for comparison, not a general optimum.
    used=0
    for coin in sorted(coins, reverse=True):
        count, target=divmod(target,coin)
        used += count
    return used if target == 0 else None
