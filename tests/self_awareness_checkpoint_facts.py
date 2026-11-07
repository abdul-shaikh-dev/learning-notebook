"""Fact checks for the Self-Awareness & Communication checkpoint answers.

The course teaches judgement in conversations, so its answers come from the lesson text, the stage
projects and, for the studio's conversation activity, the feedback that practice/lab.js shows for each
opening. Each entry names its source and a phrase that must appear there word for word; see
tests/checkpoint_citations.py.
Run with Python 3.11+: python tests/self_awareness_checkpoint_facts.py
"""
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import check  # noqa: E402

SOURCED = {
    'observation-interpretation/2': ('observation-interpretation', 'Is this roster final, and should my assignment be included?'),
    'feeling-and-action/2': ('feeling-and-action', 'ignored can imply someone intended exclusion'),
    'values-and-priorities/2': ('values-and-priorities', 'The choice respects both concerns while making its '
                                'opportunity cost visible.'),
    'reflection-record/2': ('reflection-record', 'Reflection works best when it ends with a useful question or action'),
    'perspective-check/2': ('perspective-check', 'Even if an invitation was omitted accidentally, the person still '
                            'missed the session.'),
    'pause-and-purpose/2': ('pause-and-purpose', 'Separating purposes is useful only if the broader issue receives a '
                            'real follow-up. Otherwise postponement can become avoidance'),
    'listen-with-attention/2': ('listen-with-attention', 'I have five minutes now, or fifteen after six. Which would work?'),
    'open-questions/2': ('open-questions', 'closed checks are helpful for confirming details such as a deadline'),
    'paraphrase/2': ('paraphrase', 'adds an interpretation Dev did not state'),
    'validate-without-agreeing/2': ('validate-without-agreeing', 'Validation becomes misleading when it claims '
                                    'knowledge of an emotion the person has not named.'),
    'clear-request/2': ('clear-request', 'State when you need confirmation as well as when you need the task completed'),
    'boundaries/2': ('boundaries', 'he cannot require everyone else never to send a message'),
    'give-feedback/2': ('give-feedback', 'Avoid exaggerations such as everyone was confused when only two readers asked.'),
    'receive-feedback/2': ('receive-feedback', 'Receiving feedback involves two separate decisions: whether you '
                           'understand it and whether you will act on it.'),
    'conflict-map/2': ('conflict-map', 'Preserve the disagreement when no feasible overlap exists instead of forcing '
                       'a superficial agreement.'),
    'negotiate-options/2': ('negotiate-options', 'obtain agreement before counting that slot as available'),
    'repair/2': ('repair', 'respect that and still correct the record appropriately'),
    'written-channel/2': ('written-channel', 'A written record suits this factual confirmation.'),
    'power-and-help/2': ('power-and-help', 'Another informal request is not a prerequisite for seeking support.'),
    'conversation-review/2': ('conversation-review', 'Equipment ownership remains undecided, so the committee will '
                              'choose an owner at Monday’s check-in.'),
    'stage/foundation/1': ('stage:foundation', 'Dana separates the observed two changed headings from the guess that '
                           'someone dismissed the work.'),
    'stage/foundation/2': ('stage:foundation', 'Her purpose is to understand the change before deciding what to do.'),
    'stage/foundation/3': ('stage:foundation', 'If the timing does not suit, she arranges another time'),
    'stage/intermediate/1': ('stage:intermediate', 'only the headings changed'),
    'stage/intermediate/2': ('stage:intermediate', 'The partner agrees to the note, not to freezing every edit.'),
    'stage/intermediate/3': ('lab.js', 'Next, listen to the reply and confirm a feasible agreement; the opening '
                             'alone does not resolve the situation.'),
    'stage/advanced/1': ('stage:advanced', 'The rewrite does not fit the thirty-minute window'),
    'stage/advanced/2': ('stage:advanced', 'The introduction rewrite remains unresolved and is reviewed next Tuesday.'),
    'stage/advanced/3': ('stage:advanced', 'without claiming that both prefer the result or that a peer can '
                         'unilaterally approve release'),
}

if __name__ == '__main__':
    check('self-awareness-communication', 'Self-Awareness & Communication', {}, SOURCED)
