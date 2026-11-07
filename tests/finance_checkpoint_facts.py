"""Fact checks for the Financial foundations checkpoint answers.

Bond, IPV, discounting, uncertainty, bridge, hierarchy and capital answers run the course's own
calculators (runtime/calculations.js, the formulas behind the labs) under Node. The swap, two-date P&L
and curve answers run the practice workbooks (practice/swap_repricing.py and practice/finance_workbook.py)
on their CSV inputs, and BOND-003 and OPTION-001 are read from practice/sample-positions.csv. Arithmetic
the lessons state as a formula, such as the Annex Method 2 and Article 7(2)(b) fallback, is recomputed from
the numbers in the question. The other answers cite the lesson text word for word; see
tests/checkpoint_citations.py.
Run with Python 3.14+: python tests/finance_checkpoint_facts.py
"""
import csv
from decimal import Decimal as D
import importlib.util
import json
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import ROOT, check  # noqa: E402

COURSE = 'financial-foundations'
PRACTICE = ROOT / 'paths' / COURSE / 'practice'

# Evaluates each [key, expression] pair with runtime/calculations.js as `Calc` and prints one JSON object.
HARNESS = r"""
const Calc = require(process.argv[1]);
const out = {};
for (const [key, expression] of JSON.parse(process.argv[2])) out[key] = eval(expression);
console.log(JSON.stringify(out));
"""


def calc(expression):
    node = shutil.which('node')
    if not node:
        raise AssertionError('Node.js is not on PATH')
    model = ROOT / 'paths' / COURSE / 'runtime' / 'calculations.js'
    run = subprocess.run([node, '-e', HARNESS, str(model), json.dumps([['x', expression]])],
                         capture_output=True, text=True, encoding='utf-8', timeout=30, check=True)
    return json.loads(run.stdout)['x']


def workbook(name):
    spec = importlib.util.spec_from_file_location(name, PRACTICE / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def money(value, sign=False):
    text = f'${abs(round(value)):,}'
    return ('+' if value > 0 else '−' if value < 0 else '') + text if sign else text


def ipv(face, fo, independent, tolerance):
    r = calc(f'Calc.ipv({face}, {fo}, {independent}, {tolerance})')
    status = {'Investigate difference': 'investigate the difference', 'Within amount tolerance': 'within tolerance'}
    return f'{money(r["diff"], True)}, {status[r["status"]]}'


def position_value():
    quantity = 11 - 6 + 2
    return money(calc(f'Calc.bond({quantity * 100}, 102).clean'))


def unrealised_gain():
    gain = calc('Calc.bond(2000, 53).clean - Calc.bond(2000, 50).clean')
    return f'{money(gain)} unrealised'


def present_value():
    return f'{calc("Calc.pv(1000, 4, 2)"):,.2f}'


def fvh(quote, unobservable):
    return calc(f'Calc.fvh({str(quote).lower()}, {str(unobservable).lower()})')


def increment():
    r = calc('Calc.bridge(8000000, 100000, 400000, 100000)')
    return f'€{r["increment"] / 1e6:.1f}m'


def short_uncertainty():
    return f'{calc("Calc.uncertainty(100, 0.5, 1000000, \'short\').price"):.4f}'


def half_spread():
    mid = (98.90 + 99.30) / 2
    return money(calc(f'Calc.bond(5000000, {mid}).clean - Calc.bond(5000000, 98.90).clean'))


def ratio(cet1, ava, rwa):
    return calc(f'Calc.capital({cet1}, {ava}, {rwa})')


def ratio_change():
    r = ratio(500, 2, 4000)
    return f'−{round(r["changeBp"])} basis points, from {r["beforePct"]:.2f}% to {r["afterPct"]:.2f}%'


def stage_proceeds():
    proceeds = calc('Calc.bond(600, 55).clean')
    return f'{money(proceeds)} proceeds and a {money(proceeds - calc("Calc.bond(600, 50).clean"))} gain'


def bond_pv():
    pv = calc('Calc.pv(50, 4, 1) + Calc.pv(1050, 4, 2)')
    return f'${pv:,.2f}'


def stage_ratio():
    r = ratio(60, 1, 500)
    return f'From {r["beforePct"]:.2f}% to {r["afterPct"]:.2f}%'


def swap_bridge():
    result = workbook('swap_repricing').bridge()
    if result['fo'] != D('-100'):
        raise AssertionError(f'FO value is {result["fo"]}, the question says EUR −100.00')
    return f'EUR {result["total_difference"]:.2f}'.replace('-', '−')


def bridge_value():
    r = calc('Calc.bridge(5000000, 50000 + 20000 + 10000, 0, 0)')
    return money(r['fv'])


def sample(trade):
    with (PRACTICE / 'sample-positions.csv').open(encoding='utf-8', newline='') as source:
        return next(row for row in csv.DictReader(source) if row['TradeId'] == trade)


def bond_003():
    row = sample('BOND-003')
    return ipv(row['SignedFaceOrNotional'], row['FOCleanPrice'], row['IndependentCleanPrice'], row['LearningTolerance'])


def option_001():
    row = sample('OPTION-001')
    level = fvh(False, row['SignificantUnobservableInput'] == 'true')
    if level != f'Level {row["IllustrativeFVLevel"]}':
        raise AssertionError(f'the calculator gives {level}, the file records Level {row["IllustrativeFVLevel"]}')
    return level


def method_2():
    fv, pv, ev, alpha = D(498), D(494), D(497), D('0.5')
    return f'{max(D(0), fv - alpha * ev - (1 - alpha) * pv).normalize()}'


def fallback():
    inception, current = D(50), D(56)
    profit = max(D(0), current - inception)
    return f'€{(profit + D("0.25") * abs(current - profit)).normalize()}k'


def two_date():
    result = workbook('finance_workbook').two_date()
    return f'USD {result["pnl_usd"]:.2f}'


def curve_contribution():
    result = workbook('finance_workbook').curve_repricing()
    if result['difference'] != D('-21.50'):
        raise AssertionError(f'the difference is {result["difference"]}, the question says −21.50')
    year = max(range(len(result['contributions'])), key=lambda i: abs(result['contributions'][i]))
    return f'Year {year + 1}, {result["contributions"][year]:.2f}'.replace('-', '−')


FACTS = {
    'a-trade-is-an-event-a-position-is-what-remains/2': position_value,
    'price-value-cash-and-profit-are-not-the-same/2': unrealised_gain,
    'from-a-trade-to-a-value/2': lambda: money(calc('Calc.bond(5000000, 101.25, 15000).dirty')),
    'market-data-and-the-model-underneath/2': present_value,
    'ipv-an-independent-challenge/2': lambda: ipv(10000000, 100.10, 99.95, 10000),
    'sources-tolerances-and-exceptions/2': lambda: ipv(-5000000, 99.80, 99.65, 1e9).split(', ')[0],
    'reserves-and-the-accounting-value-bridge/2': lambda: f'+${35 - 25}k',
    'level-1-level-2-level-3/2': lambda: fvh(False, True),
    'fvh-classification-and-reporting-exercises/2': lambda: str(50 + 10 - 6 + 2 + 4 - 1),
    'pruval-avas-and-capital/2': increment,
    'market-price-uncertainty/2': short_uncertainty,
    'close-out-cost-and-concentration/2': half_spread,
    'approaches-aggregation-and-cet1/2': ratio_change,
    'day-one-pnl-and-valuation-movements/2': lambda: money(1990000 - 2000000 + 15000, True),
    'put-it-all-together-at-month-end/2': lambda: ipv(10000000, 99.80, 99.65, 1e9).split(', ')[0],
    'stage/start/1': stage_proceeds,
    'stage/start/3': lambda: f'{money(calc("Calc.bond(1000, 98.5).clean"))} before accrued interest',
    'stage/foundation-explainers/1': bond_pv,
    'stage/foundation-explainers/2': lambda: f'{money(2000000 * (0.035 - 0.03) * 0.5, True)} to the bank',
    'stage/foundation-explainers/3': stage_ratio,
    'stage/foundations/1': swap_bridge,
    'stage/foundations/3': lambda: money(8000 * 3, True),
    'stage/valuation-control/1': bridge_value,
    'stage/valuation-control/3': bond_003,
    'stage/fair-value-hierarchy/1': lambda: pick_level(fvh(True, True)),
    'stage/fair-value-hierarchy/3': option_001,
    'stage/prudent-valuation/1': method_2,
    'stage/prudent-valuation/2': fallback,
    'stage/prudent-valuation/3': lambda: f'€{12000 * 0.001:g}m',
    'stage/working-knowledge/1': two_date,
    'stage/working-knowledge/2': curve_contribution,
}


def pick_level(level):
    return {'Level 1': 'No, it stays Level 1', 'Level 2': 'It becomes Level 2', 'Level 3': 'Yes, it gives Level 3'}[level]


SOURCED = {
    'what-are-people-actually-trading/2': ('what-are-people-actually-trading', 'The counterparty is not automatically '
                                           'the issuer: Company A issued the shares, but Dealer B sold them'),
    'where-do-desks-books-and-portfolios-fit/2': ('where-do-desks-books-and-portfolios-fit', 'Moving a position '
                                                  'between those books changes the grouping, but does not necessarily '
                                                  'create a new transaction with an external party.'),
    'who-checks-the-banks-numbers/2': ('who-checks-the-banks-numbers', 'A difference triggers investigation, not '
                                       'automatic proof that one side is wrong.'),
    'read-one-trade-record-with-confidence/2': ('read-one-trade-record-with-confidence', 'Where did the price come '
                                                'from? Is it a current observation?'),
    'what-fair-value-is-trying-to-measure/2': ('what-fair-value-is-trying-to-measure', 'If A is principal, fair '
                                               'value is 102.'),
    'bid-offer-liquidity-and-model-uncertainty/2': ('bid-offer-liquidity-and-model-uncertainty', 'a CVA amount and '
                                                    'a regulatory CVA risk capital charge answer different questions'),
    'observability-and-significance-in-practice/2': ('observability-and-significance-in-practice', 'Missing is a '
                                                     'data/control state; an estimated input can be an intentional '
                                                     'methodological choice with documentation. Treating null as zero '
                                                     'collapses that distinction.'),
    'model-risk-and-the-other-ava-categories/2': ('model-risk-and-the-other-ava-categories', 'The 0.6m difference '
                                                  'identifies a question; it is not automatically the correct reserve '
                                                  'or AVA.'),
    'data-lineage-controls-and-debugging/2': ('data-lineage-controls-and-debugging', 'Reconcile identifiers and '
                                              'multiplicity as well as amounts.'),
    'stage/start/2': ('price-value-cash-and-profit-are-not-the-same', 'a rate moving from 5.00% to 5.01% rises by 1 '
                      'basis point'),
    'stage/foundations/2': ('from-a-trade-to-a-value', '"Value = 9.85m" without those attributes is an incomplete '
                            'record.'),
    'stage/valuation-control/2': ('sources-tolerances-and-exceptions', 'Preserve the position population with a left '
                                  'join, explicit missing flags and row-count/value reconciliation.'),
    'stage/fair-value-hierarchy/2': ('level-1-level-2-level-3', 'FVH is not calculated by averaging levels'),
    'stage/working-knowledge/3': ('data-lineage-controls-and-debugging', 'Late data should trigger a controlled '
                                  'revised run, with an explanation of what changed, rather than silently altering a '
                                  'signed-off report.'),
}

if __name__ == '__main__':
    check(COURSE, 'Financial foundations', FACTS, SOURCED)
