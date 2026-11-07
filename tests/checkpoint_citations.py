"""Shared checks for checkpoint answers that come from a course's own text.

A course's facts test lists each answer that follows from the text as key: (source, phrase). The source
is a lesson ID, 'stage:<stage ID>' or a file in the course's practice folder, and the phrase must appear
in that source word for word (ignoring runs of whitespace). The check fails when a source does not
exist, when the phrase is not found there, or when a question has neither a computed fact nor a
citation. Computed facts return the text of the option the result supports, as in the other courses.
"""
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)


def flat(text):
    return re.sub(r'\s+', ' ', text).strip()


def questions(course):
    data = json.loads((course / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def source_text(course, path, source):
    if source.startswith('stage:'):
        stage = next((s for s in path['stages'] if s['id'] == source[6:]), None)
        return None if stage is None else flat(' '.join(strings(stage)))
    lesson = next((l for l in path['lessons'] if l['id'] == source), None)
    if lesson is not None:
        return flat(' '.join(strings(lesson)))
    file = course / 'practice' / source
    return flat(file.read_text(encoding='utf-8')) if file.is_file() else None


def check(course_id, title, facts, sourced):
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')
    course = ROOT / 'paths' / course_id
    path = json.loads((course / 'path.json').read_text(encoding='utf-8'))
    seen, failures = set(), []
    for key, q in questions(course):
        seen.add(key)
        marked = q['options'][q['correct']]
        if key in sourced:
            source, phrase = sourced[key]
            text = source_text(course, path, source)
            if text is None:
                failures.append(f'{key}: cited source {source!r} does not exist')
            elif flat(phrase) not in text:
                failures.append(f'{key}: {source} does not contain {phrase!r}')
            continue
        if key not in facts:
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            answer = facts[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != marked:
            failures.append(f'{key}: the check supports {answer!r}, the question marks {marked!r}')
    failures += [f'{key}: entry has no question' for key in set(facts) | set(sourced) if key not in seen]
    failures += [f'{key}: has both a fact and a citation' for key in set(facts) & set(sourced)]
    if failures:
        sys.exit(f'{title} checkpoint facts failed:\n' + '\n'.join(failures))
    computed = f'{len(facts)} {title} checkpoint answers computed and checked; ' if facts else f'{title}: '
    print(f'PASS: {computed}{len(sourced)} answers checked against the lesson or kit text they cite.')
