"""Standard-library dataset checks; no optional libraries are imported."""
import csv
from datetime import date
from pathlib import Path
import math
import unittest
BASE = Path(__file__).resolve().parent

class DatasetTests(unittest.TestCase):
    def test_contract(self):
        with (BASE / "support_tickets.csv").open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        self.assertEqual(len(rows), 24)
        self.assertEqual(len({r["ticket_id"] for r in rows}), 24)
        for row in rows:
            date.fromisoformat(row["created_date"])
            self.assertIn(row["channel"], ["email", "chat"])
            self.assertIn(row["priority"], ["low", "high"])
            self.assertIn(row["team"], ["billing", "technical"])
            hours = float(row["resolution_hours"])
            self.assertTrue(math.isfinite(hours) and hours >= 0)
            self.assertEqual(int(row["breached"]), int(hours > 24))
            self.assertGreaterEqual(int(row["customer_messages"]), 0)
        self.assertEqual(sum(int(r["breached"]) for r in rows), 10)
    def test_lookup(self):
        with (BASE / "teams.csv").open(encoding="utf-8", newline="") as f:
            rows = list(csv.DictReader(f))
        self.assertEqual({r["team"] for r in rows}, {"billing", "technical"})
        self.assertEqual(len(rows), 2)
        self.assertTrue(all(r["owner"].strip() for r in rows))

if __name__ == "__main__":
    unittest.main()
