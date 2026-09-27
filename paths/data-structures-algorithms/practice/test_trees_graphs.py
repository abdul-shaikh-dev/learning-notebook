import unittest
from itertools import permutations, product
from trees_graphs import BinarySearchTree, directed_dfs

class TreeTests(unittest.TestCase):
    def assert_invariant(self, tree):
        stack = [(tree.root, None, None)]
        while stack:
            node, low, high = stack.pop()
            if node:
                self.assertTrue(low is None or low < node.key)
                self.assertTrue(high is None or node.key < high)
                stack.extend([(node.left, low, node.key), (node.right, node.key, high)])

    def test_all_insert_delete_orders_against_set(self):
        for insertion in permutations(range(4)):
            for deletion in permutations(range(4)):
                tree, expected = BinarySearchTree(), set()
                for key in insertion:
                    self.assertTrue(tree.insert(key))
                    self.assertFalse(tree.insert(key))
                    expected.add(key)
                    self.assertEqual(tree.keys(), sorted(expected))
                    self.assert_invariant(tree)
                for key in deletion:
                    self.assertTrue(tree.contains(key))
                    self.assertTrue(tree.delete(key))
                    self.assertFalse(tree.delete(key))
                    expected.remove(key)
                    self.assertEqual(tree.keys(), sorted(expected))
                    self.assert_invariant(tree)
                self.assertIsNone(tree.root)

    def test_successor_with_right_child_and_boundaries(self):
        tree = BinarySearchTree()
        for key in [10, 5, 20, 15, 17, 30]: tree.insert(key)
        tree.delete(10)
        self.assertEqual(tree.keys(), [5,15,17,20,30])
        self.assert_invariant(tree)
        for bad in [True, 1.5, '1', None]:
            for operation in [tree.insert, tree.delete, tree.contains]:
                with self.assertRaises(ValueError): operation(bad)
        for key in range(2000): tree.insert(key)
        self.assertTrue(tree.contains(1999))

class DFSTests(unittest.TestCase):
    def test_all_three_vertex_graphs_against_reachability_oracle(self):
        edges = [(u,v) for u in range(3) for v in range(3)]
        for bits in product([False,True], repeat=9):
            graph = {v: [] for v in range(3)}
            reach = [[False]*3 for _ in range(3)]
            for (u,v), included in zip(edges,bits):
                if included: graph[u].append(v); reach[u][v] = True
            for k in range(3):
                for u in range(3):
                    for v in range(3): reach[u][v] |= reach[u][k] and reach[k][v]
            order, witness = directed_dfs(graph)
            self.assertEqual(set(order), set(graph))
            self.assertEqual(len(order), len(set(order)))
            self.assertEqual(bool(witness), any(reach[v][v] for v in range(3)))
            if witness:
                self.assertEqual(witness[0], witness[-1])
                self.assertTrue(all(v in graph[u] for u,v in zip(witness,witness[1:])))

    def test_components_neighbor_only_shared_finished_and_deep(self):
        graph = {'A':['B','C'], 'C':['B'], 'isolated':[]}
        before = {v:list(n) for v,n in graph.items()}
        order,witness = directed_dfs(graph)
        self.assertEqual(set(order), {'A','B','C','isolated'})
        self.assertEqual(witness, [])
        self.assertEqual(graph, before)
        self.assertEqual(directed_dfs({}), ([],[]))
        self.assertEqual(len(directed_dfs({i:[i+1] for i in range(3000)})[0]),3001)

if __name__ == '__main__': unittest.main()
