"""Run against your implementation: python summary_checks.py my_summary.
With no argument, checks the supplied reference. A fresh list is supplied per case.
"""
import importlib
import unittest
import sys
from copy import deepcopy
module = sys.argv.pop(1) if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else 'summary_reference'
summarize = importlib.import_module(module).summarize

class SummaryChecks(unittest.TestCase):
    def test_group_order_and_no_mutation(self):
        rows=[{'id':'a','topic':' Python ','minutes':20}, {'id':'b','topic':'SQL','minutes':30}, {'id':'c','topic':'Python','minutes':10}]
        before=deepcopy(rows)
        self.assertEqual(summarize(rows), [('Python',30),('SQL',30)])
        self.assertEqual(rows,before)
    def test_empty_and_zero(self):
        self.assertEqual(summarize([]),[])
        self.assertEqual(summarize([{'id':'a','topic':'X','minutes':0}]),[('X',0)])
    def test_rejects_boundary_and_shape(self):
        for minutes in [True,-1,1441,1.5,'5',None]:
            with self.subTest(minutes=minutes), self.assertRaises(ValueError):
                summarize([{'id':'a','topic':'X','minutes':minutes}])
        for row in [{}, {'id':'a','topic':' ','minutes':5}, {'id':'a','topic':'X','minutes':5,'extra':1}]:
            with self.subTest(row=row), self.assertRaises(ValueError): summarize([row])
    def test_duplicate_and_fresh_results(self):
        row={'id':'a','topic':'X','minutes':5}
        with self.assertRaises(ValueError): summarize([row,row])
        first=summarize([row]); first.append(('bad',9))
        self.assertEqual(summarize([row]),[('X',5)])
    def test_transfer_permutation_and_split(self):
        rows=[{'id':'a','topic':'X','minutes':7},{'id':'b','topic':'Y','minutes':4}]
        self.assertEqual(summarize(rows),summarize(list(reversed(rows))))
        split=[{'id':'a1','topic':'X','minutes':3},{'id':'a2','topic':'X','minutes':4},rows[1]]
        self.assertEqual(summarize(rows),summarize(split))

if __name__ == '__main__': unittest.main()
