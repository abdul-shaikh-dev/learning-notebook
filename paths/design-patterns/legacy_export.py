"""Intentionally tangled starter. Preserve public observations before refactoring."""
import json


def export_titles(titles, kind, writer, successes):
    # Validation, format selection, formatting, delivery and measurement are mixed.
    checked = []
    for title in titles:
        if not isinstance(title, str) or not title.strip():
            raise ValueError('nonblank titles required')
        checked.append(title.strip())
    if kind == 'lines':
        output = '\n'.join(checked)
    elif kind == 'json':
        output = json.dumps(checked, ensure_ascii=False)
    else:
        raise ValueError('unknown format')
    writer(output)
    successes.append(len(output))
    return output
