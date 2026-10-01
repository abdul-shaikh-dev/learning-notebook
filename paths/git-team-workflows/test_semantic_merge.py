import tempfile
import unittest
from pathlib import Path
from semantic_merge import exercise

class Collaboration(unittest.TestCase):
    def test_clean_merge_requires_behavior_review(self):
        with tempfile.TemporaryDirectory(prefix='ln-merge-test-',ignore_cleanup_errors=True) as root:
            evidence=exercise(Path(root))
            self.assertFalse(evidence['clean_merge_behavior']['valid'])
            self.assertTrue(evidence['repaired_behavior']['valid'])
            self.assertTrue(evidence['source_unchanged'])
            self.assertNotEqual(evidence['merge'],evidence['repaired'])
            self.assertFalse(any(command['args'][0]=='push' for command in evidence['commands']))

if __name__=='__main__':unittest.main()
