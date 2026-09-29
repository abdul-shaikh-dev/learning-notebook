from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from distinct_artifact_drill import drill, running


class ArtifactDrillTests(unittest.TestCase):
    def test_distinct_artifacts_gate_and_rollback(self):
        result = drill()
        self.assertNotEqual(*result['artifact_sha256'].values())
        self.assertEqual((result['eligible_note_reads'], result['good_note_reads']), (3, 3))
        self.assertTrue(result['candidate_readiness_denied_before_gate'])
        self.assertTrue(result['rollback_retained_note'])

    def test_unresponsive_artifact_has_bounded_startup(self):
        with TemporaryDirectory() as folder:
            artifact = Path(folder)/'stuck.py'
            artifact.write_text('import time; time.sleep(30)\n', encoding='utf-8')
            with self.assertRaises(TimeoutError):
                with running(artifact, Path(folder)/'db', 'stuck', startup_timeout=.2):
                    self.fail('unresponsive artifact must not be admitted')


if __name__ == '__main__': unittest.main()
