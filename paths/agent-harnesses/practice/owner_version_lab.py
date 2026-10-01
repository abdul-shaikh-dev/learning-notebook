"""Two-connection stale-checkpoint exercise; deliberately not effect fencing."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from durable_state import StateStore, Conflict

class OwnershipTests(unittest.TestCase):
    def test_loser_reloads_before_retry(self):
        with TemporaryDirectory() as folder:
            a=StateStore(Path(folder)/'state.db');b=StateStore(Path(folder)/'state.db')
            try:
                a.save('run',0,{'notes':['start']})
                av,astate=a.load('run');bv,bstate=b.load('run')
                astate['notes'].append('A');a.save('run',av,astate)
                bstate['notes'].append('B')
                with self.assertRaises(Conflict):b.save('run',bv,bstate)
                self.assertEqual(a.load('run'),(2,{'notes':['start','A']}))
                version,fresh=b.load('run');fresh['notes'].append('B')
                b.save('run',version,fresh)
                self.assertEqual(a.load('run'),(3,{'notes':['start','A','B']}))
            finally:a.close();b.close()
    def test_creation_race_preserves_winner(self):
        with TemporaryDirectory() as folder:
            a=StateStore(Path(folder)/'state.db');b=StateStore(Path(folder)/'state.db')
            try:
                self.assertIsNone(a.load('new'));self.assertIsNone(b.load('new'))
                a.save('new',0,{'owner':'A'})
                with self.assertRaises(Conflict):b.save('new',0,{'owner':'B'})
                self.assertEqual(b.load('new'),(1,{'owner':'A'}))
            finally:a.close();b.close()
if __name__=='__main__':unittest.main()
