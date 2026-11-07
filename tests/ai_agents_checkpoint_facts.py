"""Fact checks for the AI Agents checkpoint answers.

Each fact runs the course's offline workshop (paths/ai-agents/workshop.py), its evaluation and request
builders (provider_eval.py, provider_scaffold.py) or the model-free search in local_framework_lab.py, and
returns the text of the option its result supports. The script fails if that differs from the authored
correct option. No model, network or credentials are used.
Run with Python 3.14+: python tests/ai_agents_checkpoint_facts.py
"""
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'ai-agents'
sys.path.insert(0, str(COURSE))
from workshop import ScriptedSource, run, search_lessons  # noqa: E402
import provider_eval  # noqa: E402
import provider_scaffold  # noqa: E402
import local_framework_lab  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'workflow/2': 'Fixed workflows for known sequences, lesson 2',
    'memory/2': 'Scoped preferences without authority, lesson 12',
    'planning/2': 'Revising a plan when evidence changes, lesson 13',
    'clarification/2': 'Ambiguity that changes the action, lesson 14',
    'approval/2': 'Approval bound to the concrete action, lesson 15',
    'multiagent/2': 'Aggregate budgets across workers, lesson 22',
    'deployment/2': 'The behaviour-changing version bundle, lesson 23',
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


def search(query):
    return {'kind': 'tool', 'name': 'search_lessons', 'args': {'query': query}}


def finish(*citations):
    return {'kind': 'finish', 'answer': 'INNER JOIN returns matching row pairs.', 'citations': list(citations)}


def go(*proposals, **options):
    return run(ScriptedSource(list(proposals)), **options)


def names(result):
    return tuple(event['event'] for event in result.events)


def adapter(hits):
    return lambda query: {'hits': hits}


DOC = {'id': 'SQL-07', 'title': 'SQL joins', 'excerpt': 'An INNER JOIN returns matching row pairs.'}


def vocabulary():
    result = go(search('joins'), finish('SQL-07'))
    observed = {e['id'] for e in result.evidence}
    return pick((result.status, set(result.citations) <= observed),
                {('completed', True): 'The search ran and every citation is an observed evidence ID'})


def context():
    seen = []

    def source(ctx):
        seen.append(ctx['remaining_proposals'])
        return search('joins') if len(seen) == 1 else finish('SQL-07')
    run(source, max_steps=4)
    return str(seen[1])


def instructions():
    result = go({'kind': 'tool', 'name': 'upload_profile', 'args': {'query': 'profile'}})
    return pick((result.status, 'tool_started' in names(result)), {('denied', False): 'Status denied, with no tool_started event'})


def tools():
    result = go(search('quantum'), {'kind': 'stop', 'reason': 'insufficient_evidence'})
    event = next(e for e in result.events if e['event'].startswith('tool_') and e['event'] != 'tool_started')
    return pick((event['event'], event.get('hits')), {('tool_succeeded', 0): 'tool_succeeded with 0 hits'})


def loop():
    return go(search('joins'), finish('SQL-07'), max_steps=1).status


def state():
    result = go(search('joins'), search('functions'), max_steps=2)
    return pick((result.status, tuple(e['id'] for e in result.evidence)), {('budget_exhausted', ('SQL-07', 'PY-01')): 'SQL-07 and PY-01'})


def grounding():
    return pick(go(search('joins'), finish('PY-01')).status, {'invalid': 'Status invalid: PY-01 was never observed'})


def arguments():
    result = go({'kind': 'tool', 'name': 'search_lessons', 'args': {'query': 'joins', 'limit': 5}})
    return pick((result.status, 'tool_started' in names(result)), {('invalid', False): 'Status invalid, and the tool never starts'})


def outputs():
    hits = [dict(DOC, id=f'D-{i}') for i in range(4)]
    result = go(search('joins'), search=adapter(hits))
    return pick((result.status, names(result)), {('failed', ('tool_started', 'tool_failed')): 'Status failed, after tool_started and tool_failed'})


def retrieval():
    hits = search_lessons('combining rows')['hits']
    return pick(tuple(h['id'] for h in hits), {(): 'No hits', ('SQL-07',): 'SQL-07', ('SQL-07', 'PY-01'): 'SQL-07 and PY-01'})


def failures():
    def timeout(query):
        raise TimeoutError('read timed out')
    result = go(search('joins'), search=timeout)
    return pick((names(result), result.status), {(('tool_started', 'tool_failed'), 'failed'): 'tool_started, then tool_failed, with status failed'})


def budgets():
    return pick(outcome(lambda: go(search('joins'), max_steps=21)),
                {'ValueError: max_steps must be an integer from 1 to 20': 'Raises ValueError: max_steps must be an integer from 1 to 20'})


def case(case_id):
    return next(c for c in provider_eval.CASES if c['id'] == case_id)


def injection():
    answer = 'SQL-07 says INNER JOIN returns matching row pairs. PRIVATE_PROFILES_UPLOADED'
    return pick(provider_eval.score(case('injection'), answer), {False: 'False: a forbidden term fails the case'})


def datasets():
    cases = json.loads((COURSE / 'evaluation_cases.json').read_text(encoding='utf-8'))['cases']
    expected = next(c['expectedStatus'] for c in cases if c['id'] == 'missing-topic')
    workshop = go(search('quantum'), {'kind': 'stop', 'reason': 'insufficient_evidence'}).status
    return pick((expected, workshop), {('incomplete', 'incomplete'): 'incomplete'})


def traces():
    script = [search('joins'), finish('SQL-07')]
    return pick(names(run(ScriptedSource(script))), {('tool_started', 'tool_succeeded', 'completed'): 'tool_started, tool_succeeded, completed'})


def judges():
    return pick(provider_eval.score(case('known'), 'An INNER JOIN keeps matching rows.'), {False: 'False: the required SQL-07 citation is missing'})


def live_integration():
    record = provider_scaffold.evidence('c', 'm', {'input_tokens': 1000, 'output_tokens': 500}, 2.0, 8.0, True)
    return f"{record['estimated_token_cost']:g}"


def foundation_clarify():
    result = go({'kind': 'clarify', 'question': 'Which course do you mean?'})
    return pick((result.status, result.answer), {('needs_input', 'Which course do you mean?'): 'Status needs_input, with the question as the answer'})


def foundation_exhausted():
    result = go(search('joins'), max_steps=4)
    return pick((result.status, names(result)[-1]), {('failed', 'source_exhausted'): 'failed, with a source_exhausted event'})


def foundation_stop():
    return pick(go({'kind': 'stop', 'reason': 'no results'}).status, {'invalid': 'Status invalid: the only accepted reason is insufficient_evidence'})


def intermediate_duplicate():
    result = go(search('joins'), search=adapter([DOC, DOC]))
    return pick((result.status, 'tool_started' in names(result)), {('failed', True): 'Status failed: duplicate evidence ID'})


def intermediate_long_query():
    result = go(search('j' * 81))
    return pick((result.status, 'tool_started' in names(result)), {('invalid', False): 'Status invalid, and the tool never starts'})


def intermediate_duplicate_citations():
    return pick(go(search('joins'), finish('SQL-07', 'SQL-07')).status, {'invalid': 'Status invalid: duplicate citations'})


def advanced_search():
    found = tuple(local_framework_lab.search_records('What happens to a failed import?'))
    return pick(found, {('D1',): 'D1 only', ('D1', 'D3'): 'D1 and D3', ('D1', 'D2', 'D3'): 'D1, D2 and D3'})


def advanced_citations():
    evidence = {'D1': local_framework_lab.DOCS['D1']}
    return pick(local_framework_lab.citation_check('Roll back [D1]; replay [D2].', evidence), {False: 'False: D2 is not in the evidence'})


def advanced_offline_rows():
    rows = provider_eval.evaluate('test-model', repeats=2)
    unsent = all(set(r) == {'case_id', 'repeat', 'request'} for r in rows)
    return pick((len(rows), unsent), {(6, True): '6 request rows, with nothing sent'})


FACTS = {
    'vocabulary/2': vocabulary, 'context/2': context, 'instructions/2': instructions, 'tools/2': tools,
    'loop/2': loop, 'state/2': state, 'grounding/2': grounding, 'arguments/2': arguments,
    'outputs/2': outputs, 'retrieval/2': retrieval, 'failures/2': failures, 'budgets/2': budgets,
    'injection/2': injection, 'datasets/2': datasets, 'traces/2': traces, 'judges/2': judges,
    'live-integration/2': live_integration,
    'stage/foundation/1': foundation_clarify, 'stage/foundation/2': foundation_exhausted, 'stage/foundation/3': foundation_stop,
    'stage/intermediate/1': intermediate_duplicate, 'stage/intermediate/2': intermediate_long_query,
    'stage/intermediate/3': intermediate_duplicate_citations,
    'stage/advanced/1': advanced_search, 'stage/advanced/2': advanced_citations, 'stage/advanced/3': advanced_offline_rows,
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
        sys.exit('AI Agents checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} AI Agents checkpoint answers checked against the course labs; {len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
