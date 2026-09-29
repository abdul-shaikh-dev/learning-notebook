"""One-sided test executes every statement but not every branch."""


def label(minutes):
    result = "empty"
    if minutes > 0:
        result = "active"
    return result
