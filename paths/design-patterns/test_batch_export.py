import unittest
from copy import deepcopy
from batch_export_legacy import export_batch as legacy
from batch_export_refactor import export_batch as refactored, MemoryStore

class RefactorContract(unittest.TestCase):
    def test_same_observable_success(self):
        rows=[{'id':'1','owner':'A','title':' One '},{'id':'2','owner':'A','title':'Café'}]
        for kind,want in [('lines','One\nCafé'),('json','["One", "Café"]')]:
            snapshots=[]
            for implementation in (legacy,refactored):
                store=MemoryStore(); before=deepcopy(rows)
                self.assertEqual(implementation(rows,'A',kind,0,store),want)
                self.assertEqual(rows,before)
                self.assertEqual(store.snapshot.history,(2,))
                snapshots.append(store.snapshot)
            self.assertEqual(*snapshots)
    def test_late_rejection_has_no_partial_write(self):
        good={'id':'1','owner':'A','title':'One'}
        for bad,error in [({'id':'2','owner':'B','title':'Two'},PermissionError),
                          ({'id':'2','owner':'A','title':' '},ValueError),(good,ValueError)]:
            for implementation in (legacy,refactored):
                store=MemoryStore(); before=store.snapshot
                with self.assertRaises(error):implementation([good,bad],'A','lines',0,store)
                self.assertIs(store.snapshot,before)
    def test_stale_and_failure_keep_payload_and_history(self):
        for implementation in (legacy,refactored):
            store=MemoryStore(); before=store.snapshot
            with self.assertRaises(ValueError):implementation([],'A','json',1,store)
            store.fail=True
            with self.assertRaises(OSError):implementation([],'A','json',0,store)
            self.assertIs(store.snapshot,before)
    def test_empty_and_unknown_format_are_distinct(self):
        for implementation in (legacy,refactored):
            store=MemoryStore()
            with self.assertRaises(ValueError):implementation([],'A','csv',0,store)
            self.assertEqual(implementation([],'A','json',0,store),'[]')
            self.assertEqual(store.snapshot.history,(0,))

if __name__=='__main__':unittest.main()
