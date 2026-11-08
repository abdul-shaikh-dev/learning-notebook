"""Fact checks for the Task & Project Management checkpoint answers.

Answers about work in progress run the practice studio's task board (practice/lab-model.js), so a
question about a blocked card matches what the board actually refuses. Cycle times and ages are
elapsed day differences between weekdays, and estimate ranges come from the observed durations.
The other answers cite the lesson or stage text word for word; see tests/checkpoint_citations.py.
Run with Python 3.14+: python tests/task_project_checkpoint_facts.py
"""
import json
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import check, studio  # noqa: E402

COURSE = 'task-project-management'
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


def pick(value, table):
    if value not in table:
        raise AssertionError(f'no option for {value!r}')
    return table[value]


def elapsed(start, end):
    return DAYS.index(end) - DAYS.index(start)


def board(limit, statuses, card):
    """Moves `card` to Doing on the studio board; returns 'moved' or 'refused: blocked counts'."""
    tasks = [{'id': i + 1, 'title': f'Card {i + 1}', 'status': s} for i, s in enumerate(statuses)]
    result = studio(COURSE, [['move', f'lab.move({json.dumps(tasks)}, {card}, "doing", {limit})']])['move']
    if 'error' not in result:
        return 'moved'
    if 'Blocked work still counts' not in result['error']:
        raise AssertionError(result['error'])
    return 'refused: blocked counts'


def observed_range(durations):
    return f'{min(durations)}–{max(durations)} days'


FACTS = {
    'wip/2': lambda: pick(board(3, ['doing', 'blocked', 'blocked', 'ready'], 4), {
        'refused: blocked counts': 'It is refused: blocked cards still count as started work',
        'moved': 'It moves: blocked cards do not count'}),
    'estimates/2': lambda: observed_range([1, 4, 5]),
    'metrics/2': lambda: f'Cycle time {elapsed("Tuesday", "Saturday")} days; age {elapsed("Thursday", "Sunday")} days',
    'stage/intermediate/1': lambda: pick(board(2, ['doing', 'blocked', 'ready'], 3), {
        'refused: blocked counts': 'No: both started items use the limit',
        'moved': 'Yes: blocked work does not count'}),
    'stage/intermediate/3': lambda: observed_range([2, 3, 6]).replace(' days', ' days, with three samples too few for '
                                                                      'a reliable percentile'),
    'stage/advanced/1': lambda: f'Cycle time {elapsed("Monday", "Thursday")} days; age {elapsed("Tuesday", "Friday")} days',
}

SOURCED = {
    'raci/2': ('raci', 'two As means nobody can make the final call'),
    'critical-path/2': ('critical-path', 'Booking the room can slip two days without moving the workshop'),
    'status-reporting/2': ('status-reporting', 'Amber: at risk, with a recovery plan the team can carry out itself'),
    'capture/2': ('capture', 'Create one inbox item with links to all three and retain the unresolved collection time '
                  'as a question; do not create three bookings.'),
    'task-project/2': ('task-project', 'If a task repeatedly expands into several deliverables, promote it into a small '
                       'project'),
    'next-action/2': ('next-action', 'Sending completes this action; record the reply as a separate waiting item.'),
    'done/2': ('done', 'criteria can change when a newly discovered essential requirement appears, but record the change.'),
    'scope/2': ('scope', 'Record essential participation needs early because they can affect venue and material '
                'decisions.'),
    'decompose/2': ('decompose', 'A tree makes coverage visible but does not establish execution order'),
    'sequence/2': ('sequence', 'Resolve it by agreeing a provisional input or splitting an early deliverable; dates '
                   'alone cannot fix circular waiting.'),
    'board/2': ('board', 'return with a named correction and owner rather than bounce the card without explanation'),
    'pull/2': ('pull', 'ready room-confirmation task that unblocks the notice; leave an unclear optional logo redesign '
               'in the backlog'),
    'owners/2': ('owners', 'If the reviewer is unavailable, use an explicit alternate or escalate the decision.'),
    'blocked/2': ('blocked', 'Keep the item inside WIP when it has started; moving it out of sight does not remove its '
                  'delivery risk.'),
    'risk/2': ('risk', 'A confirmed closure of the chosen park is an issue: activate or choose the replacement location '
               'now.'),
    'change/2': ('change', 'Remove the unnecessary session selector and two-branch routing.'),
    'review/2': ('review', 'The field checklist may pass verification; the usability task fails validation.'),
    'retrospective/2': ('retrospective', 'If several policies change together, improvement may be useful but '
                        'attribution becomes unclear.'),
    'parallel/2': ('parallel', 'A handoff should state version, acceptance criteria and unresolved questions.'),
    'close/2': ('close', 'Attendance establishes participation, while feedback or an observed exercise offers'),
    'system-review/2': ('system-review', 'takes 40 minutes daily to maintain five reports. Keep one board with owner, '
                        'finish criteria and'),
    'stage/foundation/1': ('stage:foundation', 'Confirm venue before publishing its address; drafting can run '
                           'independently.'),
    'stage/foundation/2': ('stage:foundation', 'Exclude video production from the initial scope.'),
    'stage/foundation/3': ('stage:foundation', 'plan venue, exercise sheet and invitation'),
    'stage/intermediate/2': ('stage:intermediate', 'A video request needs revised scope or capacity'),
    'stage/advanced/2': ('stage:advanced', 'A beginner struggles to find the first exercise step despite a complete '
                         'checklist, so revise and retest.'),
    'stage/advanced/3': ('stage:advanced', 'a named owner for the access issue'),
}

if __name__ == '__main__':
    check(COURSE, 'Task & Project Management', FACTS, SOURCED)
