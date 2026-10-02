"""Unit-aware calculations. Python 3.11+, standard library only."""
import math

def finite(value):
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError("finite number required")
    return value

def rate(count, seconds):
    count, seconds = finite(count), finite(seconds)
    if count < 0 or seconds <= 0:
        raise ValueError("nonnegative count and positive seconds required")
    return count / seconds

def relative_change(old, new):
    old, new = finite(old), finite(new)
    if old <= 0 or new < 0:
        raise ValueError("positive base and nonnegative new count required")
    return (new - old) / old

def combined_rate(counts, durations):
    if not counts or len(counts) != len(durations):
        raise ValueError("nonempty matching observations required")
    for count, seconds in zip(counts, durations):
        rate(count, seconds)
    return rate(sum(counts), sum(durations))

if __name__ == "__main__":
    print(combined_rate([100,100], [10,30]))
    print(relative_change(50,40))
