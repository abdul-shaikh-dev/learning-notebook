"""Characterization tests apply to the tangled starter and each refactor step."""
import unittest
import importlib
import os
import legacy_export
import refactored_export


IMPLEMENTATIONS = (importlib.import_module(os.environ["EXPORT_UNDER_TEST"]),) if os.environ.get("EXPORT_UNDER_TEST") else (legacy_export, refactored_export)


class RefactoringTests(unittest.TestCase):
    def test_same_observable_contract(self):
        for implementation in IMPLEMENTATIONS:
            for kind, expected in (('lines', 'A\nB'), ('json', '["A", "B"]')):
                with self.subTest(implementation=implementation.__name__, kind=kind):
                    source, writes, sizes = [' A ', 'B'], [], []
                    self.assertEqual(implementation.export_titles(source, kind, writes.append, sizes), expected)
                    self.assertEqual((source, writes, sizes), ([' A ', 'B'], [expected], [len(expected)]))

    def test_failure_timing_and_side_effects(self):
        for implementation in IMPLEMENTATIONS:
            for titles, kind, message in [(['A', ' '], 'lines', 'nonblank titles required'),
                                          (['A'], 'xml', 'unknown format')]:
                writes, sizes = [], []
                with self.subTest(implementation=implementation.__name__, message=message):
                    with self.assertRaisesRegex(ValueError, message):
                        implementation.export_titles(titles, kind, writes.append, sizes)
                    self.assertEqual((writes, sizes), ([], []))
            writes, sizes = [], []
            def fail(output):
                writes.append(output)
                raise OSError('destination failed')
            with self.assertRaises(OSError):
                implementation.export_titles(['A'], 'lines', fail, sizes)
            self.assertEqual((writes, sizes), (['A'], []))


if __name__ == '__main__':
    unittest.main()
