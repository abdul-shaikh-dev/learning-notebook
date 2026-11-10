"""Shared check for practice-ladder answers computed by a course's facts script.

Each fact is keyed "<lesson>/<step>" and returns strings that the step's worked solution must contain,
so a numeric or program-output answer cannot drift from the code that produces it.
"""
import json


def practice_failures(course_dir, facts):
    lessons = {l['id']: l for l in json.loads((course_dir / 'path.json').read_text(encoding='utf-8'))['lessons']}
    failures = []
    for key, fact in facts.items():
        lesson, n = key.split('/')
        steps = lessons.get(lesson, {}).get('practice', [])
        if not n.isdigit() or not 1 <= int(n) <= len(steps):
            failures.append(f'practice {key}: no such step')
            continue
        solution = steps[int(n) - 1]['solution']
        try:
            expected = fact()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'practice {key}: {error}')
            continue
        failures += [f'practice {key}: solution should state {text!r}' for text in expected if text not in solution]
    return failures
