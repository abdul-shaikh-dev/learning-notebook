"""Synthetic login transaction bookkeeping, not OAuth token verification.
Run python login_flow_lab.py. Replace Pending independently, keeping the tests.
No identity provider, browser, tokens or credentials are used.
"""
import unittest

class Pending:
    def __init__(self):self.flows={}
    def begin(self,state,verifier,now,lifetime=60):
        # Caller supplies synthetic unique fixtures here. A real host must generate
        # unpredictable state/verifier values using its supported identity library.
        if not state or not verifier or state in self.flows or lifetime<=0:
            raise ValueError('invalid or duplicate flow')
        self.flows[state]=(verifier,now+lifetime)
    def consume(self,state,now):
        record=self.flows.pop(state,None)
        if record is None or now>=record[1]:raise ValueError('unknown, expired or consumed')
        return record[0]

class FlowTests(unittest.TestCase):
    def test_tabs_finish_out_of_order(self):
        p=Pending();p.begin('A','verifier-A',0);p.begin('B','verifier-B',1)
        self.assertEqual(p.consume('B',2),'verifier-B')
        self.assertEqual(p.consume('A',3),'verifier-A')
        with self.assertRaises(ValueError):p.consume('A',4)
    def test_expiry_boundary_and_unknown(self):
        p=Pending();p.begin('A','v',0)
        with self.assertRaises(ValueError):p.consume('unknown',2)
        with self.assertRaises(ValueError):p.consume('A',60)
        with self.assertRaises(ValueError):p.consume('A',61)
    def test_duplicate_does_not_replace_original(self):
        p=Pending();p.begin('A','original',0)
        with self.assertRaises(ValueError):p.begin('A','replacement',1)
        self.assertEqual(p.consume('A',2),'original')
if __name__=='__main__':unittest.main()
