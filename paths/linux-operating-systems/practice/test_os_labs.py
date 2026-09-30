"""Portable direct-child execution and deterministic reasoning checks."""
import subprocess
import unittest
from diagnostic_lab import run_python, classify, backlog

class OSLabs(unittest.TestCase):
    def test_success(self):
        result=run_python('print(42)')
        self.assertEqual((result.status,result.stdout,result.stderr),(0,'42\n',''))
    def test_streams_and_failure(self):
        result=run_python('import sys; print("report"); print("invalid",file=sys.stderr); sys.exit(3)')
        self.assertEqual((result.status,result.stdout,result.stderr),(3,'report\n','invalid\n'))
    def test_argument_boundaries(self):
        value='one two; $(literal)'
        result=run_python('import sys; print(len(sys.argv)-1); print(sys.argv[1])',[value])
        self.assertEqual(result.stdout,'1\n'+value+'\n')
    def test_timeout(self):
        with self.assertRaises(subprocess.TimeoutExpired):
            run_python('import time; time.sleep(5)',timeout=0.2)
    def test_bounds(self):
        for source,args,timeout in [('x'*4097,(),2),('pass',('x'*257,),2),('pass',(),0)]:
            with self.assertRaises(ValueError): run_python(source,args,timeout)
    def test_categories(self):
        self.assertEqual(classify(PermissionError()),'access')
        self.assertEqual(classify(FileNotFoundError()),'configuration')
        self.assertEqual(classify(ValueError()),'application validation')
        self.assertTrue(classify(RuntimeError()).startswith('unclassified'))
    def test_growth_and_drain(self):
        self.assertEqual(backlog(14,10,30),120)
        self.assertEqual(backlog(8,10,60,120),0)
        self.assertEqual(backlog(2,10,60),0)
    def test_model_rejects_invalid(self):
        for value in (-1,True,float('nan'),float('inf'),'4'):
            with self.assertRaises(ValueError): backlog(value,10,1)

if __name__=='__main__': unittest.main()
