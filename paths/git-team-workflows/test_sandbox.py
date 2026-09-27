import tempfile
from pathlib import Path
import unittest
from sandbox import Sandbox, run_stage

class SandboxTests(unittest.TestCase):
    def test_foundation(self):
        result=run_stage('foundation')['results'][0]
        self.assertEqual(result['staged_snapshot'],'two')
        self.assertTrue(result['ignored_untracked'])
    def test_intermediate(self):
        result=run_stage('intermediate')['results'][0]
        self.assertTrue(result['conflict_resolved'])
        self.assertTrue(result['fetch_preserved_local_head'])
    def test_advanced(self):
        result=run_stage('advanced')['results'][0]
        self.assertTrue(result['rebase_changed_identity'])
        self.assertTrue(result['annotated_tag'])
        self.assertEqual(result['reverted_content'],'safe')
    def test_escape_and_push_rejected(self):
        with tempfile.TemporaryDirectory(prefix='ln-git-owned-test-') as directory:
            box=Sandbox(directory)
            with self.assertRaises(ValueError): box.run(Path(directory).parent,'status')
            with self.assertRaises(ValueError): box.run(Path(directory),'push','origin')
            self.assertEqual(box.config.read_text(encoding='utf-8'),'')

if __name__=='__main__': unittest.main()
