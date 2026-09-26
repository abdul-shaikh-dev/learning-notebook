"""Offline teaching harness. No model, network, credentials or external effects.

ScriptedSource emits predetermined proposals. Tests establish local mechanics,
not model intelligence, semantic grounding or comprehensive injection defense.
"""
from copy import deepcopy
from dataclasses import dataclass

DOCUMENTS = (
    {'id': 'SQL-07', 'title': 'SQL joins', 'excerpt': 'An INNER JOIN returns matching row pairs.'},
    {'id': 'PY-01', 'title': 'Python functions', 'excerpt': 'Functions group reusable behavior with explicit inputs.'},
    {'id': 'AI-01', 'title': 'Agent tools', 'excerpt': 'Tool requests are validated before the application executes them.'},
)


class ScriptedSource:
    """A deterministic test double, NOT a language model."""
    def __init__(self, proposals):
        self.proposals = iter(deepcopy(proposals))

    def __call__(self, context):
        return next(self.proposals)


def bounded_text(value, limit):
    # Bound the supplied text before normalization, not just the trimmed value.
    if type(value) is not str or len(value) > limit or not value.strip():
        raise ValueError('invalid bounded text')
    return value.strip()


def search_lessons(query):
    """Tiny public synthetic lexical collection; not semantic/vector retrieval."""
    terms = query.casefold().split()
    hits = []
    for doc in DOCUMENTS:
        haystack = (doc['title'] + ' ' + doc['excerpt']).casefold()
        if all(term in haystack for term in terms):
            hits.append(dict(doc))
    return {'hits': hits[:3]}


def validate_observation(value):
    if type(value) is not dict or set(value) != {'hits'}:
        raise ValueError('invalid observation object')
    hits = value['hits']
    if type(hits) is not list or len(hits) > 3:
        raise ValueError('invalid hit count')
    accepted, seen = [], set()
    for hit in hits:
        if type(hit) is not dict or set(hit) != {'id', 'title', 'excerpt'}:
            raise ValueError('invalid hit fields')
        record = {key: bounded_text(hit[key], limit)
                  for key, limit in (('id', 40), ('title', 100), ('excerpt', 300))}
        if record['id'] in seen:
            raise ValueError('duplicate evidence ID')
        seen.add(record['id'])
        accepted.append(record)
    return {'hits': accepted}


@dataclass
class Result:
    status: str
    answer: str
    citations: list[str]
    events: list[dict]
    evidence: list[dict]


def run(source, *, search=search_lessons, max_steps=4):
    """Run at most max_steps proposals with exactly one allowed read tool.

    This bounds proposal count, not time: an injected callable can hang. A live
    adapter must enforce deadlines/cancellation, identity and access policy.
    There is no durable state or effectful-tool approval flow here.
    """
    if type(max_steps) is not int or not 1 <= max_steps <= 20:
        raise ValueError('max_steps must be an integer from 1 to 20')
    events, evidence = [], {}

    def result(status, answer='', citations=None):
        return Result(status, answer, list(citations or []), deepcopy(events),
                      deepcopy(list(evidence.values())))

    for step in range(1, max_steps + 1):
        context = {'step': step, 'remaining_proposals': max_steps - step + 1,
                   'evidence': deepcopy(list(evidence.values()))}
        try:
            proposal = source(context)
        except StopIteration:
            events.append({'step': step, 'event': 'source_exhausted'})
            return result('failed')
        except Exception:
            # Do not echo potentially sensitive provider exception messages.
            events.append({'step': step, 'event': 'source_failed'})
            return result('failed')
        if type(proposal) is not dict or type(proposal.get('kind')) is not str:
            events.append({'step': step, 'event': 'invalid_proposal'})
            return result('invalid')
        kind = proposal['kind']
        if kind == 'tool':
            if set(proposal) != {'kind', 'name', 'args'}:
                events.append({'step': step, 'event': 'invalid_proposal'})
                return result('invalid')
            if proposal['name'] != 'search_lessons':
                events.append({'step': step, 'event': 'tool_denied'})
                return result('denied')
            args = proposal['args']
            try:
                if type(args) is not dict or set(args) != {'query'}:
                    raise ValueError('query only')
                query = bounded_text(args['query'], 80)
            except ValueError:
                events.append({'step': step, 'event': 'invalid_arguments'})
                return result('invalid')
            events.append({'step': step, 'event': 'tool_started', 'tool': 'search_lessons'})
            try:
                observation = validate_observation(search(query))
                for hit in observation['hits']:
                    previous = evidence.get(hit['id'])
                    if previous is not None and previous != hit:
                        raise ValueError('conflicting evidence revision')
                for hit in observation['hits']:
                    evidence[hit['id']] = hit
            except Exception:
                events.append({'step': step, 'event': 'tool_failed', 'tool': 'search_lessons'})
                return result('failed')
            events.append({'step': step, 'event': 'tool_succeeded',
                           'tool': 'search_lessons', 'hits': len(observation['hits'])})
        elif kind == 'finish':
            try:
                if set(proposal) != {'kind', 'answer', 'citations'}:
                    raise ValueError('invalid finish fields')
                answer = bounded_text(proposal['answer'], 1000)
                citations = proposal['citations']
                if type(citations) is not list or not 1 <= len(citations) <= 3:
                    raise ValueError('citations required')
                if any(type(c) is not str or c not in evidence for c in citations):
                    raise ValueError('unobserved citation')
                if len(set(citations)) != len(citations):
                    raise ValueError('duplicate citations')
            except ValueError:
                events.append({'step': step, 'event': 'invalid_finish'})
                return result('invalid')
            events.append({'step': step, 'event': 'completed'})
            # Membership checked, NOT semantic entailment or answer truth.
            return result('completed', answer, citations)
        elif kind == 'clarify':
            try:
                if set(proposal) != {'kind', 'question'}:
                    raise ValueError('invalid clarification fields')
                question = bounded_text(proposal['question'], 300)
            except ValueError:
                events.append({'step': step, 'event': 'invalid_clarification'})
                return result('invalid')
            events.append({'step': step, 'event': 'needs_input'})
            return result('needs_input', question)
        elif kind == 'stop':
            if set(proposal) != {'kind', 'reason'} or proposal['reason'] != 'insufficient_evidence':
                events.append({'step': step, 'event': 'invalid_stop'})
                return result('invalid')
            events.append({'step': step, 'event': 'insufficient_evidence'})
            return result('incomplete', 'Available evidence is insufficient.')
        else:
            events.append({'step': step, 'event': 'unknown_proposal_kind'})
            return result('invalid')
    events.append({'step': max_steps, 'event': 'budget_exhausted'})
    return result('budget_exhausted')


def demo():
    script = [
        {'kind': 'tool', 'name': 'search_lessons', 'args': {'query': 'joins'}},
        {'kind': 'finish', 'answer': 'INNER JOIN returns matching row pairs.', 'citations': ['SQL-07']},
    ]
    outcome = run(ScriptedSource(script))
    print('OFFLINE SCRIPTED DEMONSTRATION — no model call')
    print('Status:', outcome.status)
    print('Answer:', outcome.answer)
    print('Citations:', outcome.citations)
    print('Events:', [event['event'] for event in outcome.events])


if __name__ == '__main__':
    demo()
