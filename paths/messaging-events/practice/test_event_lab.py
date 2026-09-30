import sqlite3
import tempfile
import unittest
from pathlib import Path
from event_lab import connect, create_job, pending, mark_sent, consume, total, retry_decision, validate, demo

class EventTests(unittest.TestCase):
    def setUp(self):
        self.folder=tempfile.TemporaryDirectory(); self.path=Path(self.folder.name)/'events.db'; self.db=connect(self.path)
    def tearDown(self): self.db.close(); self.folder.cleanup()
    def event(self): return create_job(self.db,'job','event',7)
    def test_atomic_creation(self):
        with self.assertRaises(RuntimeError): create_job(self.db,'job','event',7,crash=True)
        self.assertEqual(self.db.execute('SELECT count(*) FROM jobs').fetchone()[0],0)
        self.assertEqual(pending(self.db),[])
    def test_stable_creation_retry(self):
        self.assertEqual(self.event(),self.event()); self.assertEqual(len(pending(self.db)),1)
    def test_identity_collision(self):
        self.event()
        with self.assertRaises(ValueError): create_job(self.db,'job','event',8)
        self.assertEqual(pending(self.db)[0]['value'],7)
    def test_duplicate_effect(self):
        e=self.event(); self.assertTrue(consume(self.db,'a',e)); self.assertFalse(consume(self.db,'a',e)); self.assertEqual(total(self.db,'a','job'),7)
    def test_restart_preserves_inbox(self):
        e=self.event(); consume(self.db,'a',e); self.db.close(); self.db=connect(self.path)
        self.assertFalse(consume(self.db,'a',e)); self.assertEqual(total(self.db,'a','job'),7)
    def test_atomic_consume_crash(self):
        e=self.event()
        with self.assertRaises(RuntimeError): consume(self.db,'a',e,crash=True)
        self.assertEqual(self.db.execute('SELECT count(*) FROM inbox').fetchone()[0],0)
        self.assertEqual(total(self.db,'a','job'),0); self.assertTrue(consume(self.db,'a',e))
    def test_independent_subscribers(self):
        e=self.event(); self.assertTrue(consume(self.db,'a',e)); self.assertTrue(consume(self.db,'b',e))
        self.assertEqual(total(self.db,'a','job'),7); self.assertEqual(total(self.db,'b','job'),7)
    def test_relay_crash_before_mark(self):
        self.event(); consume(self.db,'a',pending(self.db)[0])
        self.assertFalse(consume(self.db,'a',pending(self.db)[0])); mark_sent(self.db,'event')
        self.assertEqual(pending(self.db),[]); self.assertEqual(total(self.db,'a','job'),7)
    def test_same_id_changed_payload(self):
        e=self.event(); consume(self.db,'a',e); e['value']=99
        with self.assertRaises(ValueError): consume(self.db,'a',e)
        self.assertEqual(total(self.db,'a','job'),7)
    def test_invalid_messages(self):
        good=self.event()
        for change in ({'version':2},{'version':True},{'version':1.0},{'id':''},{'id':'   '},{'id':' e-1'},{'job_id':'x'*129},{'value':True},{'value':-1},{'value':2**63},{'type':'Other'},{'future_field':'not-supported'}):
            with self.subTest(change=change):
                with self.assertRaises(ValueError): consume(self.db,'a',good|change)
        self.assertEqual(total(self.db,'a','job'),0)
    def test_retry_budget(self):
        self.assertEqual(retry_decision(1,True),dict(action='retry',delay=1))
        self.assertEqual(retry_decision(2,True),dict(action='retry',delay=2))
        self.assertEqual(retry_decision(3,True)['action'],'quarantine')
        self.assertEqual(retry_decision(1,False)['action'],'quarantine')
        with self.assertRaises(ValueError): retry_decision(0,True)
        with self.assertRaises(ValueError): retry_decision(1,'yes')
    def test_unknown_outbox_and_consumer(self):
        with self.assertRaises(ValueError): mark_sent(self.db,'missing')
        with self.assertRaises(ValueError): consume(self.db,'',self.event())
        self.assertEqual(demo()['total'],7)

if __name__ == '__main__': unittest.main()
