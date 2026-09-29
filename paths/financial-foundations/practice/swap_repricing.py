"""Synthetic receive-floating/pay-fixed cash-flow bridge; not a market pricer."""
from decimal import Decimal as D

NOTIONAL = D("1000000")
FIXED = D("0.04")
ACCRUALS = (D("0.5"), D("0.5"))
FO_FORWARDS = (D("0.03"), D("0.05"))
INDEPENDENT_FORWARDS = (D("0.031"), D("0.048"))
FO_DISCOUNTS = (D("0.98"), D("0.96"))
INDEPENDENT_DISCOUNTS = (D("0.979"), D("0.958"))


def value(forwards, discounts, *, fixings=(None, None), receive_float=True):
    """Supplied aligned inputs, no schedule generation or curve calibration.

    A known fixing replaces the corresponding projection. Negative rates are
    permitted; factors must be positive (they need not be less than one).
    """
    if not (len(forwards) == len(discounts) == len(fixings) == len(ACCRUALS)):
        raise ValueError("two aligned periods required")
    if type(receive_float) is not bool:
        raise ValueError("direction must be boolean")
    for amount in (*forwards, *discounts, *(x for x in fixings if x is not None)):
        if not isinstance(amount, D) or not amount.is_finite():
            raise ValueError("finite Decimal inputs required")
    if any(df <= 0 for df in discounts):
        raise ValueError("discount factors must be positive")
    sign = D(1) if receive_float else D(-1)
    payments = []
    for forward, df, accrual, fixing in zip(forwards, discounts, ACCRUALS, fixings):
        effective = forward if fixing is None else fixing
        net = sign * NOTIONAL * accrual * (effective - FIXED)
        payments.append((net, net * df))
    return sum((pv for _, pv in payments), D(0)), payments


def bridge(*, fixings=(None, None)):
    start, _ = value(FO_FORWARDS, FO_DISCOUNTS, fixings=fixings)
    projected, _ = value(INDEPENDENT_FORWARDS, FO_DISCOUNTS, fixings=fixings)
    end, _ = value(INDEPENDENT_FORWARDS, INDEPENDENT_DISCOUNTS, fixings=fixings)
    return {"fo": start, "independent": end, "forecast_effect": projected - start,
            "discount_effect": end - projected, "total_difference": end - start}


if __name__ == "__main__":
    for label, result in bridge().items():
        print(f"{label}: EUR {result:.2f}")
