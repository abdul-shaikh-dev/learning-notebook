"""Descriptive summaries and a deliberately restricted interval model."""
import math
from statistics import mean, median, variance
from foundation_project import finite

def summarize(values):
    values = [finite(v) for v in values]
    if len(values) < 2:
        raise ValueError("at least two observations required")
    return {"n": len(values), "mean": mean(values), "median": median(values),
            "sample_variance": variance(values)}

def conditional_count(joint, conditioned):
    if (type(joint) is not int or type(conditioned) is not int
            or conditioned <= 0 or not 0 <= joint <= conditioned):
        raise ValueError("valid counts and nonempty condition required")
    return joint / conditioned

def known_sigma_interval(average, sigma, n):
    average, sigma = finite(average), finite(sigma)
    if sigma < 0 or type(n) is not int or n <= 0:
        raise ValueError("nonnegative sigma and positive integer n required")
    margin = 1.96 * sigma / math.sqrt(n)
    return average - margin, average + margin

if __name__ == "__main__":
    print(summarize([10,10,10,10,100]))
    print(round(conditional_count(8,17),4))
    print(known_sigma_interval(50,10,100))
