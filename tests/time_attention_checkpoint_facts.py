"""Fact checks for the Time, Attention & Energy checkpoint answers.

Minute budgets, logs, interruptions, medians and gaps are recalculated from the numbers in each
question, and the buffer and boundary questions run the practice studio's capacity sketch
(practice/lab-model.js). The other answers cite the lesson or stage text word for word; see
tests/checkpoint_citations.py.
Run with Python 3.14+: python tests/time_attention_checkpoint_facts.py
"""
from statistics import median
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import check, studio  # noqa: E402

COURSE = 'time-attention-energy'


def pick(value, table):
    if value not in table:
        raise AssertionError(f'no option for {value!r}')
    return table[value]


def capacity(available, buffer, planned, disruption):
    result = studio(COURSE, [['c', f'lab.capacity({available}, {buffer}, {planned}, {disruption})']])['c']
    if 'error' in result:
        raise AssertionError(result['error'])
    return result['value']


def time_log():
    log = {'solving': 30, 'coordination': 15, 'delay': 10, 'checking': 35}
    return f'{sum(log.values())} minutes in total, {log["solving"] + log["checking"]} of them on the task'


def disruption(block, alerts, alert_minutes, return_minutes):
    lost = alerts * (alert_minutes + return_minutes)
    return f'{lost} minutes, leaving {block - lost} for reading'


def buffer():
    c = capacity(150, 0, 90 + 25, 0)
    return f'{c["spare"]} uncommitted minutes' if not c['shortfall'] else f'A {c["shortfall"]}-minute shortfall'


def correct_answers():
    short, long = 4 - 0, 6 - 3
    return pick((short > long, short == long), {(True, False): 'The 20-minute session: 4 correct against 3',
                                                (False, True): 'Both equally'})


def drafts():
    observed = [70, 90, 110]
    return f'{min(observed)}–{max(observed)} minutes, middle {median(observed)}'


def request():
    c = capacity(30, 0, 90, 0)
    return f'A {c["shortfall"]}-minute shortfall' if c['shortfall'] else 'The plan fits'


FACTS = {
    'capacity/2': lambda: str(180 - (20 + 25 + 15)),
    'time-log/2': time_log,
    'sleep-boundary/2': lambda: pick(45 + 10 + 20 <= 75, {
        True: '45 minutes on the required calculation, 10 recording the next step and 20 for the bedtime transition'}),
    'attention-context/2': lambda: disruption(60, 3, 2, 3),
    'estimate/2': lambda: f'{median([45 - 10, 60 - 10, 90 - 10])} minutes',
    'buffer/2': buffer,
    'breaks/2': correct_answers,
    'weekly-review/2': lambda: pick((2 + 3) - 3, {2: 'Two', 5: 'Five', 0: 'None'}),
    'boundaries/2': lambda: f'A {50 - 35}-minute gap',
    'experiment/2': lambda: pick(10 - 20 > 0, {False: 'No, though it may have another benefit',
                                               True: 'Yes, because ten minutes were saved'}),
    'stage/foundation/1': lambda: f'{240 - 90 - 90 - 30} minutes',
    'stage/intermediate/1': drafts,
    'stage/advanced/2': request,
}

SOURCED = {
    'outcomes/2': ('outcomes', 'Stop when those items exist; reading the next chapter belongs to another session.'),
    'priorities/2': ('priorities', 'use an explicit tie-break such as dependency, reversibility or effort'),
    'small-start/2': ('small-start', 'If the chapter is unavailable, obtaining the file becomes the next action'),
    'blocks/2': ('blocks', 'A movable block can have a latest finish or a fallback outcome'),
    'notifications/2': ('notifications', 'A communication agreement should explain what urgent means and how to use '
                        'the urgent route.'),
    'resume/2': ('resume', 'On return, read the cue and inspect the actual file because another person may have '
                 'changed it.'),
    'energy-patterns/2': ('energy-patterns', 'If the morning window belongs to essential care or travel, test a '
                          'different feasible window instead of displacing that responsibility.'),
    'overload/2': ('overload', 'clarification can reduce reconstruction, but it cannot create hours'),
    'shared-time/2': ('shared-time', 'If no reply arrives by the agreed time, use the agreed fallback rather than '
                      'silently changing the deadline.'),
    'sustainable-system/2': ('sustainable-system', 'Build a minimum version for disrupted days: capture the essential '
                             'commitment, choose one next action and leave a return cue.'),
    'evidence-review/2': ('evidence-review', 'The increase cannot be attributed to the new routine alone.'),
    'stage/foundation/2': ('stage:foundation', 'Optional formatting moves to another day.'),
    'stage/foundation/3': ('stage:foundation', 'Return cue: draft.md, paragraph two checked; next verify paragraph '
                           'three against the booking email'),
    'stage/intermediate/2': ('stage:intermediate', 'A lighter workload could explain the improvement.'),
    'stage/intermediate/3': ('stage:intermediate', 'These sessions alone cannot show that batching caused it.'),
    'stage/advanced/1': ('stage:advanced', 'For a 90-minute request with 30 minutes available, offer a partial result '
                         'today or a full result Thursday.'),
    'stage/advanced/3': ('stage:advanced', 'Keep one commitment list, a daily capacity check and a weekly review.'),
}

if __name__ == '__main__':
    check(COURSE, 'Time, Attention & Energy', FACTS, SOURCED)
