"""Fact checks for the Plan and Review Your Week checkpoint answers.

Three answers run the practice studio in paths/weekly-planning-journey/practice under Node: lab-model.js's
plan, move and capacity, using the studio's own starting values from lab.html and lab.js (the 300-minute
week with a 20% buffer and the Disrupt button's 90 lost minutes, and the starting task board). The
hour budgets in the lessons and kits are recomputed here from the figures each question states. The
other answers come from the lesson and kit text and are checked as citations; see
tests/checkpoint_citations.py. Each fact returns the text of the option the result supports.
Needs Node.js on PATH. Run with Python 3.14+: python tests/weekly_planning_checkpoint_facts.py
"""
from functools import cache
import json
import re
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import ROOT, check, studio as run_studio  # noqa: E402

PRACTICE = ROOT / 'paths' / 'weekly-planning-journey' / 'practice'


def studio_value(field):
    match = re.search(rf'id="{field}"[^>]*value="([^"]*)"', (PRACTICE / 'lab.html').read_text(encoding='utf-8'))
    if not match:
        raise AssertionError(f'lab.html has no starting value for {field}')
    return match.group(1)


def starting_tasks():
    match = re.search(r'let tasks=(\[.*?\]),nextId', (PRACTICE / 'lab.js').read_text(encoding='utf-8'))
    if not match:
        raise AssertionError('lab.js has no starting task list')
    return re.sub(r'(\w+):', r'"\1":', match.group(1)).replace("'", '"')


@cache
def studio():
    available, buffer, planned, wip = (int(studio_value(f)) for f in ('available', 'buffer', 'planned', 'wip'))
    disrupt = re.search(r"\$\('disruption'\)\.value='(\d+)'", (PRACTICE / 'lab.js').read_text(encoding='utf-8'))
    tasks = json.loads(starting_tasks())
    ready = next(t['id'] for t in tasks if t['status'] == 'ready')
    expressions = [
        ['habit', "lab.plan('I close the service desk', 'update the waiting list', "
                  "'note the most important waiting request')"],
        ['board', f'lab.move({json.dumps(tasks)}, {ready}, "doing", {wip})'],
        ['week', f'lab.capacity({available}, {buffer}, {planned}, {disrupt.group(1)})'],
    ]
    return {'tasks': tasks, **run_studio('weekly-planning-journey', expressions)}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def hours(value):
    return f'{value:g}'


def supporting_habit():
    return studio()['habit']['value']


def week_context():
    return hours(5 * (17 - 9 - 1))


def priorities_capacity():
    shortfall = 8 + 2 + 3 - 11
    return pick(shortfall, {0: 'None: it fits', 1: 'One hour', 2: 'Two hours'})


def midweek_disruption():
    left, event = 11 - 4 - 2, 8 - 4
    return pick((left, event, left - event), {(5, 4, 1): 'Five hours: four for event work and one uncommitted'})


def communicate_tradeoffs():
    gap = 4 + 1 + 0.5 - 5
    return pick(gap, {-0.5: 'It fits, with half an hour spare', 0.5: 'Half an hour short', 1.5: 'One and a half hours short'})


def collect_week_evidence():
    over = 7 + 2 + 3 - 11
    return pick(over, {0: 'Exactly on budget', -1: 'One hour under', 1: 'One hour over'})


def foundation_budget():
    return hours(35 - 12 - 12)


def foundation_board():
    result = studio()['board']
    started = [t['status'] for t in studio()['tasks'] if t['status'] in ('doing', 'blocked')]
    if 'error' in result and 'Blocked work still counts' in result['error'] and sorted(started) == ['blocked', 'doing']:
        return 'It is refused, because blocked work still counts as started'
    raise AssertionError(f'unexpected board result {result!r}')


def intermediate_ledger():
    return pick((3 + 6 + 2, 11 - (3 + 6 + 2)), {(11, 0): '11 hours, with no reserve left'})


def intermediate_studio():
    week = studio()['week']['value']
    if (week['reserve'], week['remaining'], week['planned']) != (60, 210, 240):
        raise AssertionError(f'the studio week is not the one the question describes: {week!r}')
    return pick(week['shortfall'], {0: 'The plan fits, using 30 minutes of the buffer',
                                    30: 'A shortfall of 30 minutes after the disruption',
                                    90: 'A shortfall of 90 minutes after the disruption'})


def advanced_budget():
    return hours(35 - 14 - 12 - 2)


FACTS = {
    'week-context/2': week_context, 'priorities-capacity/2': priorities_capacity,
    'supporting-habit/2': supporting_habit, 'midweek-disruption/2': midweek_disruption,
    'communicate-tradeoffs/2': communicate_tradeoffs, 'collect-week-evidence/2': collect_week_evidence,
    'stage/foundation/1': foundation_budget, 'stage/foundation/2': foundation_board,
    'stage/intermediate/1': intermediate_ledger, 'stage/intermediate/2': intermediate_studio,
    'stage/advanced/1': advanced_budget,
}

SOURCED = {
    'capture-week/2': ('capture-week', 'The noticeboard is an optional idea, not an agreed Friday obligation.'),
    'outcomes-next-actions/2': ('outcomes-next-actions', 'Formatting a final list before names arrive risks rework'),
    'calendar-energy/2': ('calendar-energy', 'Low-energy time is not automatically spare time'),
    'baseline-plan-project/2': ('baseline-plan-project', 'Friday delivery assumes the list arrives by Thursday morning.'),
    'learning-in-week/2': ('learning-in-week', 'The optional Friday question is not counted as completed until it occurs.'),
    'revised-plan-project/2': ('revised-plan-project', "Because Monday's spare hour cannot be reused, the service "
                               'owner agrees to defer one noncritical routine hour.'),
    'review-without-blame/2': ('review-without-blame', 'Avoid I am always disorganised; it is too broad to test or repair.'),
    'choose-next-experiment/2': ('choose-next-experiment',
                                 'The observation is whether a usable answer arrives before the decision point.'),
    'next-week-portfolio/2': ('next-week-portfolio', 'Confirm carried work is not already included in the new '
                              'routine estimate before subtracting it twice.'),
    'stage/foundation/3': ('stage:foundation', 'It defers the four-hour noticeboard idea'),
    'stage/intermediate/3': ('stage:intermediate', 'cancels Thursday learning and retains Monday’s check'),
    'stage/advanced/2': ('stage:advanced', 'Choose the accepted four-hour task and three hours of reserve'),
    'stage/advanced/3': ('stage:advanced', 'The larger review worksheet and five-topic portfolio are optional.'),
}

if __name__ == '__main__':
    check('weekly-planning-journey', 'Plan and Review Your Week', FACTS, SOURCED)
