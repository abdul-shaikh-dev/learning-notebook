"""Educational sequential, in-memory pattern workshop. Python 3.11+."""
from contextlib import contextmanager
from dataclasses import dataclass, replace
import json


def validate_titles(titles):
    result = []
    for title in titles:
        if not isinstance(title, str) or not title.strip():
            raise ValueError('nonblank titles required')
        result.append(title.strip())
    return tuple(result)


def formatter_for(name):
    if name == 'lines':
        return lambda titles: '\n'.join(titles)
    if name == 'json':
        return lambda titles: json.dumps(titles, ensure_ascii=False)
    raise ValueError('unknown format')


def measured(formatter, sizes):
    def wrapped(titles):
        result = formatter(titles)
        sizes.append(len(result))
        return result
    return wrapped


def export_preview(titles, formatter):
    """Validate before delegating; no file or network side effects."""
    return formatter(validate_titles(titles))


class MinutesAdapter:
    def __init__(self, seconds_source):
        self.seconds_source = seconds_source

    def minutes(self):
        seconds = self.seconds_source()
        if type(seconds) is not int or seconds < 0:
            raise ValueError('nonnegative integer seconds required')
        return seconds // 60


@dataclass(frozen=True)
class Lesson:
    id: str
    title: str
    state: str = 'active'

    def __post_init__(self):
        if not isinstance(self.id, str) or not self.id.strip():
            raise ValueError('nonblank id required')
        if not isinstance(self.title, str) or not self.title.strip():
            raise ValueError('nonblank title required')
        if self.state not in ('draft', 'active', 'done'):
            raise ValueError('unknown state')


class Repository:
    def __init__(self, rows):
        self.rows = rows

    def get(self, id):
        return self.rows.get(id)

    def add(self, lesson):
        if lesson.id in self.rows:
            raise ValueError('duplicate id')
        self.rows[lesson.id] = lesson

    def replace(self, lesson):
        if lesson.id not in self.rows:
            raise ValueError('missing id')
        self.rows[lesson.id] = lesson


@contextmanager
def unit_of_work(store, repository_type=Repository):
    """Shallow copy is sufficient for these immutable Lesson values.

    Body failure leaves the original unchanged. Publication is NOT atomic for
    concurrent observers, crash-safe, durable or a database transaction.
    """
    working = dict(store)
    yield repository_type(working)
    store.clear()
    store.update(working)


def complete_lesson(store, id, repository_type=Repository):
    """Require active -> done; repeated completion is explicitly rejected."""
    with unit_of_work(store, repository_type) as repo:
        lesson = repo.get(id)
        if lesson is None:
            raise ValueError('missing lesson')
        if lesson.state != 'active':
            raise ValueError('only active lessons can complete')
        repo.replace(replace(lesson, state='done'))


def demo():
    sizes = []
    formatter = measured(formatter_for('json'), sizes)
    print(export_preview([' Patterns ', 'SQL'], formatter))
    print('Successful output characters:', sizes)
    store = {'1': Lesson('1', 'Patterns')}
    complete_lesson(store, '1')
    print('State:', store['1'].state)


if __name__ == '__main__':
    demo()
