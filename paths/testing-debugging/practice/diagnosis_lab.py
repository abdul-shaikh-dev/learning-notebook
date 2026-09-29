"""Small observable defects, cancellation cleanup and a bounded timing experiment."""
import asyncio
from statistics import median
from time import perf_counter_ns


def inclusive_total_mutant(values, stop):
    """DELIBERATE BUG: contract includes index stop, but the slice excludes it."""
    return sum(values[:stop])


def inclusive_total(values, stop):
    if type(stop) is not int or not 0 <= stop < len(values):
        raise ValueError("stop must name an existing index")
    return sum(values[:stop + 1])


async def collect_once(started, release, events):
    """Synthetic resource: ready handshake, cancellable work, unconditional cleanup."""
    events.append("acquired")
    try:
        started.set()
        await release.wait()
        events.append("committed")
        return 7
    finally:
        events.append("released")


def repeated_scan(rows, wanted):
    return [next((value for key, value in rows if key == item), None) for item in wanted]


def indexed_lookup(rows, wanted):
    # Include construction in every measured call: do not hide setup cost.
    index = dict(rows)
    return [index.get(item) for item in wanted]


def benchmark(size=2000, queries=200, samples=9):
    """Unique keys only; both implementations must match before timing."""
    if any(type(x) is not int or x <= 0 for x in (size, queries, samples)):
        raise ValueError("positive integer dimensions required")
    rows = [(i, i * 2) for i in range(size)]
    wanted = [(i * 17) % (size + 1) for i in range(queries)]
    expected = [i * 2 if i < size else None for i in wanted]
    results = {}
    for fn in (repeated_scan, indexed_lookup):
        assert fn(rows, wanted) == expected
        for _ in range(3):
            fn(rows, wanted)
        durations = []
        for _ in range(samples):
            start = perf_counter_ns()
            actual = fn(rows, wanted)
            durations.append(perf_counter_ns() - start)
            assert actual == expected
        results[fn.__name__] = {"median_ns": median(durations), "samples_ns": durations}
    return results


if __name__ == "__main__":
    import sys
    if "--benchmark" in sys.argv:
        print(benchmark())
    else:
        values, stop = [4, 8, 16], 1
        observed = inclusive_total_mutant(values, stop)
        print(f"Expected inclusive total 12; observed {observed}. Deliberate defect for pdb.")
