from decimal import Decimal as D
import unittest
from swap_repricing import value, FO_FORWARDS, FO_DISCOUNTS

class TransferTests(unittest.TestCase):
    def test_forward_bump_units_and_direction(self):
        start=value(FO_FORWARDS,FO_DISCOUNTS)[0]
        bumped=(FO_FORWARDS[0],FO_FORWARDS[1]+D('.001'))
        self.assertEqual(start,D('-100'))
        self.assertEqual(value(bumped,FO_DISCOUNTS)[0]-start,D('480'))
        self.assertEqual(value(bumped,FO_DISCOUNTS,receive_float=False)[0],D('-380'))
    def test_fixing_overrides_forecast(self):
        fixing=(None,D('.05'))
        a=value(FO_FORWARDS,FO_DISCOUNTS,fixings=fixing)[0]
        b=value((D('.03'),D('.051')),FO_DISCOUNTS,fixings=fixing)[0]
        self.assertEqual(a,b)
    def test_factor_effect_uses_signed_cash(self):
        start=value(FO_FORWARDS,FO_DISCOUNTS)[0]
        end=value(FO_FORWARDS,(D('.981'),D('.96')))[0]
        self.assertEqual(end-start,D('-5'))
    def test_negative_rate_and_factor_above_one(self):
        result=value((D('-.01'),D('.05')),(D('1.01'),D('.96')))[0]
        self.assertEqual(result,D('-20450'))
if __name__=='__main__':unittest.main()
