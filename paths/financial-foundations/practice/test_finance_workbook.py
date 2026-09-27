import unittest
from decimal import Decimal as D
from unittest.mock import patch
import finance_workbook as w

class WorkbookTests(unittest.TestCase):
    def test_position_cash_and_period_return(self):
        r=w.two_date()
        self.assertEqual((r["quantity"],r["cash_eur"],r["local_pnl_eur"]),(D(90),D(1160),D(505)))
        # Independently derived driver bridge: opening price move, buy, sale, dividend, deduction.
        self.assertEqual(r["local_pnl_eur"],D(400)+D(40)+D(30)+D(50)-D(15))
        self.assertEqual(r["pnl_usd"],D("765.20"))
        self.assertEqual(r["residual_usd"],0)

    def test_cash_fx_at_actual_event_rate(self):
        data=w.rows("two-date-events.csv")
        data[3]["eurusd"]="1.11"
        with patch.object(w,"rows",return_value=data): r=w.two_date()
        self.assertEqual(r["cash_fx_usd"],D("-0.50"))
        self.assertEqual(r["pnl_usd"],D("764.70"))
        self.assertEqual(r["residual_usd"],0)

    def test_broken_position_is_not_a_zero_residual(self):
        data=w.rows("two-date-events.csv");data[-1]["quantity"]="91"
        with patch.object(w,"rows",return_value=data), self.assertRaises(ValueError): w.two_date()

    def test_cost_allocation_changes_split_not_total(self):
        fifo_realised=D(30)*(D(105)-D(90))
        fifo_unrealised=D(9360)-(D(70)*90+D(20)*102)
        average_realised=D(30)*(D(105)-D(92))
        average_unrealised=D(9360)-D(90)*92
        for realised,unrealised in [(fifo_realised,fifo_unrealised),(average_realised,average_unrealised)]:
            self.assertEqual(realised+unrealised-D(1000)+D(50),D(520))

    def test_curve_difference_and_rate_approximation(self):
        r=w.curve_repricing()
        self.assertEqual((r["fo"],r["independent"],r["difference"]),(D("992.50"),D("971.00"),D("-21.50")))
        self.assertEqual(sum(r["contributions"]),r["difference"])
        self.assertAlmostEqual(float(r["flat_rate_exact"]),-18.3339266643,places=8)
        self.assertAlmostEqual(float(r["flat_rate_linear"]),-18.5941043084,places=8)
        self.assertGreater(r["approximation_residual"],0)

if __name__=="__main__": unittest.main()
