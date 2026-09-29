import tempfile
import unittest
from pathlib import Path

from durable_state import StateStore
from harness_workshop import Harness, tool
from persisted_run_lab import SQLiteEffects, restore_checkpoint, save_checkpoint


SCRIPT = [tool('save_note', {'lesson_id': 'L1', 'text': 'Index tradeoff.'}, 'C1'),
          {'kind': 'final', 'text': 'The note is saved.'}]


class PersistedRunTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.path = Path(self.folder.name) / 'run.sqlite'

    def open_pair(self):
        return StateStore(self.path), SQLiteEffects(self.path)

    def test_lost_reply_uncertain_state_survives_restart(self):
        state, effects = self.open_pair()
        try:
            run = Harness(SCRIPT, effects, run_id='R', subject='A')
            self.assertEqual(run.run(), 'waiting')
            version = save_checkpoint(state, run, 0)
            effects.lose_reply_once = True
            run.approve(run.fingerprint())
            self.assertEqual(run.status, 'uncertain')
            version = save_checkpoint(state, run, version)
        finally:
            state.close(); effects.close()
        state, effects = self.open_pair()
        try:
            version, run = restore_checkpoint(state, effects, SCRIPT, run_id='R', subject='A')
            self.assertEqual(run.status, 'uncertain')
            self.assertEqual(effects.effect_count(), 1)
            self.assertTrue(run.reconcile())
            self.assertEqual(run.run(), 'done')
            save_checkpoint(state, run, version)
            self.assertEqual(effects.effect_count(), 1)
        finally:
            state.close(); effects.close()

    def test_effect_commit_before_checkpoint_save_is_reconciled(self):
        state, effects = self.open_pair()
        try:
            run = Harness(SCRIPT, effects, run_id='R', subject='A')
            run.run(); save_checkpoint(state, run, 0)
            effects.lose_reply_once = True
            run.approve(run.fingerprint())
            # Simulated process death: uncertain state is NOT checkpointed.
        finally:
            state.close(); effects.close()
        state, effects = self.open_pair()
        try:
            version, recovered = restore_checkpoint(state, effects, SCRIPT, run_id='R', subject='A')
            self.assertEqual(recovered.status, 'uncertain')
            self.assertTrue(recovered.reconcile())
            self.assertEqual(recovered.run(), 'done')
            self.assertEqual(effects.effect_count(), 1)
        finally:
            state.close(); effects.close()

    def test_retry_same_operation_reads_receipt_without_second_effect(self):
        state, effects = self.open_pair()
        try:
            run = Harness(SCRIPT, effects, run_id='R', subject='A')
            run.run()
            action = run.pending
            key, fingerprint = run._key(action), run.fingerprint(action)
            first = effects.save(key, fingerprint, 'A', action['args'])
            self.assertEqual(effects.save(key, fingerprint, 'A', action['args']), first)
            self.assertEqual(effects.effect_count(), 1)
            from harness_workshop import IntentConflict
            with self.assertRaises(IntentConflict):
                effects.save(key, 'changed-fingerprint', 'A', action['args'])
            self.assertEqual(effects.effect_count(), 1)
        finally:
            state.close(); effects.close()

    def test_unexecuted_waiting_run_requires_fresh_approval(self):
        state, effects = self.open_pair()
        try:
            run = Harness(SCRIPT, effects, run_id='R', subject='A')
            run.run(); save_checkpoint(state, run, 0)
        finally:
            state.close(); effects.close()
        state, effects = self.open_pair()
        try:
            _, recovered = restore_checkpoint(state, effects, SCRIPT, run_id='R', subject='A')
            self.assertEqual(recovered.status, 'waiting')
            self.assertEqual(effects.effect_count(), 0)
            recovered.approve(recovered.fingerprint())  # trusted host supplies new approval
            self.assertEqual(recovered.run(), 'done')
        finally:
            state.close(); effects.close()


if __name__ == '__main__':
    unittest.main()
