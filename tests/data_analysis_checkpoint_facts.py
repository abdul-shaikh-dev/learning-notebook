"""Fact checks for the Data analysis with Python checkpoint answers.

Each fact runs the course's lab in paths/data-analysis-python/practice: analysis.py's validate,
attach_owners, summarize, threshold_rates and run, on support_tickets.csv and teams.csv or on changed
copies of them made in memory or in a temporary directory. Each returns the text of the option the result
supports, and the script fails if that differs from the authored correct option.
Needs the course's pinned packages (practice/requirements.txt), as in the data-science CI job.
Run with Python 3.14+: python tests/data_analysis_checkpoint_facts.py
"""
import json
from pathlib import Path
import sys
from tempfile import TemporaryDirectory

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'data-analysis-python'
PRACTICE = COURSE / 'practice'
TICKETS, TEAMS = PRACTICE / 'support_tickets.csv', PRACTICE / 'teams.csv'
sys.path.insert(0, str(PRACTICE))
import pandas as pd  # noqa: E402
import analysis  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'handoff-to-modeling/2': 'Outcome fields are unavailable at prediction time and leak the answer, lesson 25',
}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def outcome(action):
    """Run action and name the exception it raises, or return its result."""
    try:
        return action()
    except Exception as error:
        return f'{type(error).__name__}: {error}'


def raises(action):
    return 'Raises ' + outcome(action)


def raw():
    return pd.read_csv(TICKETS, dtype={'ticket_id': 'string'})


def clean():
    return analysis.validate(raw())


def changed(row, **values):
    frame = raw()
    for column, value in values.items():
        frame[column] = frame[column].astype(object)
        frame.loc[row, column] = value
    return frame


def teams():
    return pd.read_csv(TEAMS)


def summary():
    table = analysis.summarize(analysis.attach_owners(clean(), teams()))
    return {r['team']: r for r in table.to_dict(orient='records')}


def percent(value):
    return f'{value * 100:.1f}%'


def question_and_grain():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        report = analysis.run(folder)
    rate = report['overall_breach_rate']
    return pick((report['rows'], round(rate * report['rows'])), {(24, 10): f'10 of 24 tickets, about {percent(rate)}'})


def load_and_inspect():
    frame = pd.read_csv(TICKETS)
    return pick((frame.shape, frame.ticket_id.nunique()), {((24, 8), 24): '24 rows by 8 columns, with 24 distinct IDs'})


def numpy_arrays():
    df = clean()
    count = int((df.resolution_hours.to_numpy() > 24).sum())
    return pick((count, int(df.breached.sum())), {(10, 10): "10, the same as the breached column's sum"})


def types_and_dates():
    error = outcome(lambda: analysis.validate(changed(0, created_date='2026-13-01')))
    return pick(('ValueError' in error, '%Y-%m-%d' in error),
                {(True, True): 'Raises ValueError, because the date does not match %Y-%m-%d'})


def select_and_filter():
    high = clean().query("priority == 'high'")
    return f'{int(high.breached.sum())} of {len(high)}, about {percent(high.breached.mean())}'


def missing_and_duplicates():
    frame = raw()
    copy = frame.iloc[[0]].copy()
    copy['resolution_hours'] = 3
    return raises(lambda: analysis.validate(pd.concat([frame, copy], ignore_index=True)))


def indexes_and_alignment():
    df = clean()
    return df[df.priority == 'high'].iloc[1].ticket_id


def derive_and_validate():
    frame = raw()
    assert frame.loc[3, 'ticket_id'] == 'T004' and frame.loc[3, 'resolution_hours'] == 24
    return raises(lambda: analysis.validate(changed(3, breached=1)))


def group_and_denominators():
    rows = summary()
    return f"Billing about {percent(rows['billing']['breach_rate'])}, technical {rows['technical']['breach_rate']:.0%}"


def joins_and_cardinality():
    lookup = pd.concat([teams(), teams().iloc[[0]]], ignore_index=True)
    error = outcome(lambda: analysis.attach_owners(clean(), lookup))
    return pick(error.split(':')[0], {'MergeError': 'Raises MergeError: the lookup is not many-to-one'})


def distributions_and_outliers():
    hours = clean().resolution_hours
    return f'Mean about {hours.mean():.1f} hours, median {hours.median():g} hours'


def dates_and_aggregation():
    weekly = clean().set_index('created_date').resample('W-SUN').size()
    first = weekly.index[0]
    return pick((str(first.date()), int(weekly.iloc[0]), clean().created_date.min().day_name()),
                {('2026-01-04', 4, 'Thursday'): '4, because the data starts on Thursday 1 January'})


def charts_for_questions():
    source = (PRACTICE / 'analysis.py').read_text(encoding='utf-8')
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        analysis.run(folder)
        drawn = (Path(folder) / 'counts.png').stat().st_size > 0
    return pick((drawn, 'ax.bar(table.team, table.tickets' in source, 'ylabel="Ticket count"' in source,
                 'ax.text(i, value' in source),
                {(True, True, True, True): 'One bar per team, showing ticket counts on a labelled axis'})


def reshape_for_comparison():
    row = pd.crosstab(clean().team, clean().channel).loc['billing']
    return f"Chat {row['chat']}, email {row['email']}"


def association_and_comparison():
    table = pd.crosstab(clean().team, clean().priority)
    return pick((int(table.loc['billing', 'high']), int(table.loc['technical', 'high'])),
                {(6, 0): 'All 6 are billing tickets, so team and priority are entangled'})


def validation_functions():
    return raises(lambda: analysis.validate(changed(0, resolution_hours=-3)))


def functions_and_tests():
    return raises(lambda: analysis.validate(changed(0, customer_messages=1.5)))


def chunking_and_weighting():
    total = count = 0
    sizes = []
    for chunk in pd.read_csv(TICKETS, chunksize=10):
        total += chunk.resolution_hours.sum()
        count += len(chunk)
        sizes.append(len(chunk))
    combined = total / count
    assert sizes == [10, 10, 4] and abs(combined - clean().resolution_hours.mean()) < 1e-12
    return f'About {combined:.1f} hours, the same as the whole file'


def reproducible_report():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        report = analysis.run(folder)
    return pick((len(report['source_sha256']), tuple(sorted(report['versions']))),
                {(64, ('matplotlib', 'numpy', 'pandas', 'python')):
                 "The source file's SHA-256 and the Python, NumPy, pandas and Matplotlib versions"})


def sensitivity_and_limits():
    rates = analysis.threshold_rates(clean())
    return 'About ' + ', '.join(percent(rates[t]) for t in ('12', '24')) + ' and ' + percent(rates['48'])


def foundation_missing_column():
    return raises(lambda: analysis.validate(raw().drop(columns='breached')))


def foundation_channel():
    return raises(lambda: analysis.validate(changed(0, channel='phone')))


def foundation_empty():
    return raises(lambda: analysis.validate(raw().iloc[0:0]))


def intermediate_unmatched():
    lookup = teams()
    return raises(lambda: analysis.attach_owners(clean(), lookup[lookup.team != 'technical']))


def intermediate_rows():
    return pick(len(analysis.attach_owners(clean(), teams())), {24: '24, the same as the input'})


def intermediate_means():
    rows = summary()
    return f"About {rows['billing']['mean_hours']:.1f} for billing and {rows['technical']['mean_hours']:.1f} for technical"


def advanced_infinite():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        path = Path(folder) / 'tickets.csv'
        lines = TICKETS.read_text(encoding='utf-8').splitlines()
        lines[1] = lines[1].replace(',2,0', ',inf,0')
        path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
        return raises(lambda: analysis.validate(pd.read_csv(path, dtype={'ticket_id': 'string'})))


def advanced_repeatable():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        a, b = Path(folder) / 'a', Path(folder) / 'b'
        analysis.run(a)
        analysis.run(b)
        same = (a / 'report.json').read_bytes() == (b / 'report.json').read_bytes()
    return pick(same, {True: 'Yes, byte for byte'})


def advanced_blank_line():
    with TemporaryDirectory(ignore_cleanup_errors=True) as folder:
        copy = Path(folder) / 'tickets.csv'
        copy.write_bytes(TICKETS.read_bytes() + b'\n')
        original = analysis.run(Path(folder) / 'a')
        padded = analysis.run(Path(folder) / 'b', source=copy)
    differs = sorted(k for k in original if original[k] != padded[k])
    return pick((tuple(differs), padded['rows']), {(('source_sha256',), 24): 'Only source_sha256: it still reports 24 rows'})



def _lesson_output(lesson_id):
    import subprocess
    course = json.loads((ROOT / 'paths' / 'data-analysis-python' / 'path.json').read_text(encoding='utf-8'))
    lesson = next(l for l in course['lessons'] if l['id'] == lesson_id)
    code = next(s['example'] for s in lesson['sections'] if s.get('example')).split('# Output:')[0]
    run = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, timeout=120)
    if run.returncode:
        raise AssertionError(run.stderr)
    return run.stdout.splitlines()


def text_cleaning():
    return _lesson_output('text-cleaning')[0].split()[0]


def vectorize_not_apply():
    import numpy as np
    hours = pd.Series([1, 5, 9])
    picked = np.select([hours > 0, hours > 4], ['first', 'second'], default='none')
    return pick(picked[1], {'first': "The first matching condition's choice"})


def correlation_and_outliers():
    with_outlier = float(_lesson_output('correlation-and-outliers')[1].split()[2])
    return pick(with_outlier, {0.64: 'It falls to 0.64', 0.98: 'It stays at 0.98'})


def reproducible_notebooks():
    return _lesson_output('reproducible-notebooks')[0].split(':')[1].strip()


FACTS = {
    'text-cleaning/2': text_cleaning, 'vectorize-not-apply/2': vectorize_not_apply,
    'correlation-and-outliers/2': correlation_and_outliers, 'reproducible-notebooks/2': reproducible_notebooks,
    'question-and-grain/2': question_and_grain, 'load-and-inspect/2': load_and_inspect,
    'numpy-arrays/2': numpy_arrays, 'types-and-dates/2': types_and_dates, 'select-and-filter/2': select_and_filter,
    'missing-and-duplicates/2': missing_and_duplicates, 'indexes-and-alignment/2': indexes_and_alignment,
    'derive-and-validate/2': derive_and_validate, 'group-and-denominators/2': group_and_denominators,
    'joins-and-cardinality/2': joins_and_cardinality, 'distributions-and-outliers/2': distributions_and_outliers,
    'dates-and-aggregation/2': dates_and_aggregation, 'charts-for-questions/2': charts_for_questions,
    'reshape-for-comparison/2': reshape_for_comparison, 'association-and-comparison/2': association_and_comparison,
    'validation-functions/2': validation_functions, 'functions-and-tests/2': functions_and_tests,
    'chunking-and-weighting/2': chunking_and_weighting, 'reproducible-report/2': reproducible_report,
    'sensitivity-and-limits/2': sensitivity_and_limits,
    'stage/foundation/1': foundation_missing_column, 'stage/foundation/2': foundation_channel,
    'stage/foundation/3': foundation_empty,
    'stage/intermediate/1': intermediate_unmatched, 'stage/intermediate/2': intermediate_rows,
    'stage/intermediate/3': intermediate_means,
    'stage/advanced/1': advanced_infinite, 'stage/advanced/2': advanced_repeatable,
    'stage/advanced/3': advanced_blank_line,
}


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def main():
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Data analysis with Python checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Data analysis with Python checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
