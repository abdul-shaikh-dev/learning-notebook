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
    'data-structures-algorithms/quicksort/2': '''
def partition(a, lo, hi):
    """Move a[hi] to its final index p: a[lo:p] < pivot <= a[p+1:hi+1]."""
    pivot = a[hi]
    p = lo
    for i in range(lo, hi):
        if a[i] < pivot:
            a[i], a[p] = a[p], a[i]
            p += 1
    a[p], a[hi] = a[hi], a[p]
    return p

def quickselect(a, k):
    lo, hi = 0, len(a) - 1
    while True:
        p = partition(a, lo, hi)
        if p == k:
            return a[p]
        if k < p:
            hi = p - 1
        else:
            lo = p + 1
answer = str(quickselect([42, 7, 19, 88, 3, 61, 25], 3))
''',
    'data-structures-algorithms/prefix-sums-bits/2': '''
answer = str(12 & (12 - 1))
''',
    'data-structures-algorithms/tries-strings/2': '''
answer = str([i for i in range(len("aaaa")) if "aaaa".startswith("aa", i)])
''',
    'data-structures-algorithms/union-find-mst/2': '''class DisjointSet:
    def __init__(self, items):
        self.parent = {x: x for x in items}
        self.size = {x: 1 for x in items}

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]  # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True

groups = DisjointSet("ABCDE")
groups.union("A", "B"); groups.union("C", "D"); groups.union("B", "D")
answer = str(len({groups.find(x) for x in "ABCDE"}))
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
    'design-patterns/bridge-flyweight-prototype/2': '''import copy
template = {"tags": ["draft"]}
c = copy.copy(template)
c["tags"].append("x")
answer = str(template["tags"])
''',
    'design-patterns/memento-visitor-interpreter/2': '''from dataclasses import dataclass

@dataclass(frozen=True)
class Is:
    field: str
    value: object

@dataclass(frozen=True)
class AtLeast:
    field: str
    value: int

@dataclass(frozen=True)
class All:
    rules: tuple

@dataclass(frozen=True)
class AnyOf:
    rules: tuple

def matches(rule, row):  # operation 1: interpret the rule for one row
    match rule:
        case Is(field, value):
            return row.get(field) == value
        case AtLeast(field, value):
            return row.get(field, 0) >= value
        case All(rules):
            return all(matches(r, row) for r in rules)
        case AnyOf(rules):
            return any(matches(r, row) for r in rules)
    raise TypeError(f"unknown rule {rule!r}")

rule = All((Is("topic", "sql"), AnyOf((AtLeast("minutes", 30), Is("done", True)))))
rows = [{"topic": "sql", "minutes": 45}, {"topic": "sql", "minutes": 10}, {"topic": "git", "minutes": 60}]
hits = [row for row in rows if matches(rule, row)]
answer = "Only sql with 45 minutes" if hits == rows[:1] else repr(hits)
''',
    'design-patterns/architectural-patterns/2': '''from dataclasses import dataclass

@dataclass(frozen=True)
class LessonAdded:
    lesson_id: str
    title: str

@dataclass(frozen=True)
class LessonCompleted:
    lesson_id: str
    minutes: int

class StudyPlan:  # write model: checks commands and records events
    def __init__(self, events=()):
        self.titles, self.done = {}, set()
        for event in events:
            self.apply(event)

    def apply(self, event):
        match event:
            case LessonAdded(lesson_id, title):
                self.titles[lesson_id] = title
            case LessonCompleted(lesson_id, _):
                self.done.add(lesson_id)

    def complete(self, lesson_id, minutes):
        if lesson_id not in self.titles:
            raise ValueError("unknown lesson")
        if lesson_id in self.done:
            return []  # already complete: no new event
        event = LessonCompleted(lesson_id, minutes)
        self.apply(event)
        return [event]

plan = StudyPlan([LessonAdded("sql-1", "Joins")])
events = plan.complete("sql-1", 40) + plan.complete("sql-1", 40)
answer = str(sum(isinstance(e, LessonCompleted) for e in events))
''',
    'design-patterns/resilience-patterns/2': '''class CircuitOpen(Exception):
    pass

class CircuitBreaker:
    def __init__(self, threshold, cooldown, clock):
        self.threshold, self.cooldown, self.clock = threshold, cooldown, clock
        self.failures, self.opened_at = 0, None

    @property
    def state(self):
        if self.opened_at is None:
            return "closed"
        return "half-open" if self.clock() - self.opened_at >= self.cooldown else "open"

    def call(self, operation):
        if self.state == "open":
            raise CircuitOpen("failing fast")
        try:
            result = operation()
        except ConnectionError:
            self.failures += 1
            if self.state == "half-open" or self.failures >= self.threshold:
                self.opened_at = self.clock()
            raise
        self.failures, self.opened_at = 0, None
        return result

now = [0.0]
breaker = CircuitBreaker(threshold=2, cooldown=30, clock=lambda: now[0])
calls = []
def down():
    calls.append(now[0])
    raise ConnectionError("down")
for t in [0, 1, 10]:
    now[0] = t
    try:
        breaker.call(down)
    except CircuitOpen:
        outcome = "fast"
    except ConnectionError:
        outcome = "error"
answer = "Fails fast without calling the dependency" if outcome == "fast" and calls == [0, 1] else outcome
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
    'practical-maths-statistics/logarithms-and-log-scales/2': '''
import math
answer = f"{math.ceil(math.log2(1_000_000))}"
''',
    'practical-maths-statistics/bayes-and-base-rates/2': '''
posterior = 0.9 * 0.02 / (0.9 * 0.02 + 0.1 * 0.98)
answer = f"About {round(posterior * 100)}%"
''',
    'practical-maths-statistics/distributions/2': '''
from statistics import NormalDist
answer = f"About {(1 - NormalDist(100, 15).cdf(130)) * 100:.1f}%"
''',
    'practical-maths-statistics/hypothesis-tests/2': '''
answer = f"About {round((1 - 0.95 ** 20) * 100)}%"
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

# Practice ladder answers that depend on code behaviour. Each entry is keyed "<course>/<lesson>/<step>"
# and sets `expected` to strings the step's worked solution must contain; tests/browser-python.cjs runs
# them in the bundled Python runtime.
PRACTICE = {
    'data-structures-algorithms/dynamic-programming/1': '''
coins, best = (1, 3, 4), [0]
for a in range(1, 7):
    best.append(min(best[a - c] + 1 for c in coins if c <= a))
greedy, left = 0, 6
for c in sorted(coins, reverse=True):
    greedy, left = greedy + left // c, left % c
assert (best[5], best[6], greedy) == (2, 2, 3)
expected = [f'so `best[5] = {best[5]}`', f'so `best[6] = {best[6]}`', '4 + 1 + 1, three coins']
''',
    'data-structures-algorithms/dynamic-programming/2': '''
ways = [1]
for n in range(1, 5):
    ways.append(sum(ways[n - k] for k in (1, 2, 3) if n - k >= 0))
expected = [', '.join(map(str, ways)) + f', so there are {ways[4]} ways']
''',
    'data-structures-algorithms/dynamic-programming/3': '''
def paths(blocked=()):
    grid = [[0] * 3 for _ in range(3)]
    for r in range(3):
        for c in range(3):
            if (r, c) in blocked:
                continue
            grid[r][c] = 1 if r == c == 0 else (grid[r - 1][c] if r else 0) + (grid[r][c - 1] if c else 0)
    return grid[2][2]
expected = [f'The table gives {paths()} paths', f'leaves {paths({(1, 1)})} paths']
''',
    'data-structures-algorithms/sliding-window/1': '''
last, left, best, lefts = {}, 0, 0, []
for right, char in enumerate('abcabcbb'):
    left = max(left, last.get(char, -1) + 1)
    last[char] = right
    best = max(best, right - left + 1)
    lefts.append(left)
expected = [f'`left` becomes 0 + 1 = {lefts[3]}', f'The result is {best}']
''',
    'data-structures-algorithms/sliding-window/2': '''
last, left, best, lefts = {}, 0, 0, []
for right, char in enumerate('tmmzuxt'):
    left = max(left, last.get(char, -1) + 1)
    last[char] = right
    best = max(best, right - left + 1)
    lefts.append(left)
assert lefts[2] == 2 and lefts[6] == 2
expected = [f'gives the result {best}']
''',
    'data-structures-algorithms/sliding-window/3': '''
values, k = [2, 1, 5, 1, 3, 2], 3
sums = [sum(values[:k])]
for i in range(k, len(values)):
    sums.append(sums[-1] - values[i - k] + values[i])
assert sums == [8, 7, 9, 6]
expected = [f'The largest is {max(sums)}']
''',
    'data-structures-algorithms/dijkstra/1': '''
import heapq
graph = {'A': [('B', 8), ('C', 2)], 'C': [('B', 1), ('D', 7)], 'B': [('D', 1)]}
distance, heap = {'A': 0}, [(0, 'A')]
while heap:
    cost, node = heapq.heappop(heap)
    if cost != distance[node]:
        continue
    for neighbor, weight in graph.get(node, []):
        if cost + weight < distance.get(neighbor, float('inf')):
            distance[neighbor] = cost + weight
            heapq.heappush(heap, (cost + weight, neighbor))
expected = [f'The result is `{dict(sorted(distance.items()))}`']
''',
    'data-structures-algorithms/dijkstra/2': '''
import heapq
graph = {'A': [('B', 8), ('C', 2)], 'C': [('B', 1), ('D', 7)], 'B': [('D', 1)]}
distance, heap, pushes, stale = {'A': 0}, [(0, 'A')], 1, 0
while heap:
    cost, node = heapq.heappop(heap)
    if cost != distance[node]:
        stale += 1
        continue
    for neighbor, weight in graph.get(node, []):
        if cost + weight < distance.get(neighbor, float('inf')):
            distance[neighbor] = cost + weight
            heapq.heappush(heap, (cost + weight, neighbor))
            pushes += 1
expected = [f'{pushes} pushes', f'so {stale} entries are skipped']
''',
    'data-structures-algorithms/dijkstra/3': '''
edges = [('A', 'B', 2), ('A', 'C', 3), ('C', 'B', -2)]
distance = {'A': 0, 'B': float('inf'), 'C': float('inf')}
for _ in range(2):  # Bellman-Ford: V - 1 rounds
    for a, b, w in edges:
        distance[b] = min(distance[b], distance[a] + w)
expected = [f'3 + (−2) = {distance["B"]}']
''',
    'data-structures-algorithms/union-find-mst/1': '''
parent = {x: x for x in 'ABCDE'}
def find(x):
    while parent[x] != x:
        x = parent[x]
    return x
edges = [(4, 'A', 'B'), (1, 'A', 'C'), (3, 'B', 'C'), (2, 'B', 'D'), (5, 'C', 'D'), (7, 'D', 'E'), (6, 'C', 'E')]
rejected = []
for w, a, b in sorted(edges):
    if find(a) == find(b):
        rejected.append((w, a, b))
    else:
        parent[find(b)] = find(a)
assert rejected == [(4, 'A', 'B'), (5, 'C', 'D'), (7, 'D', 'E')]
expected = ['Rejected: (4, A, B)', '(5, C, D)', 'and (7, D, E)']
''',
    'data-structures-algorithms/union-find-mst/2': '''
parent = {x: x for x in 'ABCDE'}
def find(x):
    while parent[x] != x:
        x = parent[x]
    return x
edges = [(4, 'A', 'B'), (1, 'A', 'C'), (3, 'B', 'C'), (2, 'B', 'D'), (5, 'C', 'D'), (7, 'D', 'E')]
total = 0
for w, a, b in sorted(edges):
    if find(a) != find(b):
        parent[find(b)] = find(a)
        total += w
expected = [f'1 + 2 + 3 + 7 = {total}']
''',
    'data-structures-algorithms/union-find-mst/3': '''
parent = {x: x for x in 'ABCDEF'}
def find(x):
    while parent[x] != x:
        x = parent[x]
    return x
for a, b in [('A', 'B'), ('C', 'D'), ('D', 'E')]:
    parent[find(b)] = find(a)
groups = len({find(x) for x in 'ABCDEF'})
expected = [f'so there are {groups} groups', f'here {groups - 1}']
''',
    'data-structures-algorithms/backtracking/1': '''
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
expected = [f'the output is `{subsets([1, 2])}`']
''',
    'data-structures-algorithms/backtracking/2': '''
found = []
def visit(index, chosen, total, items=(1, 2, 3, 4), target=5):
    if total > target:
        return
    if index == len(items):
        if total == target:
            found.append(chosen)
        return
    visit(index + 1, chosen, total)
    visit(index + 1, chosen + [items[index]], total + items[index])
visit(0, [], 0)
assert sorted(found) == [[1, 4], [2, 3]]
expected = ['`[1, 4]` and `[2, 3]`']
''',
    'data-structures-algorithms/backtracking/3': '''
from itertools import permutations
expected = [f'3! = {len(set(permutations("abc")))} orderings', f'3! / 2! = {len(set(permutations("aab")))} distinct ones']
''',
    'data-structures-algorithms/backtracking/4': '''
count = 2 ** 40
hours = count / 100_000_000 / 3600
assert 2.5 < hours < 3.5
expected = [f'about {count / 1e12:.1f} trillion', 'about 3 hours']
''',
    'data-structures-algorithms/knapsack/1': '''
dp, rows = [0] * 6, []
for weight, value in [(2, 3), (3, 4), (4, 5)]:
    for c in range(5, weight - 1, -1):
        dp[c] = max(dp[c], dp[c - weight] + value)
    rows.append(f'`{dp}`')
expected = rows + [f'The answer is {dp[5]}']
''',
    'data-structures-algorithms/knapsack/2': '''
dp = [0] * 5
for c in range(2, 5):  # ascending: the same item can be reused
    dp[c] = max(dp[c], dp[c - 2] + 3)
expected = [f'It returns {dp[4]}']
''',
    'practical-maths-statistics/conditional-probability/1': '''
expected = [f'9 / 90 = {9 / 90:g}', f'81 / 83 ≈ {81 / 83:.3f}']
''',
    'practical-maths-statistics/conditional-probability/2': '''
flagged_bad, flagged_good = 10 * 0.8, 990 * 0.1
expected = [f'8 / 107 ≈ {flagged_bad / (flagged_bad + flagged_good):.3f}', f'about {8 / 17:.3f} in the lesson']
''',
    'practical-maths-statistics/conditional-probability/3': '''
expected = [f'0.15 / 0.5 = {0.15 / 0.5:g}', f'P(A | B) = {0.2 / 0.5:g}']
''',
    'practical-maths-statistics/bayes-and-base-rates/1': '''
flagged = 0.95 * 0.10 + 0.05 * 0.90
expected = [f'= {flagged:.3f}', f'≈ {0.095 / flagged:.3f}']
''',
    'practical-maths-statistics/bayes-and-base-rates/2': '''
flagged = 0.95 * 0.01 + 0.025 * 0.99
expected = [f'= {flagged:.5f}', f'≈ {0.0095 / flagged:.3f}']
''',
    'practical-maths-statistics/bayes-and-base-rates/3': '''
prior = round(0.95 * 0.01 / (0.95 * 0.01 + 0.05 * 0.99), 3)
true, false = 0.95 * prior, 0.05 * (1 - prior)
expected = [f'{true:.3f} / {true + false:.3f} ≈ {true / (true + false):.3f}']
''',
    'practical-maths-statistics/bayes-and-base-rates/4': '''
expected = [f'0.19 / 0.23 ≈ {0.19 / 0.23:.3f}']
''',
    'practical-maths-statistics/expected-value/1': '''
mean = 0.9 * 1 + 0.1 * 11
square = 0.9 * 1 + 0.1 * 121
expected = [f'0.1 × 121 = {square:g}', f'Var = {square:g} − 2² = {square - mean ** 2:g}', f'is {(square - mean ** 2) ** 0.5:g} seconds']
''',
    'practical-maths-statistics/expected-value/2': '''
expected = [f'1 / 0.8 = {1 / 0.8:g} attempts', f'0.2³ = {0.2 ** 3:.3f}']
''',
    'practical-maths-statistics/expected-value/3': '''
expected = [f'0.01 × 400 = {0.01 * 400:g} units']
''',
    'practical-maths-statistics/uncertainty-and-intervals/1': '''
se = 10 / 25 ** 0.5
expected = [f'= {se:g} ms', f'1.96 × 2 = {1.96 * se:.2f} ms', f'[{50 - 1.96 * se:.2f}, {50 + 1.96 * se:.2f}]']
''',
    'practical-maths-statistics/uncertainty-and-intervals/2': '''
import math
root = 1.96 * 10 / 0.5
expected = [f'√n = {root:g}', f'n = {root ** 2:,.2f}', f'{math.ceil(root ** 2):,} measurements']
''',
    'practical-maths-statistics/uncertainty-and-intervals/3': '''
expected = [f'[{50 - 2.576:.3f}, {50 + 2.576:.3f}]']
''',
    'practical-maths-statistics/hypothesis-tests/1': '''
from math import sqrt
from statistics import NormalDist
a_conv, a_n, b_conv, b_n = 80, 1000, 116, 1000
pooled = (a_conv + b_conv) / (a_n + b_n)
z = (b_conv / b_n - a_conv / a_n) / sqrt(pooled * (1 - pooled) * (1 / a_n + 1 / b_n))
expected = [f'z ≈ {z:.3f}', f'p ≈ {2 * (1 - NormalDist().cdf(z)):.4f}']
''',
    'practical-maths-statistics/hypothesis-tests/2': '''
expected = [f'≈ {1 - (1 - 0.05 / 20) ** 20:.4f}']
''',
    'practical-maths-statistics/hypothesis-tests/3': '''
from statistics import NormalDist
from math import sqrt
pooled = 98 / 1000
z = (58 / 500 - 40 / 500) / sqrt(pooled * (1 - pooled) * (2 / 500))
expected = [f'≈ {1 - NormalDist().cdf(z):.4f}']
''',
    'practical-maths-statistics/correlation-and-causation/1': '''
from statistics import correlation
expected = [f'about {correlation([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]):.3f}']
''',
    'practical-maths-statistics/correlation-and-causation/2': '''
from statistics import correlation
xs = [-2, -1, 0, 1, 2]
assert correlation(xs, [x * x for x in xs]) == 0
expected = ['The correlation is 0.']
''',
}
