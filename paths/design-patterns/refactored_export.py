"""Small, behavior-preserving endpoint for the regression-led refactor exercise."""
from workshop import validate_titles, formatter_for


def deliver(formatted, writer, successes):
    writer(formatted)
    successes.append(len(formatted))
    return formatted


def export_titles(titles, kind, writer, successes):
    checked = validate_titles(titles)
    formatter = formatter_for(kind)
    return deliver(formatter(checked), writer, successes)
