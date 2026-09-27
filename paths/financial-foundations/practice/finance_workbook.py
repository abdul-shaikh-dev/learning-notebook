"""Synthetic arithmetic exercises; standard library only. Not an accounting engine."""
from decimal import Decimal as D
import csv
from pathlib import Path

HERE = Path(__file__).resolve().parent

def rows(name):
    with (HERE / name).open(encoding="utf-8", newline="") as source:
        return list(csv.DictReader(source))

def two_date():
    events = rows("two-date-events.csv")
    opening, closing = events[0], events[-1]
    quantity = D(opening["quantity"])
    activity = events[1:-1]
    held = quantity + sum((D(e["quantity"]) for e in activity), D(0))
    if held != D(closing["quantity"]):
        raise ValueError("Position does not reconcile")
    open_raw = quantity * D(opening["price_eur"])
    close_raw = held * D(closing["price_eur"])
    open_deduction, close_deduction = D(20), D(35)
    cash = sum((D(e["cash_eur"]) for e in activity), D(0))
    cash_usd = sum((D(e["cash_eur"]) * D(e["eurusd"]) for e in activity), D(0))
    open_net, close_net = open_raw-open_deduction, close_raw-close_deduction
    open_fx, close_fx = D(opening["eurusd"]), D(closing["eurusd"])
    local = close_net-open_net+cash
    reported = close_net*close_fx-open_net*open_fx+cash_usd
    # Close-rate convention: opening carrying amount FX first, cash-rate difference separately.
    translated_local = local*close_fx
    opening_fx = open_net*(close_fx-open_fx)
    cash_fx = cash_usd-cash*close_fx
    return dict(quantity=held, cash_eur=cash, raw_pnl_eur=close_raw-open_raw+cash,
                adjustment_effect_eur=open_deduction-close_deduction,
                local_pnl_eur=local, pnl_usd=reported, translated_local_usd=translated_local,
                opening_fx_usd=opening_fx, cash_fx_usd=cash_fx,
                residual_usd=reported-translated_local-opening_fx-cash_fx)

def curve_repricing():
    data=rows("curve-inputs.csv")
    fo=sum((D(e["cash_eur"])*D(e["fo_discount_factor"]) for e in data),D(0))
    independent=sum((D(e["cash_eur"])*D(e["independent_discount_factor"]) for e in data),D(0))
    contributions=[D(e["cash_eur"])*(D(e["independent_discount_factor"])-D(e["fo_discount_factor"])) for e in data]
    rate, bumped = D("0.05"), D("0.06")
    pv=lambda r:sum((D(e["cash_eur"])/(1+r)**int(e["years"]) for e in data),D(0))
    derivative=sum((-int(e["years"])*D(e["cash_eur"])/(1+rate)**(int(e["years"])+1) for e in data),D(0))
    exact=pv(bumped)-pv(rate)
    linear=derivative*(bumped-rate)
    return dict(fo=fo,independent=independent,difference=independent-fo,
                contributions=contributions,flat_rate_exact=exact,flat_rate_linear=linear,
                approximation_residual=exact-linear)

if __name__=="__main__":
    for title,result in [("Two-date P&L",two_date()),("Curve comparison",curve_repricing())]:
        print(title)
        for key,value in result.items(): print(f"  {key}: {value}")
