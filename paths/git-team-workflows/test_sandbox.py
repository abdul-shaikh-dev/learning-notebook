import tempfile
import json
from pathlib import Path
import unittest
from sandbox import Sandbox, run_stage
from review_roleplay import exercise

class SandboxTests(unittest.TestCase):
    def test_local_reviewer_feedback_and_revised_candidate(self):
        with tempfile.TemporaryDirectory(prefix='ln-review-test-') as root:
            result=exercise(root)
            self.assertNotEqual(result['first_candidate'],result['revised_candidate'])
            self.assertIn('rollback',result['feedback'])
            self.assertIn('smoke check and rollback',result['reviewer_verified'])
            self.assertEqual(json.loads((Path(root)/'review-evidence.json').read_text(encoding='utf-8'))['revised_candidate'],
                             result['revised_candidate'])
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
    def test_retained_workspace_and_evidence(self):
        with tempfile.TemporaryDirectory(prefix='ln-git-owned-test-') as parent:
            sentinel=Path(parent)/'user-work.txt'
            sentinel.write_text('keep',encoding='utf-8')
            result=run_stage('all',parent)
            root=Path(result['workspace'])
            self.assertEqual(root.parent,Path(parent).resolve())
            self.assertTrue(result['retained'])
            self.assertEqual(sentinel.read_text(encoding='utf-8'),'keep')
            self.assertTrue((root/'evidence.json').is_file())
            # Re-open the retained repositories after the generator has returned.
            box=Sandbox.__new__(Sandbox)
            box.root=root
            box.config=root/'empty-config'; box.hooks=root/'empty-hooks'
            import shutil, os
            box.git=shutil.which('git'); box.transcript=[]
            box.env={key:value for key,value in os.environ.items() if not key.startswith('GIT_')}
            box.env.update(GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL=str(box.config),
                           GIT_CONFIG_SYSTEM=str(box.config),GIT_ALLOW_PROTOCOL='file')
            for item in result['results']:
                repo=Path(item['repository'])
                self.assertEqual(box.run(repo,'rev-parse','HEAD'),item['candidate_commit'])
                self.assertTrue(item['ref_graph'])
            foundation, intermediate, advanced=result['results']
            self.assertEqual(box.run(Path(foundation['repository']),'show',
                                    foundation['first_commit']+':notes.txt'),'one')
            self.assertIn('+two',foundation['staged_diff'])
            self.assertIn('+three',foundation['working_diff'])
            self.assertEqual(box.run(Path(intermediate['reviewer_repository']),'rev-parse','HEAD'),
                             intermediate['candidate_commit'])
            self.assertEqual(advanced['tag_commit'],advanced['candidate_commit'])
            self.assertEqual(box.run(Path(advanced['repository']),'cat-file','-t',advanced['tag_object']),'tag')
            self.assertTrue(any(entry['args']==['fetch','origin'] for entry in result['transcript']))
            second=run_stage('foundation',parent)
            self.assertNotEqual(second['workspace'],result['workspace'])
            self.assertTrue(root.is_dir())

    def test_temporary_verifier_removes_owned_workspace(self):
        result=run_stage('foundation')
        self.assertFalse(result['retained'])
        self.assertFalse(Path(result['workspace']).exists())

    def test_escape_and_push_rejected(self):
        with tempfile.TemporaryDirectory(prefix='ln-git-owned-test-') as directory:
            box=Sandbox(directory)
            with self.assertRaises(ValueError): box.run(Path(directory).parent,'status')
            with self.assertRaises(ValueError): box.run(Path(directory),'push','origin')
            self.assertEqual(box.config.read_text(encoding='utf-8'),'')

if __name__=='__main__': unittest.main()
