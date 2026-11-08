# Fact checks for checkpoint answers that depend on code behaviour.
# Each entry is keyed "<course>/<question key>" and sets `answer` to the exact text of the correct option.
# tests/browser-python.cjs runs every entry in the bundled Python runtime and compares it with checkpoints.json.
FACTS = {
    # Data Structures & Algorithms
    'data-structures-algorithms/cost/2': '''
n, i, steps = 1024, 1, 0
while i < n:
    i *= 2
    steps += 1
answer = str(steps)
''',
    'data-structures-algorithms/maps/2': '''
d = {'a': 1, 'a': 2}
answer = str(d['a'])
''',
    'data-structures-algorithms/stacks-queues/2': '''
from collections import deque
q = deque([1, 2, 3])
q.append(4)
answer = str(q.popleft())
''',
    'data-structures-algorithms/binary-search/2': '''
import bisect
answer = str(bisect.bisect_left([1, 3, 3, 3, 5], 3))
''',
    'data-structures-algorithms/sorting/2': '''
rows = [('b', 2), ('a', 2), ('c', 1)]
answer = repr(sorted(rows, key=lambda r: r[1])[:2])
''',
    'data-structures-algorithms/recursion/2': '''
def depth(n):
    return 0 if n == 0 else 1 + depth(n - 1)
try:
    depth(-1)
    answer = 'It returns'
except RecursionError:
    answer = 'It raises RecursionError'
''',
    'data-structures-algorithms/binary-search-tree/2': '''
tree = {}
def insert(key, node=10):
    side = 'left' if key < node else 'right'
    child = tree.get((node, side))
    if child is None:
        tree[(node, side)] = key
    else:
        insert(key, child)
for key in [5, 20, 15]:
    insert(key)
answer = str(tree[(20, 'left')])
''',
    'data-structures-algorithms/graphs/2': '''
from collections import deque
edges = [('A', 'B'), ('A', 'C'), ('B', 'D'), ('C', 'D'), ('D', 'E')]
graph = {}
for a, b in edges:
    graph.setdefault(a, []).append(b)
    graph.setdefault(b, []).append(a)
distance, queue = {'A': 0}, deque(['A'])
while queue:
    node = queue.popleft()
    for nxt in graph[node]:
        if nxt not in distance:
            distance[nxt] = distance[node] + 1
            queue.append(nxt)
answer = str(distance['E'])
''',
    'data-structures-algorithms/heaps/2': '''
import heapq
h = []
for v in [5, 1, 4]:
    heapq.heappush(h, v)
heapq.heappop(h)
answer = str(heapq.heappop(h))
''',
    'data-structures-algorithms/dynamic-programming/2': '''
ways = [1] + [0] * 5
for coin in [1, 2]:
    for amount in range(coin, 6):
        ways[amount] += ways[amount - coin]
answer = str(ways[5])
''',
    'data-structures-algorithms/merge-sort/2': '''
left, right, out, comparisons = [1, 4], [2, 3], [], 0
i = j = 0
while i < len(left) and j < len(right):
    comparisons += 1
    if left[i] <= right[j]:
        out.append(left[i]); i += 1
    else:
        out.append(right[j]); j += 1
out += left[i:] + right[j:]
assert out == [1, 2, 3, 4]
answer = str(comparisons)
''',
    'data-structures-algorithms/two-pointers/2': '''
values, target = [1, 2, 4, 7, 11], 15
total = values[0] + values[-1]
assert total == 12
answer = 'left moves right' if total < target else 'right moves left'
''',
    'data-structures-algorithms/sliding-window/2': '''
text, seen, left, best = 'abcabcbb', {}, 0, 0
for right, ch in enumerate(text):
    if ch in seen:
        left = max(left, seen[ch] + 1)
    seen[ch] = right
    best = max(best, right - left + 1)
answer = str(best)
''',
    'data-structures-algorithms/topological/2': '''
from graphlib import TopologicalSorter
answer = repr(list(TopologicalSorter({'b': {'a'}, 'c': {'b'}}).static_order()))
''',
    'data-structures-algorithms/dijkstra/2': '''
import heapq
graph = {'A': [('B', 1), ('C', 5)], 'B': [('C', 1)], 'C': []}
best, queue = {}, [(0, 'A')]
while queue:
    cost, node = heapq.heappop(queue)
    if node in best:
        continue
    best[node] = cost
    for nxt, weight in graph[node]:
        heapq.heappush(queue, (cost + weight, nxt))
answer = str(best['C'])
''',
    'data-structures-algorithms/greedy/2': '''
amount, used = 6, 0
for coin in [4, 3, 1]:
    while amount >= coin:
        amount -= coin
        used += 1
answer = str(used)
''',
    'data-structures-algorithms/backtracking/2': '''
values, selected, leaves = [1, 2, 3], [], []
def walk(i):
    if i == len(values):
        leaves.append(selected.copy())
        return
    selected.append(values[i]); walk(i + 1); selected.pop()
    walk(i + 1)
walk(0)
answer = str(len(leaves))
''',
    'data-structures-algorithms/knapsack/2': '''
best = [0] * 5
for weight, value in [(1, 15), (3, 20), (4, 30)]:
    for capacity in range(4, weight - 1, -1):
        best[capacity] = max(best[capacity], best[capacity - weight] + value)
answer = str(best[4])
''',
    'data-structures-algorithms/stage/foundation/2': '''
from collections import Counter
answer = repr(Counter('banana').most_common(1))
''',
    'data-structures-algorithms/stage/intermediate/1': '''
import bisect
answer = str(bisect.bisect_right([1, 2, 2, 2, 3], 2))
''',
    'data-structures-algorithms/stage/intermediate/2': '''
graph = {'A': ['B', 'C'], 'B': ['D'], 'C': [], 'D': []}
order, stack, seen = [], ['A'], {'A'}
while stack:
    node = stack.pop()
    order.append(node)
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt); stack.append(nxt)
# A queue would visit A, B, C, D by layer; the stack finishes the C branch before D.
assert order == ['A', 'C', 'B', 'D']
answer = 'A depth-first order'
''',
    'data-structures-algorithms/stage/intermediate/3': '''
import functools
calls = 0
@functools.cache
def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)
fib(30)
answer = str(calls)
plain = 0
def slow(n):
    global plain
    plain += 1
    return n if n < 2 else slow(n - 1) + slow(n - 2)
slow(25)
# Uncached calls follow C(n) = 2 * fib(n + 1) - 1: checked at 25, then applied at 30 for the explanation.
assert plain == 2 * fib(26) - 1 == 242785
assert 2 * fib(31) - 1 == 2692537
''',
    'data-structures-algorithms/stage/advanced/1': '''
intervals = [(1, 4), (3, 5), (0, 6), (5, 7), (8, 9), (5, 9)]
chosen, end = [], float('-inf')
for start, finish in sorted(intervals, key=lambda x: x[1]):
    if start >= end:
        chosen.append((start, finish)); end = finish
assert chosen == [(1, 4), (5, 7), (8, 9)]
answer = str(len(chosen))
''',
    'data-structures-algorithms/stage/advanced/2': '''
best = [0] * 7
for weight, value in [(3, 5)]:
    for capacity in range(weight, 7):
        best[capacity] = max(best[capacity], best[capacity - weight] + value)
assert best[6] == 10  # the single item was used twice
answer = 'Any number of times'
''',
    # Design Patterns
    'design-patterns/contracts/2': '''
def total(prices):
    prices.sort()
    return sum(prices)
p = [3, 1, 2]
total(p)
answer = repr(p)
''',
    'design-patterns/composition/2': '''
def remind(name, fmt, send):
    send(fmt(name))
sent = []
remind('Ada', str.upper, sent.append)
answer = repr(sent)
''',
    'design-patterns/strategy/2': '''
def checkout(total, discount=lambda t: t):
    return discount(total)
answer = repr(checkout(100, lambda t: t * 0.9))
''',
    'design-patterns/factories/2': '''
def make(kind):
    return {'csv': list, 'json': dict}[kind]()
try:
    make('xml')
except KeyError:
    answer = 'Raises KeyError'
''',
    'design-patterns/builder/2': '''
class Builder:
    def __init__(self):
        self.parts = []
    def add(self, part):
        self.parts.append(part)
try:
    Builder().add('a').add('b')
except AttributeError:
    answer = 'Raises AttributeError'
''',
    'design-patterns/decorator/2': '''
def bold(f):
    return lambda: '<b>' + f() + '</b>'
def italic(f):
    return lambda: '<i>' + f() + '</i>'
@bold
@italic
def hi():
    return 'hi'
answer = repr(hi())
''',
    'design-patterns/composite/2': '''
def size(node):
    return node if isinstance(node, int) else sum(size(c) for c in node)
answer = str(size([1, [2, 3], [[4]]]))
''',
    'design-patterns/proxy/2': '''
loads = 0
def loader():
    global loads
    loads += 1
    return 'data'
class LazyProxy:
    def __init__(self, load):
        self._load, self._value, self._ready = load, None, False
    @property
    def value(self):
        if not self._ready:
            self._value, self._ready = self._load(), True
        return self._value
proxy = LazyProxy(loader)
for _ in range(3):
    proxy.value
answer = str(loads)
''',
    'design-patterns/observer/2': '''
log = []
subscribers = [lambda e: log.append('a'), lambda e: 1 / 0, lambda e: log.append('c')]
def publish(event):
    for subscriber in subscribers:
        subscriber(event)
try:
    publish('changed')
except ZeroDivisionError:
    pass
answer = repr(log)
''',
    'design-patterns/chain-of-responsibility/2': '''
def handle(request, handlers):
    for handler in handlers:
        result = handler(request)
        if result is not None:
            return result
    return None
answer = repr(handle('r', [lambda r: None, lambda r: 0, lambda r: 'x']))
''',
    'design-patterns/command/2': '''
counter, history = 0, []
def add(n):
    global counter
    counter += n
    history.append(-n)
def undo():
    global counter
    counter += history.pop()
add(5); add(3); undo()
answer = str(counter)
''',
    'design-patterns/template-method/2': '''
class Report:
    def render(self):
        return self.header() + self.body()
    def header(self):
        return 'H;'
    def body(self):
        raise NotImplementedError
class Sales(Report):
    def body(self):
        return 'S'
answer = repr(Sales().render())
''',
    'design-patterns/iterator/2': '''
it = iter([1, 2, 3])
answer = repr(list(zip(it, it)))
''',
    'design-patterns/repository/2': '''
class Repo:
    def __init__(self):
        self.items = {}
    def add(self, entity):
        self.items[entity['id']] = entity
    def get(self, entity_id):
        return self.items[entity_id]
repo, e = Repo(), {'id': 1, 'name': 'a'}
repo.add(e)
e['name'] = 'b'
answer = repr(repo.get(e['id'])['name'])
''',
    'design-patterns/stage/foundation/1': '''
answer = repr(sorted(['ccc', 'a', 'bb'], key=len))
''',
    'design-patterns/stage/foundation/3': '''
import functools
def send(msg, channel):
    return channel + ': ' + msg
answer = repr(functools.partial(send, channel='email')('hi'))
''',
    'design-patterns/stage/intermediate/1': '''
def plain(f):
    def wrapper(*args):
        return f(*args)
    return wrapper
@plain
def greet():
    return 'hi'
answer = repr(greet.__name__)
''',
    'design-patterns/stage/intermediate/2': '''
calls = []
def load():
    calls.append(1)
    yield 1
g = load()
answer = str(len(calls))
next(g)
assert calls == [1]
''',
    'design-patterns/stage/advanced/1': '''
TRANSITIONS = {'draft': {'submit': 'submitted'}, 'submitted': {'pay': 'paid'}}
answer = repr(TRANSITIONS['draft'].get('pay'))
''',
    'design-patterns/stage/advanced/2': '''
def values():
    yield from [1, 2]
g = values()
try:
    len(g)
    answer = 'Yes'
except TypeError:
    assert list(g) == [1, 2] and list(g) == []
    answer = 'No: callers that use len() or loop twice now break'
''',
    'design-patterns/stage/advanced/3': '''
log = []
commands = [lambda: log.append(i) for i in range(3)]
for command in commands:
    command()
answer = repr(log)
''',
    # Practical Maths & Statistics
    'practical-maths-statistics/logic-and-conditions/2': '''
age, member, spend = 17, True, 200
answer = 'Yes' if age >= 18 and (member or spend > 100) else 'No'
''',
    'practical-maths-statistics/sets-and-overlap/2': '''
answer = repr({2, 3, 4} - {1, 2, 3})
''',
    'practical-maths-statistics/functions-and-domains/2': '''
import math
outside = []
for x in [1, 2, 6]:
    try:
        math.sqrt(x - 2)
    except ValueError:
        outside.append(x)
answer = str(outside[0]) if len(outside) == 1 else repr(outside)
''',
    'practical-maths-statistics/units-and-rates/2': '''
per_second = 120 / 60
answer = str(round(per_second * 45))
assert 120 * 45 == 5400
''',
    'practical-maths-statistics/percentages-and-change/2': '''
answer = f'{(100 - 80) / 80:.0%}'
''',
    'practical-maths-statistics/powers-and-growth/2': '''
answer = str(round(100 * 1.1 ** 3, 10))
''',
    'practical-maths-statistics/algebra-and-scaling/2': '''
x = (20 - 5) / 3
assert 3 * x + 5 == 20
answer = str(int(x))
''',
    'practical-maths-statistics/mean-median-and-outliers/2': '''
import statistics
values = [10, 11, 12, 13, 200]
answer = f'Mean {statistics.mean(values)} ms, median {statistics.median(values)} ms'
''',
    'practical-maths-statistics/variance-and-spread/2': '''
import statistics
values = [2, 4, 4, 4, 5, 5, 7, 9]
assert statistics.pvariance(values) == 4
answer = str(int(statistics.pstdev(values)))
''',
    'practical-maths-statistics/probability-and-complements/2': '''
from fractions import Fraction
from itertools import product
outcomes = list(product('HT', repeat=2))
answer = str(Fraction(sum('H' in o for o in outcomes), len(outcomes)))
''',
    'practical-maths-statistics/conditional-probability/2': '''
from fractions import Fraction
from itertools import product
given = [o for o in product(range(1, 7), repeat=2) if sum(o) == 8]
answer = str(Fraction(given.count((4, 4)), len(given)))
''',
    'practical-maths-statistics/expected-value/2': '''
from fractions import Fraction
gain = Fraction(1, 10) * 5 - 1
answer = str(float(gain))
''',
    'practical-maths-statistics/uncertainty-and-intervals/2': '''
import math
ratio = 1 / math.sqrt(4)
assert ratio == 0.5
answer = 'It roughly halves'
''',
    'practical-maths-statistics/vectors-and-coordinates/2': '''
v = tuple(2 * a + b for a, b in zip((1, -1), (2, 3)))
answer = '(' + ', '.join(map(str, v)) + ')'
''',
    'practical-maths-statistics/dot-products-and-scores/2': '''
score = sum(w * s for w, s in zip((0.5, 0.3, 0.2), (80, 60, 90)))
answer = str(round(score, 10)).removesuffix('.0')
''',
    'practical-maths-statistics/matrices-and-shapes/2': '''
m, v = [[1, 2], [3, 4]], (1, 1)
out = tuple(sum(a * b for a, b in zip(row, v)) for row in m)
answer = '(' + ', '.join(map(str, out)) + ')'
''',
    'practical-maths-statistics/correlation-and-causation/2': '''
import statistics
xs = [-2, -1, 0, 1, 2]
answer = str(int(statistics.correlation(xs, [x * x for x in xs])))
''',
    'practical-maths-statistics/feature-scaling/2': '''
import math
a, b, c = (1, 1000), (2, 1000), (1, 1010)
assert (math.dist(a, b), math.dist(a, c)) == (1, 10)
answer = 'b'
''',
    'practical-maths-statistics/stage/foundation/1': '''
seconds = 1500 / 25
assert seconds == 60
answer = '1 minute'
''',
    'practical-maths-statistics/stage/foundation/2': '''
answer = f'{0.8 * 1.2 - 1:.0%}'
''',
    'practical-maths-statistics/stage/foundation/3': '''
same = all((not (x > 3 and x < 7)) == (x <= 3 or x >= 7) for x in range(-20, 21))
assert same
assert not all((not (x > 3 and x < 7)) == (x > 3 or x < 7) for x in range(-20, 21))
answer = 'x <= 3 or x >= 7'
''',
    'practical-maths-statistics/stage/intermediate/1': '''
people = 1000
cases = people * 0.01
true_positive = cases * 0.9
false_positive = (people - cases) * 0.1
share = true_positive / (true_positive + false_positive)
answer = f'About {share:.0%}'
''',
    'practical-maths-statistics/stage/intermediate/2': '''
import statistics
answer = str(statistics.median([1, 2, 3, 4]))
''',
    'practical-maths-statistics/stage/intermediate/3': '''
from fractions import Fraction
p = Fraction(1, 6)
expected = sum(k * (1 - p) ** (k - 1) * p for k in range(1, 400))
assert abs(float(expected) - 6) < 1e-9
answer = str(int(1 / p))
''',
    'practical-maths-statistics/stage/advanced/1': '''
import math
a, b = (1, 0), (0, 1)
cosine = sum(x * y for x, y in zip(a, b)) / (math.hypot(*a) * math.hypot(*b))
answer = str(int(cosine))
''',
    'practical-maths-statistics/stage/advanced/2': '''
values = [10, 20, 30]
low, high = min(values), max(values)
answer = repr([(v - low) / (high - low) for v in values])
''',
    'practical-maths-statistics/stage/advanced/3': '''
a, b = (9, 4), (5, 7)
score = lambda w, s: sum(x * y for x, y in zip(w, s))
winner = lambda w: 'A' if score(w, a) > score(w, b) else 'B'
assert (score((0.5, 0.5), a), score((0.5, 0.5), b)) == (6.5, 6.0)
answer = f'{winner((0.5, 0.5))} with the first, {winner((0.2, 0.8))} with the second'
''',
    # Python
    'python/pythonic-idioms/2': '''
def f(a, *, b):
    return a + b
try:
    f(1, 2)
    answer = 'As the second positional argument'
except TypeError:
    answer = 'By name, as b=...' if f(1, b=2) == 3 else 'It cannot be supplied'
''',
    'python/classes-in-depth/2': '''
from enum import Enum
class Status(Enum):
    DONE = "done"
answer = str(Status.DONE == "done")
''',
    'python/closures-and-decorators/2': '''
funcs = [lambda: i for i in range(3)]
answer = str([f() for f in funcs])
''',
    'python/standard-library/2': '''
import re
answer = 'None' if re.fullmatch(r"\\d+", "45m") is None else 'A match for 45'
''',
}
