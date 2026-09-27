"""Unbalanced integer-key BST and iterative directed DFS. Python 3.10+."""
from dataclasses import dataclass

@dataclass
class Node:
    key: int
    left: object = None
    right: object = None

class BinarySearchTree:
    """Set semantics: duplicate insert is a no-op; missing delete returns False.

    Integer keys only (bool rejected). Search/insert/delete O(h), worst O(n).
    Iterative operations avoid Python recursion depth; this is not balanced.
    """
    def __init__(self):
        self.root = None

    @staticmethod
    def _key(key):
        if type(key) is not int:
            raise ValueError('integer key required')

    def contains(self, key):
        self._key(key)
        node = self.root
        while node:
            if node.key == key:
                return True
            node = node.left if key < node.key else node.right
        return False

    def insert(self, key):
        self._key(key)
        if self.root is None:
            self.root = Node(key)
            return True
        node = self.root
        while True:
            if key == node.key:
                return False
            side = 'left' if key < node.key else 'right'
            child = getattr(node, side)
            if child is None:
                setattr(node, side, Node(key))
                return True
            node = child

    def delete(self, key):
        self._key(key)
        parent, node = None, self.root
        while node and node.key != key:
            parent, node = node, node.left if key < node.key else node.right
        if node is None:
            return False
        if node.left and node.right:
            # Copy the inorder successor, then splice that successor out.
            parent, successor = node, node.right
            while successor.left:
                parent, successor = successor, successor.left
            node.key = successor.key
            node = successor
        child = node.left or node.right
        if parent is None:
            self.root = child
        elif parent.left is node:
            parent.left = child
        else:
            parent.right = child
        return True

    def keys(self):
        out, stack, node = [], [], self.root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            out.append(node.key)
            node = node.right
        return out

def directed_dfs(graph):
    """Return (preorder, cycle witness), visiting every component.

    Mapping of hashable vertices to finite neighbor sequences; no mutation.
    Gray vertices are on the active stack; black vertices are finished.
    A witness [v,...,v] follows actual directed edges. Empty list means DAG.
    O(V+E) time/space including normalized adjacency, no recursive stack.
    """
    adjacency = {v: tuple(neighbors) for v, neighbors in graph.items()}
    for neighbors in list(adjacency.values()):
        for v in neighbors:
            adjacency.setdefault(v, ())
    color, order, witness = {}, [], []
    for root in adjacency:
        if color.get(root):
            continue
        color[root] = 1
        order.append(root)
        active, index = [root], {root: 0}
        stack = [(root, iter(adjacency[root]))]
        while stack:
            vertex, edges = stack[-1]
            try:
                neighbor = next(edges)
            except StopIteration:
                color[vertex] = 2
                stack.pop()
                active.pop()
                del index[vertex]
                continue
            if color.get(neighbor, 0) == 0:
                color[neighbor] = 1
                order.append(neighbor)
                index[neighbor] = len(active)
                active.append(neighbor)
                stack.append((neighbor, iter(adjacency[neighbor])))
            elif color[neighbor] == 1 and not witness:
                witness = active[index[neighbor]:] + [neighbor]
    return order, witness
