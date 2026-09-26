import json
import unittest
from workshop import (Lesson, Repository, MinutesAdapter, complete_lesson,
                      export_preview, formatter_for, measured, unit_of_work)


class ExportTests(unittest.TestCase):
    def test_compatible_formats_and_no_mutation(self):
        titles = [' A ', 'B']
        self.assertEqual(export_preview(titles, formatter_for('lines')), 'A\nB')
        self.assertEqual(json.loads(export_preview(titles, formatter_for('json'))), ['A', 'B'])
        self.assertEqual(titles, [' A ', 'B'])

    def test_empty_input(self):
        self.assertEqual(export_preview([], formatter_for('lines')), '')
        self.assertEqual(json.loads(export_preview([], formatter_for('json'))), [])

    def test_validation_precedes_formatter(self):
        calls = []
        for invalid in ('', ' ', None, 3, True):
            with self.subTest(invalid=invalid):
                with self.assertRaises(ValueError):
                    export_preview(['valid', invalid], calls.append)
        self.assertEqual(calls, [])

    def test_unknown_format(self):
        with self.assertRaises(ValueError):
            formatter_for('unsupported')

    def test_measure_once_only_after_success(self):
        calls, sizes = [], []
        def formatter(titles):
            calls.append(titles)
            return '|'.join(titles)
        self.assertEqual(measured(formatter, sizes)(('A', 'BC')), 'A|BC')
        self.assertEqual(calls, [('A', 'BC')])
        self.assertEqual(sizes, [4])

    def test_formatter_failure_visible_and_not_counted(self):
        sizes = []
        error = RuntimeError('formatter failed')
        def broken(titles):
            raise error
        with self.assertRaises(RuntimeError) as caught:
            measured(broken, sizes)(('A',))
        self.assertIs(caught.exception, error)
        self.assertEqual(sizes, [])

    def test_adapter_boundaries(self):
        for seconds, expected in ((0, 0), (59, 0), (60, 1), (61, 1), (125, 2)):
            with self.subTest(seconds=seconds):
                self.assertEqual(MinutesAdapter(lambda: seconds).minutes(), expected)
        for invalid in (-1, True, 1.5, '60', None):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                MinutesAdapter(lambda: invalid).minutes()


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.store = {'1': Lesson('1', 'Patterns'), '2': Lesson('2', 'SQL', 'draft')}

    def test_completes_only_target(self):
        before_other = self.store['2']
        complete_lesson(self.store, '1')
        self.assertEqual(self.store['1'].state, 'done')
        self.assertIs(self.store['2'], before_other)

    def test_missing_or_illegal_transition_unchanged(self):
        before = dict(self.store)
        for id in ('missing', '2'):
            with self.subTest(id=id), self.assertRaises(ValueError):
                complete_lesson(self.store, id)
            self.assertEqual(self.store, before)

    def test_repeat_is_rejected(self):
        complete_lesson(self.store, '1')
        before = dict(self.store)
        with self.assertRaises(ValueError):
            complete_lesson(self.store, '1')
        self.assertEqual(self.store, before)

    def test_body_failure_rolls_back_prior_working_change(self):
        before = dict(self.store)
        with self.assertRaises(RuntimeError):
            with unit_of_work(self.store) as repo:
                repo.add(Lesson('3', 'React'))
                raise RuntimeError('abort after change')
        self.assertEqual(self.store, before)

    def test_repository_failure_after_mutation_does_not_publish(self):
        class FailingRepository(Repository):
            def replace(self, lesson):
                super().replace(lesson)
                raise RuntimeError('simulated adapter failure')
        before = dict(self.store)
        with self.assertRaises(RuntimeError):
            complete_lesson(self.store, '1', FailingRepository)
        self.assertEqual(self.store, before)

    def test_duplicate_does_not_replace_existing(self):
        before = dict(self.store)
        with self.assertRaises(ValueError):
            with unit_of_work(self.store) as repo:
                repo.add(Lesson('1', 'Replacement'))
        self.assertEqual(self.store, before)

    def test_entity_invariants(self):
        for args in (('', 'A'), ('1', ''), ('1', 'A', 'unknown')):
            with self.subTest(args=args), self.assertRaises(ValueError):
                Lesson(*args)


if __name__ == '__main__':
    unittest.main()
