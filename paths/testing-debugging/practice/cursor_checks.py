"""python cursor_checks.py cursor_candidate reproduces failures;
python cursor_checks.py checks the corrected reference.
"""
import importlib
import sys
import unittest
name=sys.argv.pop(1) if len(sys.argv)>1 and not sys.argv[1].startswith('-') else 'cursor_reference'
page=importlib.import_module(name).page

class CursorContract(unittest.TestCase):
    def test_no_skipped_ties_across_pages(self):
        rows=[{'time':5,'id':'c'},{'time':5,'id':'a'},{'time':5,'id':'b'},{'time':6,'id':'d'}]
        first,cursor=page(rows,limit=2); second,_=page(rows,cursor,2)
        self.assertEqual([r['id'] for r in first+second],['a','b','c','d'])
    def test_returned_row_cannot_change_source(self):
        rows=[{'time':5,'id':'a'}]
        result,_=page(rows); result[0]['id']='changed'
        self.assertEqual(rows[0]['id'],'a')
    def test_exact_boundary_empty_and_invalid_limit(self):
        self.assertEqual(page([],limit=1),([],None))
        self.assertEqual(page([{'time':5,'id':'a'}],(5,'a'),1),([],None))
        with self.assertRaises(ValueError):page([],limit=0)
    def test_full_walk_matches_sorted_oracle(self):
        # Different batch sizes should not change the reconstructed sequence.
        rows=[{'time':i//3,'id':str(i).zfill(2)} for i in range(17)]
        want=sorted(rows,key=lambda row:(row['time'],row['id']))
        for size in [1,2,3,5,100]:
            got=[]; cursor=None
            for _ in range(len(rows)+1):
                batch,cursor=page(list(reversed(rows)),cursor,size)
                if not batch:break
                got.extend(batch)
            else:self.fail('cursor did not terminate')
            self.assertEqual(got,want)

if __name__=='__main__':unittest.main()
