"""Independent bounded oracles for the advanced algorithm learner extension."""
from itertools import combinations, product
from random import Random
import unittest

from advanced_algorithms import dijkstra, knapsack


def shortest_paths_by_relaxation(graph, start):
    """Bellman-Ford style oracle; unlike Dijkstra it does not choose a heap minimum."""
    vertices = {start, *graph}
    vertices.update(v for edges in graph.values() for v, _ in edges)
    distance = {v: float('inf') for v in vertices}
    distance[start] = 0
    for _ in range(len(vertices) - 1):
        for u, edges in graph.items():
            for v, weight in edges:
                distance[v] = min(distance[v], distance[u] + weight)
    return {v: cost for v, cost in distance.items() if cost != float('inf')}


def knapsack_by_subsets(items, capacity):
    return max((sum(value for _, value in subset)
                for size in range(len(items) + 1)
                for subset in combinations(items, size)
                if sum(weight for weight, _ in subset) <= capacity), default=0)


class OracleTests(unittest.TestCase):
    def test_shortest_paths_against_independent_relaxation(self):
        rng = Random(1847)
        for _ in range(80):
            vertices = tuple(range(rng.randint(1, 5)))
            graph = {u: [(v, rng.randint(0, 7)) for v in vertices
                         if u != v and rng.random() < .4] for u in vertices}
            self.assertEqual(dijkstra(graph, 0), shortest_paths_by_relaxation(graph, 0), graph)
        self.assertEqual(dijkstra({0: [(1, 0), (2, 5)], 1: [(2, 0)], 3: []}, 0),
                         {0: 0, 1: 0, 2: 0})
        with self.assertRaises(ValueError):
            dijkstra({0: [(1, -1)]}, 0)

    def test_zero_one_knapsack_against_subset_enumeration(self):
        rng = Random(927)
        for _ in range(100):
            items = [(rng.randint(1, 5), rng.randint(-3, 9))
                     for _ in range(rng.randint(0, 7))]
            capacity = rng.randint(0, 12)
            self.assertEqual(knapsack(items, capacity),
                             knapsack_by_subsets(items, capacity), (items, capacity))
        self.assertEqual(knapsack([(2, 3)], 4), 3)  # catches ascending-capacity reuse
        self.assertEqual(knapsack([(3, -2)], 3), 0)  # declining an item is legal


if __name__ == '__main__':
    unittest.main()
