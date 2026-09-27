import json
from pathlib import Path
import random
import tempfile
import threading
import unittest
from unittest.mock import Mock
from testing_foundation import parse_record, total_minutes, buggy_minutes
from testing_integration import import_batch
from testing_concurrency import VersionStore, Conflict, diagnostic_event

class FoundationTests(unittest.TestCase):
    def test_valid_boundaries(self):
        for minutes in (0, 1, 1440):
            self.assertEqual(parse_record(json.dumps({"id":"a", "minutes":minutes}))["minutes"], minutes)

    def test_rejects_invalid_inputs(self):
        for minutes in (-1, 1441, True, 1.5, "5", None):
            with self.subTest(minutes=minutes), self.assertRaises(ValueError):
                parse_record(json.dumps({"id":"a", "minutes":minutes}))
        for text in ('[]', '{}', '{"id":"a","minutes":1,"extra":0}', '{"id":"a","minutes":1,"minutes":2}', '{bad', '{"id":" ","minutes":0}', 'x'*4097):
            with self.subTest(text=text[:40]), self.assertRaises(ValueError):
                parse_record(text)

    def test_mutant_is_distinguished_by_boolean_case(self):
        self.assertIs(buggy_minutes(True), True)
        with self.assertRaises(ValueError):
            parse_record('{"id":"a","minutes":true}')

    def test_seeded_metamorphic_sum(self):
        rng = random.Random(27)
        for _ in range(100):
            rows = [{"id":str(i), "minutes":rng.randrange(1441)} for i in range(rng.randrange(20))]
            expected = total_minutes(rows)
            rng.shuffle(rows)
            self.assertEqual(total_minutes(rows), expected)
            self.assertEqual(total_minutes(rows + [{"id":"zero","minutes":0}]), expected)

class IntegrationTests(unittest.TestCase):
    def test_roundtrip_and_empty_batch(self):
        with tempfile.TemporaryDirectory() as scratch:
            target = Path(scratch)/"report.json"
            report = import_batch(['{"id":"a","minutes":7}', '{"id":"b","minutes":2}'], target)
            self.assertEqual(json.loads(target.read_text()), report)
            self.assertEqual(report["total"], 9)
            self.assertEqual(import_batch([], target)["total"], 0)

    def test_validation_preserves_destination_and_no_effect(self):
        with tempfile.TemporaryDirectory() as scratch:
            target = Path(scratch)/"report.json"
            target.write_text("old")
            replacement = Mock()
            for lines in (["bad"], ['{"id":"a","minutes":1}']*2, ['{"id":"a","minutes":0}']*1001):
                with self.assertRaises(ValueError):
                    import_batch(lines, target, replace=replacement)
                self.assertEqual(target.read_text(), "old")
                self.assertEqual(list(Path(scratch).glob("*.tmp")), [])
            replacement.assert_not_called()

    def test_replace_failure_preserves_old_and_cleans_temporary(self):
        with tempfile.TemporaryDirectory() as scratch:
            target=Path(scratch)/"report.json"
            target.write_text("old")
            fail=Mock(side_effect=OSError("injected replacement failure"))
            with self.assertRaises(OSError):
                import_batch(['{"id":"a","minutes":1}'], target, replace=fail)
            fail.assert_called_once()
            self.assertEqual(target.read_text(), "old")
            self.assertEqual(list(Path(scratch).glob("*.tmp")), [])

class ConcurrencyTests(unittest.TestCase):
    def test_two_stale_writers_exactly_one_commits(self):
        store, gate = VersionStore(), threading.Barrier(2)
        outcomes=[]
        outcomes_lock=threading.Lock()
        def worker(minutes):
            version,_=store.read()
            gate.wait(timeout=2)
            try:
                store.update(version, minutes)
                result="ok"
            except Conflict:
                result="conflict"
            with outcomes_lock:
                outcomes.append(result)
        threads=[threading.Thread(target=worker,args=(value,)) for value in (5,8)]
        for thread in threads: thread.start()
        for thread in threads: thread.join(timeout=3)
        self.assertFalse(any(t.is_alive() for t in threads))
        self.assertCountEqual(outcomes,["ok","conflict"])
        self.assertEqual(store.read()[0],1)
        self.assertIn(store.read()[1],(5,8))

    def test_invalid_update_no_effect_and_trace_allowlist(self):
        store=VersionStore()
        with self.assertRaises(ValueError): store.update(0,True)
        self.assertEqual(store.read(),(0,0))
        self.assertEqual(set(diagnostic_event("synthetic-1","conflict",2)),{"case_id","outcome","elapsed_ms"})
        with self.assertRaises(ValueError): diagnostic_event("x","secret-payload",1)

class CommandRouteTests(unittest.TestCase):
    def test_complete_local_script_routes(self):
        import subprocess
        import sys
        for script,expected in [("testing_foundation.py","5"),("testing_integration.py","7"),("testing_concurrency.py","stale edit rejected (1, 8)")]:
            with self.subTest(script=script):
                result=subprocess.run([sys.executable,"-B",script],cwd=Path(__file__).parent,capture_output=True,text=True,timeout=10)
                self.assertEqual(result.returncode,0,result.stderr)
                self.assertEqual(result.stdout.strip(),expected)

if __name__ == "__main__": unittest.main()
