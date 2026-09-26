"""Reference algorithms and self-checks. Run with Python 3. No packages required."""

class Node:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

def insert_after(node, value):
    node.next = Node(value, node.next)

def values(head):
    out = []
    while head is not None:
        out.append(head.value)
        head = head.next
    return out

a = Node(1, Node(3))
insert_after(a, 2)
assert values(a) == [1, 2, 3]

def remove_after(node):
    victim = node.next
    if victim is None:
        return None
    node.next = victim.next
    return victim.value

assert remove_after(a) == 2
assert values(a) == [1, 3]

def merge_sort(items):
    if len(items) < 2:
        return list(items)
    mid = len(items) // 2
    left, right = merge_sort(items[:mid]), merge_sort(items[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    return out + left[i:] + right[j:]

assert merge_sort([3, 1, 2, 1]) == [1, 1, 2, 3]

from itertools import permutations
for row in permutations([0, 1, 2, 3]):
    assert merge_sort(row) == sorted(row)
assert merge_sort([]) == []
assert merge_sort([2, 2]) == [2, 2]

def pair_sum(values, target):
    left, right = 0, len(values) - 1
    while left < right:
        total = values[left] + values[right]
        if total == target:
            return left, right
        if total < target:
            left += 1
        else:
            right -= 1
    return None

assert pair_sum([1, 2, 4, 7], 6) == (1, 2)

assert pair_sum([1, 2, 4, 7], 8) == (0, 3)
assert pair_sum([3, 3], 6) == (0, 1)
assert pair_sum([3], 6) is None
assert pair_sum([], 6) is None

def longest_unique(text):
    last, left, best = {}, 0, 0
    for right, char in enumerate(text):
        left = max(left, last.get(char, -1) + 1)
        last[char] = right
        best = max(best, right - left + 1)
    return best

assert longest_unique("abba") == 2

from itertools import product
for size in range(6):
    for letters in product("ab", repeat=size):
        text = "".join(letters)
        brute = max([0] + [j-i for i in range(len(text)) for j in range(i+1,len(text)+1) if len(set(text[i:j])) == j-i])
        assert longest_unique(text) == brute

from collections import deque

def topological(graph):
    indegree = {v: 0 for v in graph}
    for neighbors in graph.values():
        for v in neighbors:
            indegree[v] = indegree.get(v, 0) + 1
    queue = deque(v for v, degree in indegree.items() if degree == 0)
    order = []
    while queue:
        node = queue.popleft(); order.append(node)
        for neighbor in graph.get(node, []):
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    if len(order) != len(indegree):
        raise ValueError("dependency cycle")
    return order

assert topological({"A":["B"],"B":["C"]}) == ["A","B","C"]

graph = {"A":["C"], "B":["C"], "C":[]}
order = topological(graph)
positions = {node:i for i,node in enumerate(order)}
assert all(positions[u] < positions[v] for u,vs in graph.items() for v in vs)
try:
    topological({"A":["B"],"B":["A"]})
except ValueError:
    pass
else:
    raise AssertionError("cycle accepted")

import heapq
from itertools import count

def dijkstra(graph, start):
    if any(weight < 0 for edges in graph.values() for _, weight in edges):
        raise ValueError("negative weight")
    ticket = count()
    distance = {start: 0}
    heap = [(0, next(ticket), start)]
    while heap:
        cost, _, node = heapq.heappop(heap)
        if cost != distance[node]:
            continue
        for neighbor, weight in graph.get(node, []):
            proposed = cost + weight
            if proposed < distance.get(neighbor, float("inf")):
                distance[neighbor] = proposed
                heapq.heappush(heap, (proposed, next(ticket), neighbor))
    return distance

assert dijkstra({"A":[("B",8),("C",2)],"C":[("B",1)]},"A")["B"] == 3

assert dijkstra({"A":[("B",0)], "D":[]}, "A") == {"A":0,"B":0}
try:
    dijkstra({"A":[("B",-1)]}, "A")
except ValueError:
    pass
else:
    raise AssertionError("negative accepted")

def schedule(intervals):
    chosen, end = [], None
    for start, finish in sorted(intervals, key=lambda x: x[1]):
        if finish <= start:
            raise ValueError("positive-duration intervals required")
        if end is None or start >= end:
            chosen.append((start, finish)); end = finish
    return chosen

assert len(schedule([(0,4),(0,2),(2,3),(3,5)])) == 3

result = schedule([(0,10),(0,2),(2,4),(4,6)])
assert len(result) == 3
assert all(result[i][1] <= result[i+1][0] for i in range(len(result)-1))
assert schedule([]) == []
for invalid in [(1, 1), (2, 1)]:
    try:
        schedule([(0, 1), invalid])
    except ValueError:
        pass
    else:
        raise AssertionError("nonpositive duration accepted")

# Independent small-instance oracle: enumerate subsets, not greedy choices.
# Positive-duration ties and duplicate intervals must not change the best count.
from itertools import combinations, permutations

def maximum_compatible_count(intervals):
    best = 0
    for size in range(len(intervals) + 1):
        for subset in combinations(intervals, size):
            ordered = sorted(subset)
            if all(left[1] <= right[0] for left, right in zip(ordered, ordered[1:])):
                best = max(best, size)
    return best

for sample in [[], [(0, 1)], [(0, 2), (1, 2), (2, 3), (2, 3)],
               [(-2, 0), (-1, 1), (0, 2), (1, 2), (2, 4)]]:
    expected = maximum_compatible_count(sample)
    for ordering in permutations(sample):
        chosen = schedule(ordering)
        assert len(chosen) == expected
        assert all(left[1] <= right[0] for left, right in zip(chosen, chosen[1:]))


def subsets(items):
    output, selected = [], []
    def visit(index):
        if index == len(items):
            output.append(selected.copy())
            return
        visit(index + 1)
        selected.append(items[index])
        visit(index + 1)
        selected.pop()
    visit(0)
    return output

assert len(subsets([1,2,3])) == 8

result = subsets([1, 2])
assert {tuple(x) for x in result} == {(), (1,), (2,), (1,2)}
result[0].append(99)
assert all(99 not in row for row in result[1:])

def knapsack(items, capacity):
    if capacity < 0:
        raise ValueError("negative capacity")
    dp = [0] * (capacity + 1)
    for weight, value in items:
        if weight <= 0:
            raise ValueError("positive integer weights required")
        for c in range(capacity, weight - 1, -1):
            dp[c] = max(dp[c], dp[c-weight] + value)
    return dp[capacity]

assert knapsack([(2,3),(3,4),(4,5)],5) == 7

assert knapsack([(2,3)],4) == 3
assert knapsack([],4) == 0
assert knapsack([(2,3)],0) == 0
# Ascending capacities would reuse the single item and incorrectly return 6.

print("All advanced algorithm reference checks passed.")
