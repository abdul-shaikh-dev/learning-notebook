import json
from pathlib import Path
import tempfile
import unittest
import pandas as pd
from analysis import BASE, validate, summarize, attach_owners, threshold_rates, run

class AnalysisTests(unittest.TestCase):
    def setUp(self):
        self.raw = pd.read_csv(BASE / "support_tickets.csv")
    def test_known_summary(self):
        df = self.raw.iloc[:4].copy()
        df["team"] = ["billing", "billing", "technical", "technical"]
        df["resolution_hours"] = [4, 28, 24, 48]
        df["breached"] = [0, 1, 0, 1]
        table = summarize(validate(df)).set_index("team")
        self.assertEqual(table.loc["billing", "tickets"], 2)
        self.assertEqual(table.loc["billing", "breaches"], 1)
        self.assertEqual(table.loc["billing", "mean_hours"], 16)
        self.assertEqual(table.loc["technical", "mean_hours"], 36)
        self.assertEqual(table.loc["technical", "breach_rate"], .5)
    def test_invalid_values(self):
        for col, value in [("resolution_hours", -1), ("resolution_hours", float("inf")), ("customer_messages", -2), ("team", "unknown"), ("created_date", "bad-date"), ("created_date", "NaT"), ("created_date", ""), ("breached", 1)]:
            with self.subTest(column=col, value=value):
                frame = self.raw.copy()
                frame[col] = frame[col].astype(object)
                frame.loc[0, col] = value
                with self.assertRaises(ValueError):
                    validate(frame)
    def test_duplicate_and_missing(self):
        with self.assertRaises(ValueError):
            validate(pd.concat([self.raw, self.raw.iloc[:1]]))
        with self.assertRaises(ValueError):
            validate(self.raw.drop(columns="team"))
        frame = self.raw.copy()
        frame.loc[0, "resolution_hours"] = float("nan")
        with self.assertRaises(ValueError):
            validate(frame)
    def test_lookup_cardinality_and_coverage(self):
        df = validate(self.raw)
        teams = pd.read_csv(BASE / "teams.csv")
        self.assertEqual(len(attach_owners(df, teams)), 24)
        with self.assertRaises(pd.errors.MergeError):
            attach_owners(df, pd.concat([teams, teams.iloc[:1]]))
        with self.assertRaises(ValueError):
            attach_owners(df, teams.iloc[:1])
    def test_thresholds(self):
        df = pd.DataFrame({"resolution_hours": [8, 24, 40, 60]})
        self.assertEqual(threshold_rates(df), {"12": .75, "24": .5, "48": .25})
    def test_repeatable_report(self):
        with tempfile.TemporaryDirectory() as temp:
            first = run(temp)
            before = (Path(temp) / "report.json").read_bytes()
            second = run(temp)
            self.assertEqual(first, second)
            self.assertEqual(before, (Path(temp) / "report.json").read_bytes())
            self.assertEqual(first["rows"], 24)
            self.assertAlmostEqual(first["overall_breach_rate"], 10 / 24)
            self.assertEqual((Path(temp) / "counts.png").read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
            self.assertEqual(json.loads(before)["rows"], 24)

if __name__ == "__main__":
    unittest.main()
