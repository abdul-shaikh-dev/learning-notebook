import unittest
from collections import deque
from method_selection import min_coins, greedy_coins
from algorithms import distances
from advanced_algorithms import dijkstra, topological

def coin_oracle(coins,target):
    # Independent state-space BFS; every edge adds one coin.
    queue=deque([(0,0)]); seen={0}
    while queue:
        amount,count=queue.popleft()
        if amount==target:return count
        for coin in coins:
            next_amount=amount+coin
            if next_amount<=target and next_amount not in seen:
                seen.add(next_amount); queue.append((next_amount,count+1))
    return None

class Methods(unittest.TestCase):
    def test_fewest_edges_is_not_cheapest_route(self):
        graph={'A':[('B',9),('C',1)],'C':[('B',1)],'B':[],'Z':[]}
        hops=distances({k:[n for n,w in edges] for k,edges in graph.items()},'A')
        costs=dijkstra(graph,'A')
        self.assertEqual(hops['B'],1); self.assertEqual(costs['B'],2)
        self.assertNotIn('Z',costs)
    def test_greedy_counterexample(self):
        self.assertEqual(greedy_coins([1,3,4],6),3)
        self.assertEqual(min_coins([1,3,4],6),2)
        self.assertIsNone(min_coins([4,6],3))
    def test_dp_against_independent_oracle(self):
        for coins in [[],[1],[2,5],[1,3,4],[3,7]]:
            for amount in range(26):
                with self.subTest(coins=coins,amount=amount):
                    self.assertEqual(min_coins(coins,amount),coin_oracle(coins,amount))
    def test_invalid_and_dependency_cycle(self):
        for coins,target in [([0],5),([True],5),([1],-1)]:
            with self.assertRaises(ValueError):min_coins(coins,target)
        with self.assertRaises(ValueError):topological({'A':['B'],'B':['A']})
        with self.assertRaises(ValueError):dijkstra({'A':[('B',-1)]},'A')

if __name__=='__main__':unittest.main()
