"""Learning Notebook algorithms: run with Python 3; no packages required."""
from collections import deque

def binary_search(values, target):
    low, high = 0, len(values) - 1
    while low <= high:
        mid = (low + high) // 2
        if values[mid] == target:
            return mid
        if values[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

def distances(graph, start):
    distance = {start: 0}
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for neighbor in graph.get(node, []):
            if neighbor not in distance:
                distance[neighbor] = distance[node] + 1
                queue.append(neighbor)
    return distance

def ways(n):
    if not isinstance(n, int) or isinstance(n, bool) or n < 0:
        raise ValueError("nonnegative integer required")
    previous, current = 1, 1
    for _ in range(n):
        previous, current = current, previous + current
    return previous

if __name__ == "__main__":
    for values in [[], [3], [1, 1, 2, 4], list(range(0, 40, 2))]:
        for target in range(-1, 42):
            index = binary_search(values, target)
            assert (index == -1) == (target not in values)
            if index != -1:
                assert values[index] == target
    assert distances({"A":["B"], "B":["C"], "C":["A"], "D":[]}, "A") == {"A":0,"B":1,"C":2}
    assert [ways(n) for n in range(6)] == [1,1,2,3,5,8]
    for bad in [-1, 1.5, True]:
        try:
            ways(bad)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid n accepted")
    print("All algorithm checks passed.")

