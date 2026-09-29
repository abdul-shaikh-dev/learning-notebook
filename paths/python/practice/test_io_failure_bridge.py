import json
import tempfile
import unittest
from pathlib import Path

from io_failure_bridge import save_report

class LocalIOTests(unittest.TestCase):
    def test_valid_input_replaces_report(self):
        with tempfile.TemporaryDirectory() as folder:
            source, target = Path(folder) / "input.json", Path(folder) / "report.json"
            source.write_text('[{"done": true}, {"done": false}]', encoding="utf-8")
            save_report(source, target)
            self.assertEqual(json.loads(target.read_text(encoding="utf-8")), {"completed": 1})

    def test_invalid_input_preserves_old_report(self):
        with tempfile.TemporaryDirectory() as folder:
            source, target = Path(folder) / "input.json", Path(folder) / "report.json"
            target.write_text('old report', encoding="utf-8")
            source.write_text('[{"done": "yes"}]', encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "boolean done"):
                save_report(source, target)
            self.assertEqual(target.read_text(encoding="utf-8"), 'old report')
            self.assertEqual(list(Path(folder).glob('.report-*.tmp')), [])

    def test_missing_input_preserves_old_report(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "report.json"
            target.write_text('old report', encoding="utf-8")
            with self.assertRaises(FileNotFoundError):
                save_report(Path(folder) / "missing.json", target)
            self.assertEqual(target.read_text(encoding="utf-8"), 'old report')

if __name__ == "__main__":
    unittest.main()
