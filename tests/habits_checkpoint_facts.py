"""Fact checks for the Habits & Behaviour Change checkpoint answers.

The completion rates in lessons 13 and 16 and the project stages are recomputed here from the counts
each question states. The stage 2 plan sentence runs the practice studio's habit planner
(practice/lab-model.js's plan) under Node. The other answers come from the lesson and project text and
are checked as citations; see tests/checkpoint_citations.py. Each fact returns the text of the option
the result supports.
Needs Node.js on PATH. Run with Python 3.11+: python tests/habits_checkpoint_facts.py
"""
from fractions import Fraction
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import check, plan_sentence  # noqa: E402

COURSE = 'habits-behaviour-change'


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def percent(done, available):
    return f'{round(Fraction(done * 100, available))}%'


def measurement():
    return pick((percent(3, 4), percent(3, 6)), {
        ('75%', '50%'): '75% of available opportunities and 50% of calendar days',
        ('50%', '75%'): '50% of available opportunities and 75% of calendar days',
    })


def one_change_test():
    rates = Fraction(2, 3), Fraction(3, 4)
    return pick(rates, {(Fraction(2, 3), Fraction(3, 4)): '2/3, then 3/4', (Fraction(2, 5), Fraction(3, 5)): '2/5, then 3/5',
                        (Fraction(3, 5), Fraction(4, 5)): '3/5, then 4/5'})


def intermediate_plan():
    return plan_sentence(COURSE, 'I arrive and can put my bags down', 'put my keys in the bowl',
                         'store the keys at the next available pause')


def intermediate_rate():
    available, done, unavailable = 4, 3, 1
    return pick(percent(done, available), {'75%': '75% of available opportunities',
                                           percent(done, available + unavailable): '60% of all five arrivals'})


def advanced_rates():
    sessions, usable, done = 6, 2, 2
    return pick((done, usable, sessions), {(2, 2, 6): '2 of 2 usable opportunities, but 2 of 6 sessions'})


FACTS = {
    'measurement/2': measurement, 'one-change-test/2': one_change_test,
    'stage/intermediate/1': intermediate_plan, 'stage/intermediate/2': intermediate_rate,
    'stage/advanced/2': advanced_rates,
}

SOURCED = {
    'behaviour-not-identity/2': ('behaviour-not-identity', 'after paying, put the receipt in the wallet’s empty pocket'),
    'goals-and-actions/2': ('goals-and-actions', 'Boundary: this does not prevent network outages.'),
    'baseline-observation/2': ('baseline-observation', 'Otherwise a completion count conceals changes in opportunity.'),
    'cue-map/2': ('cue-map', 'All three days have a cue, but only Monday has an uninterrupted opportunity.'),
    'habit-or-routine/2': ('habit-or-routine', 'completion alone does not establish automatic initiation'),
    'small-start/2': ('small-start', 'The minimum and the extension need separate labels so the target does not '
                      'drift upward unnoticed.'),
    'time-variation/2': ('time-variation', 'estimates ranging from 18 to 254 days among fitted cases'),
    'if-then/2': ('if-then', 'The if clause should identify an opportunity, not merely a feeling such as when I am motivated.'),
    'friction/2': ('friction', 'A simpler setup cannot create time for a repair during an unavailable evening.'),
    'prompt-design/2': ('prompt-design', 'Owen moves the reminder to the previous evening'),
    'replacement/2': ('replacement', 'simply replacing it with another work task might miss the original need'),
    'obstacle-plan/2': ('obstacle-plan', 'An explicit skip can be appropriate when opportunity is absent.'),
    'feedback-reward/2': ('feedback-reward', 'Leo samples setup time on several mornings and checks whether the tray '
                          'adds clutter before deciding to keep it.'),
    'missed-opportunity/2': ('missed-opportunity', "Lally's study found one missed opportunity did not materially "
                             'disrupt the modelled process'),
    'changed-context/2': ('changed-context', 'Recoverability and allowed storage stay fixed; cue, action size and '
                          'timing can change.'),
    'support-consent/2': ('support-consent', 'additional monitoring needs a new agreement'),
    'maintain-or-retire/2': ('maintain-or-retire', 'Two systems that once served different purposes may now copy the '
                             'same information, increasing effort and error.'),
    'evidence-review/2': ('evidence-review', 'He reports the quicker setup and the changed workload together.'),
    'stage/foundation/1': ('stage:foundation', 'only Wednesday used the target'),
    'stage/foundation/2': ('stage:foundation', 'The useful minimum is storing the keys, not organising the whole hallway.'),
    'stage/foundation/3': ('stage:foundation', 'Carrying bags constrained Tuesday'),
    'stage/intermediate/3': ('stage:intermediate', 'The single setup change is moving the bowl; the action stays the same.'),
    'stage/advanced/1': ('stage:advanced', 'The lighter bag load also changed, so the sample cannot isolate the bowl as the cause.'),
    'stage/advanced/3': ('stage:advanced', 'Change or retire the setup if it obstructs access or stops helping retrieval'),
}

if __name__ == '__main__':
    check(COURSE, 'Habits & Behaviour Change', FACTS, SOURCED)
