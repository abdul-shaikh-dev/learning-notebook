import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import legacy_report
import report

HERE = Path(__file__).resolve().parent

class ReportTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)
        self.input = self.root / "tickets.csv"
        self.output = self.root / "report.json"

    def data(self, rows):
        self.input.write_text("id,status,minutes\n" + rows, encoding="utf-8")
        return self.input

    def run_cli(self, *args):
        return subprocess.run([sys.executable, str(HERE / "report.py"), str(self.input), *map(str,args)],
                              capture_output=True, text=True)

    def test_zero_regression_distinguishes_starter(self):
        self.data("A,open,0\n")
        self.assertEqual(legacy_report.summarize_file(self.input), {"count": 0, "total_minutes": 0})
        self.assertEqual(report.summarize(report.read_tickets(self.input)), {"count": 1, "total_minutes": 0})

    def test_fixture_default_and_all_filters(self):
        tickets = report.read_tickets(HERE / "tickets.csv")
        for status, count, total in [(None,4,20),("open",2,12),("closed",1,5),("cancelled",1,3)]:
            with self.subTest(status=status):
                self.assertEqual(report.summarize(tickets,status), {"count":count,"total_minutes":total})

    def test_header_only_and_no_match(self):
        self.data("")
        self.assertEqual(report.summarize(report.read_tickets(self.input)), {"count":0,"total_minutes":0})
        self.data("\nA,open,2\n\n")
        self.assertEqual(report.summarize(report.read_tickets(self.input),"closed"), {"count":0,"total_minutes":0})

    def test_minutes_boundaries(self):
        for minutes in ["0","1","0000","0001","1439","1440"]:
            with self.subTest(minutes=minutes):
                self.data(f"A,open,{minutes}\n")
                self.assertEqual(report.read_tickets(self.input)[0].minutes,int(minutes))
        for minutes in ["-1","1441","00000","","1.0","NaN"," 1","1 ","10000","１"]:
            with self.subTest(minutes=minutes):
                self.data(f"A,open,{minutes}\n")
                with self.assertRaises(ValueError): report.read_tickets(self.input)

    def test_identity_status_and_width(self):
        for rows in ["A,open,1\nA,closed,2\n",",open,1\n"," A,open,1\n","A,missing,1\n","A,open\n","A,open,1,extra\n"]:
            with self.subTest(rows=rows):
                self.data(rows)
                with self.assertRaises(ValueError): report.read_tickets(self.input)

    def test_wrong_or_missing_header(self):
        for text in ["","id,minutes,status\n","id,status,minutes,extra\n"]:
            self.input.write_text(text,encoding="utf-8")
            with self.assertRaises(ValueError): report.read_tickets(self.input)

    def test_default_cli_preserved(self):
        self.data("A,open,0\nB,closed,5\n")
        result = self.run_cli()
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(result.stderr,"")
        self.assertEqual(json.loads(result.stdout),{"count":2,"total_minutes":5})

    def test_filter_cli_and_invalid_choice(self):
        self.data("A,open,0\nB,closed,5\n")
        result=self.run_cli("--status","open")
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(json.loads(result.stdout),{"count":1,"total_minutes":0})
        invalid=self.run_cli("--status","missing")
        self.assertEqual(invalid.returncode,2)
        self.assertEqual(invalid.stdout,"")

    def test_invalid_excluded_row_preserves_old_export(self):
        self.data("A,open,12\nB,closed,-1\n")
        self.output.write_bytes(b"KEEP")
        result=self.run_cli("--status","open","--output",self.output)
        self.assertEqual(result.returncode,2)
        self.assertEqual(result.stdout,"")
        self.assertIn("row 3",result.stderr)
        self.assertEqual(self.output.read_bytes(),b"KEEP")

    def test_successful_export(self):
        self.data("A,open,0\nB,closed,5\n")
        self.output.write_bytes(b"KEEP")
        result=self.run_cli("--output",self.output)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(result.stdout,"")
        self.assertEqual(json.loads(self.output.read_text()),{"count":2,"total_minutes":5})
        self.assertEqual(list(self.root.glob(".report-*.tmp")),[])

    def test_replace_failure_cleans_temp_and_preserves_file(self):
        self.output.write_bytes(b"KEEP")
        def fail(source,destination):
            self.assertEqual(Path(source).parent,self.output.parent)
            raise OSError("simulated replacement error")
        with self.assertRaises(OSError): report.write_report(self.output,'{}',replace=fail)
        self.assertEqual(self.output.read_bytes(),b"KEEP")
        self.assertEqual(list(self.root.glob(".report-*.tmp")),[])

    def test_input_cannot_be_output(self):
        self.data("A,open,1\n")
        before=self.input.read_bytes()
        result=self.run_cli("--output",self.input)
        self.assertEqual(result.returncode,2)
        self.assertEqual(self.input.read_bytes(),before)

    def test_missing_input_and_destination_directory(self):
        self.assertEqual(self.run_cli().returncode,2)
        self.data("A,open,1\n")
        result=self.run_cli("--output",self.root/"missing"/"out.json")
        self.assertEqual(result.returncode,2)
        self.assertEqual(list(self.root.glob(".report-*.tmp")),[])

if __name__ == "__main__": unittest.main()
