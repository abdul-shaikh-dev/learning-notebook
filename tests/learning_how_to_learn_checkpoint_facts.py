"""Fact checks for the Learning How to Learn checkpoint answers.

The course's practice studio (practice/lab-model.js) is shared by all six personal effectiveness courses
and models none of this course's content, so every answer here comes from the lesson text or the
printable kits. Each entry names its source and a phrase that must appear there word for word; see
tests/checkpoint_citations.py. The routing answers follow the fictional policies in foundation-kit.md
and lesson 16.
Run with Python 3.14+: python tests/learning_how_to_learn_checkpoint_facts.py
"""
import sys

sys.dont_write_bytecode = True
from checkpoint_citations import check  # noqa: E402

SOURCED = {
    'learning-target/2': ('learning-target', 'Friday will use three different cases'),
    'recognition-recall/2': ('recognition-recall', 'familiar, not yet retrievable'),
    'retrieval-loop/2': ('retrieval-loop', 'so an incorrect guess does not become your only record'),
    'small-prompts/2': ('small-prompts', 'Long procedures often need a scenario or a checklist practice'),
    'spaced-returns/2': ('spaced-returns', 'If recall repeatedly fails, revisit sooner or simplify the prompt'),
    'check-baseline/2': ('check-baseline', 'count a case correct only if both approval route and reason are correct'),
    'explain-connections/2': ('explain-connections', 'A fluent invented explanation can still be wrong'),
    'worked-to-independent/2': ('worked-to-independent',
                                'A correct answer with the rule visible shows supported application, not yet independent recall'),
    'mix-related-cases/2': ('mix-related-cases', 'Start with categories you can explain before increasing variety'),
    'feedback-action/2': ('feedback-action', 'She asks which case and rule were wrong'),
    'error-patterns/2': ('error-patterns', 'Knowing but not applying suggests rule selection'),
    'calibrate-confidence/2': ('calibrate-confidence', 'Low confidence with a correct explanation may need another '
                               'delayed attempt rather than endless immediate rereading'),
    'study-environment/2': ('study-environment', 'There is no required minimum session length'),
    'retain-useful-notes/2': ('retain-useful-notes', 'A summary that is accurate but never used may be less useful '
                              'than a short set of questions you revisit'),
    'plan-practice-week/2': ('plan-practice-week',
                             'If the later attempt is carried out, it provides delayed evidence. The plan alone does not'),
    'transfer-cases/2': ('transfer-cases', 'standard bookings up to two hours go to the desk coordinator'),
    'evaluate-advice/2': ('evaluate-advice',
                          'the specific number of questions and weekly dates used here are teaching examples'),
    'adapt-stalled-learning/2': ('adapt-stalled-learning', 'She tests the same skill in a shorter earlier window '
                                 'before concluding the rule itself is impossible for her'),
    'delayed-demonstration/2': ('delayed-demonstration', 'A clear unsuccessful attempt with a sensible next step is '
                                'more informative than an invented perfect score'),
    'maintain-learning/2': ('maintain-learning', 'Keep the rarely used current detail in a reliable reference and '
                            'practise finding it when relevant'),
    'stage/foundation/1': ('foundation-kit.md', 'B manager because the urgent same-day override applies'),
    'stage/foundation/2': ('foundation-kit.md',
                           'F coordinator because it is planned one day. Next month does not make it urgent today.'),
    'stage/foundation/3': ('stage:foundation',
                           'A pending check is honestly pending; it cannot be graded as demonstrated retention'),
    'stage/intermediate/1': ('intermediate-kit.md',
                             'knows the ordinary duration rule but omitted urgency; tentatively method selection'),
    'stage/intermediate/2': ('intermediate-kit.md', 'This immediate repair is not itself delayed retention evidence.'),
    'stage/intermediate/3': ('intermediate-kit.md', 'Wednesday care evening is not a catch-up slot.'),
    'stage/advanced/1': ('stage:advanced', 'restricted half-hour to the facilities lead'),
    'stage/advanced/2': ('stage:advanced', 'standard urgent ninety minutes to the desk coordinator'),
    'stage/advanced/3': ('stage:advanced', 'It carries forward checking exceptions, not the old urgency rule.'),
}

if __name__ == '__main__':
    check('learning-how-to-learn', 'Learning How to Learn', {}, SOURCED)
