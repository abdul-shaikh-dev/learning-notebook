import unittest
from decimal import Decimal as D
from swap_repricing import (value, bridge, FO_FORWARDS, FO_DISCOUNTS,
                            INDEPENDENT_FORWARDS, INDEPENDENT_DISCOUNTS)


class SwapTests(unittest.TestCase):
    def test_independent_worked_values_and_attribution(self):
        result = bridge()
        self.assertEqual(result, {"fo": D("-100"), "independent": D("-573.5"),
            "forecast_effect": D("-470"), "discount_effect": D("-3.5"),
            "total_difference": D("-473.5")})
        self.assertEqual(result["forecast_effect"] + result["discount_effect"], result["total_difference"])

    def test_leg_direction_reverses_value_not_notional(self):
        receiver, payments = value(FO_FORWARDS, FO_DISCOUNTS)
        payer, _ = value(FO_FORWARDS, FO_DISCOUNTS, receive_float=False)
        self.assertEqual(payments, [(D("-5000"), D("-4900")), (D("5000"), D("4800"))])
        self.assertEqual(payer, -receiver)

    def test_known_fixing_does_not_move_with_first_forward(self):
        fixings = (D("0.03"), None)
        original, _ = value(FO_FORWARDS, FO_DISCOUNTS, fixings=fixings)
        changed, _ = value((D("0.99"), FO_FORWARDS[1]), FO_DISCOUNTS, fixings=fixings)
        self.assertEqual(changed, original)
        self.assertEqual(bridge(fixings=fixings)["total_difference"], D("-963"))

    def test_reverse_order_changes_attribution_not_total(self):
        intermediate, _ = value(FO_FORWARDS, INDEPENDENT_DISCOUNTS)
        self.assertEqual(intermediate, D("-105"))
        self.assertEqual(bridge()["independent"] - intermediate, D("-468.5"))
        self.assertEqual(D("-5") + D("-468.5"), D("-473.5"))

    def test_reject_misalignment_nonfinite_or_invalid_factor(self):
        for forwards, dfs in ((FO_FORWARDS[:1], FO_DISCOUNTS),
                              ((D("NaN"), D(".05")), FO_DISCOUNTS),
                              (FO_FORWARDS, (D(0), D(".96")))):
            with self.assertRaises(ValueError):
                value(forwards, dfs)
