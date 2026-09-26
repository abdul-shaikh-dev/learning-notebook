"""Run beside all three project scripts: python -m unittest -v test_projects.py."""
import contextlib
import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
import foundation_project as foundation
import intermediate_project as intermediate
import advanced_project as advanced

class FoundationTests(unittest.TestCase):
    def test_totals_and_empty(self):
        log = []
        self.assertEqual(foundation.totals_by_topic(log), {})
        foundation.add_session(log, " Python ", 0)
        foundation.add_session(log, "Python", 15)
        self.assertEqual(foundation.totals_by_topic(log), {"Python":15})
    def test_rejection_does_not_mutate(self):
        for topic, minutes in [("",3),("x",-1),("x",True)]:
            with self.subTest(topic=topic, minutes=minutes):
                log = []
                with self.assertRaises(ValueError):
                    foundation.add_session(log, topic, minutes)
                self.assertEqual(log, [])

class IntermediateTests(unittest.TestCase):
    def test_normalized_domain_value(self):
        self.assertEqual(intermediate.Session(" Python ",0), intermediate.Session("Python",0))
    def test_bad_shapes(self):
        for value in [{}, [{"topic":"x","minutes":True}], [{"topic":"x","minutes":-1}], [{"topic":"x","minutes":2,"extra":1}]]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    intermediate.parse_sessions(value)
    def test_real_file_and_cli(self):
        with TemporaryDirectory() as folder:
            path = Path(folder)/"sessions.json"
            path.write_text('[{"topic":"Python","minutes":5}]', encoding="utf-8")
            original = path.read_bytes()
            with contextlib.redirect_stdout(io.StringIO()) as output:
                self.assertEqual(intermediate.main([str(path)]),0)
            self.assertEqual(json.loads(output.getvalue()), {"Python":5})
            self.assertEqual(path.read_bytes(),original)
    def test_error_status_and_log(self):
        with TemporaryDirectory() as folder:
            path = Path(folder)/"bad.json"
            path.write_text('{bad',encoding="utf-8")
            with self.assertLogs(intermediate.logger,level="ERROR"):
                self.assertEqual(intermediate.main([str(path)]),1)

class AdvancedTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.source = self.folder/"input.jsonl"
        self.target = self.folder/"report.json"
    def write(self, rows):
        self.source.write_text("\n".join(json.dumps(row) for row in rows),encoding="utf-8")
    def valid(self):
        return [{"id":"b","topic":" Python ","minutes":0},{"id":"a","topic":"Python","minutes":15}]
    def test_threaded_roundtrip_and_order(self):
        self.write(self.valid())
        with self.assertLogs(advanced.logger,level="INFO"):
            report = advanced.import_report(self.source,self.target,workers=2)
        self.assertEqual([row["id"] for row in report["sessions"]],["b","a"])
        self.assertEqual(advanced.summary(advanced.load_report(self.target)), {"Python":15})
    def test_empty_batch(self):
        self.write([])
        self.assertEqual(advanced.import_report(self.source,self.target)["totals"],{})
    def test_invalid_preserves_report(self):
        self.write(self.valid());advanced.import_report(self.source,self.target)
        original = self.target.read_bytes()
        for rows in [[{"id":"a","topic":"x","minutes":True}], [{"id":"a","topic":"x","minutes":1},{"id":"a","topic":"y","minutes":2}]]:
            with self.subTest(rows=rows):
                self.write(rows)
                with self.assertRaises(ValueError):
                    advanced.import_report(self.source,self.target,2)
                self.assertEqual(self.target.read_bytes(), original)
    def test_malformed_duplicate_key_and_blank(self):
        for text in ['{bad', '{"id":"a","topic":"x","minutes":1,"minutes":2}', '\n']:
            with self.subTest(text=text):
                self.source.write_text(text,encoding="utf-8")
                with self.assertRaises(ValueError):
                    advanced.read_batch(self.source)
                self.assertFalse(self.target.exists())
    def test_byte_record_and_worker_limits(self):
        self.source.write_bytes(b' ' * (advanced.MAX_BYTES + 1))
        with self.assertRaises(ValueError):advanced.read_batch(self.source)
        self.source.write_text('\n'.join(['{}'] * (advanced.MAX_RECORDS + 1)),encoding="utf-8")
        with self.assertRaises(ValueError):advanced.read_batch(self.source)
        self.write(self.valid())
        for worker in [0,9,True]:
            with self.subTest(worker=worker):
                with self.assertRaises(ValueError):advanced.read_batch(self.source,worker)
    def test_replace_failure_preserves_and_cleans(self):
        self.write(self.valid());advanced.import_report(self.source,self.target)
        original = self.target.read_bytes()
        with patch.object(advanced.os,"replace",side_effect=OSError("injected")):
            with self.assertRaises(OSError):advanced.import_report(self.source,self.target)
        self.assertEqual(self.target.read_bytes(),original)
        self.assertEqual(set(self.folder.iterdir()),{self.source,self.target})
    def test_schema_and_total_corruption(self):
        self.write(self.valid());report=advanced.import_report(self.source,self.target)
        for value in [{**report,"version":True},{**report,"totals":{"Python":16}},{**report,"totals":{"Python":True}}]:
            with self.subTest(value=value):
                self.target.write_text(json.dumps(value),encoding="utf-8")
                with self.assertRaises(ValueError):advanced.load_report(self.target)
    def test_prevent_overwriting_source(self):
        self.write(self.valid());original=self.source.read_bytes()
        with self.assertRaises(ValueError):advanced.import_report(self.source,self.source)
        self.assertEqual(self.source.read_bytes(),original)
    def test_cli_failure_status_and_log(self):
        self.source.write_text('{bad',encoding="utf-8")
        with self.assertLogs(advanced.logger,level="ERROR"):
            self.assertEqual(advanced.main([str(self.source),str(self.target)]),1)
        self.assertFalse(self.target.exists())
    def test_record_limit_and_domain_boundaries(self):
        self.assertEqual(advanced.Session("a","x",1440).minutes,1440)
        for value in [-1,1441,True,1.5]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):advanced.Session("a","x",value)
        self.source.write_text(' ' * (advanced.MAX_LINE_BYTES + 1) + '{}',encoding="utf-8")
        with self.assertRaises(ValueError):advanced.read_batch(self.source)
    def test_failure_test_detects_deliberate_defect(self):
        def wrong_add(log,topic,minutes):
            log.append({"topic":topic,"minutes":minutes})
        with patch.object(foundation,"add_session",wrong_add):
            suite = unittest.TestSuite([FoundationTests("test_rejection_does_not_mutate")])
            result = unittest.TestResult()
            suite.run(result)
        self.assertFalse(result.wasSuccessful())
        self.assertTrue(result.failures)
    def test_report_expansion_roundtrip(self):
        rows=[{"id":str(i),"topic":"x"*80,"minutes":1440} for i in range(1000)]
        self.write(rows)
        advanced.import_report(self.source,self.target)
        self.assertEqual(len(advanced.load_report(self.target)),1000)
    def test_unique_unicode_topics_roundtrip(self):
        rows = [{"id":str(i),"topic":"\U0001f600" * 77 + f"{i:03}","minutes":1} for i in range(600)]
        self.source.write_text("\n".join(json.dumps(row,ensure_ascii=False) for row in rows),encoding="utf-8")
        self.assertLessEqual(self.source.stat().st_size,advanced.MAX_BYTES)
        report = advanced.import_report(self.source,self.target,workers=2)
        restored = advanced.load_report(self.target)
        self.assertLessEqual(self.target.stat().st_size,advanced.MAX_REPORT_BYTES)
        self.assertEqual([record.topic for record in restored],[row["topic"] for row in rows])
        self.assertEqual(advanced.summary(restored),report["totals"])
    def test_oversized_report_preserves_output_before_replacement(self):
        self.target.write_bytes(b"previous report")
        with patch.object(advanced.os,"replace") as replace:
            with self.assertRaisesRegex(ValueError,"report exceeds byte limit"):
                advanced.atomic_write(self.target,{"oversized":"x" * advanced.MAX_REPORT_BYTES})
        replace.assert_not_called()
        self.assertEqual(self.target.read_bytes(),b"previous report")
        self.assertEqual(set(self.folder.iterdir()),{self.target})
    def test_unicode_string_boundaries_and_jsonl_delimiters(self):
        for separator in ["\u0085","\u2028","\u2029"]:
            for delimiter in ["\n","\r\n"]:
                for trailing in [False,True]:
                    with self.subTest(separator=separator,delimiter=delimiter,trailing=trailing):
                        rows = [{"id":"a","topic":"x" + separator + "y","minutes":1},
                                {"id":"b","topic":"Other","minutes":2}]
                        text = delimiter.join(json.dumps(row,ensure_ascii=False) for row in rows)
                        self.source.write_bytes((text + (delimiter if trailing else "")).encode("utf-8"))
                        records = advanced.read_batch(self.source,workers=2)
                        self.assertEqual([record.id for record in records],["a","b"])
                        self.assertEqual(records[0].topic,rows[0]["topic"])
        for text in ["\n","\r\n",'{}\n\n']:
            with self.subTest(blank=text):
                self.source.write_bytes(text.encode("utf-8"))
                with self.assertRaisesRegex(ValueError,"blank records"):
                    advanced.read_batch(self.source)

if __name__ == "__main__":
    unittest.main()
