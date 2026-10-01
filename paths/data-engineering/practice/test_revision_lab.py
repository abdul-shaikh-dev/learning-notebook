import sqlite3
import unittest
from revision_lab import initialize, apply, totals, event

class RevisionTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:');initialize(self.db);self.addCleanup(self.db.close)
    def test_replay_and_conflict(self):
        apply(self.db,event(1));self.assertEqual(apply(self.db,event(1)),'replay')
        with self.assertRaises(ValueError):apply(self.db,event(1,999))
        self.assertEqual(totals(self.db),{'2026-09-28':100})
    def test_out_of_order_and_delete(self):
        apply(self.db,event(2,150));self.assertEqual(apply(self.db,event(1)),'stale')
        apply(self.db,event(3,0,deleted=True));apply(self.db,event(2,150))
        self.assertEqual(totals(self.db),{})
    def test_move_recomputes_both_days(self):
        apply(self.db,event(1));apply(self.db,event(2,120,'2026-09-29'))
        self.assertEqual(totals(self.db),{'2026-09-29':120})
    def test_invalid_preserves_state(self):
        apply(self.db,event(1))
        for invalid in [event(True),event(2,-1),event(2,day='bad'),event(2,5,deleted=True)]:
            with self.assertRaises(ValueError):apply(self.db,invalid)
            self.assertEqual(totals(self.db),{'2026-09-28':100})
if __name__=='__main__':unittest.main()
