"""Fact checks for the JavaScript, TypeScript and React checkpoint answers.

Each fact uses the course's lab in paths/react/practice. The TypeScript modules (tracker-core.ts,
foundation-data.ts, http-loader.ts, persistence-bridge.ts and performance-fixture.ts) run under Node with
type stripping, and their functions are called with the inputs each question names; javascript-steps.js,
tracker-core.test.ts and performance-runner.js run as shipped. The React components (App.tsx,
AdvancedApp.tsx and RemoteLesson.tsx) are read as data; the react CI job renders them in its component
tests. Each fact returns the text of the option the result supports, and the script fails if that
differs from the authored correct option. No network is used: the HTTP loader gets a stubbed fetch.
Needs Node.js 22.18+ on PATH. Run with Python 3.11+: python tests/react_checkpoint_facts.py
"""
from functools import cache
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
for stream in (sys.stdout, sys.stderr):
    stream.reconfigure(encoding='utf-8')  # the course name contains arrows
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'react'
PRACTICE = COURSE / 'practice'
NODE = shutil.which('node')

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {}

# Evaluates each [key, expression] pair with the lab modules in scope and prints one JSON object.
# persistence-bridge.ts imports "./tracker-core" without an extension, as Vite allows, so a resolve
# hook retries relative imports with ".ts".
HARNESS = r"""
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier, context, next) {
  try { return next(specifier, context); }
  catch (error) { if (specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(specifier + '.ts', context); throw error; }
}});
const here = new URL('file:///' + process.cwd().replaceAll('\\', '/') + '/');
const load = name => import(new URL(name, here));
const [core, data, http, bridge, perf] = await Promise.all(
  ['tracker-core.ts', 'foundation-data.ts', 'http-loader.ts', 'persistence-bridge.ts', 'performance-fixture.ts'].map(load));
const reply = (status, body) => async () => new Response(JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
const results = {};
for (const [key, expression] of JSON.parse(process.argv[1])) {
  try {
    const run = new Function('core', 'data', 'http', 'bridge', 'perf', 'reply', `return (async () => (${expression}))();`);
    results[key] = {value: await run(core, data, http, bridge, perf, reply)};
  } catch (error) { results[key] = {throws: error.message}; }
}
console.log(JSON.stringify(results));
"""

LESSON = "{id: 'a', title: 'Alpha', done: false}"
EXPRESSIONS = {
    'number_spaces': "Number(' 25 ')",
    'number_px': "String(Number('12px'))",
    'transition_pure': f"(() => {{ const rows = [{{id: 'a', minutes: 5, done: false}}]; const next = data.transition(rows, {{type: 'complete', id: 'a'}}); return [next === rows, rows[0].done, next[0].done]; }})()",
    'loader_404': "http.makeHttpLoader('/api', reply(404, {}))('types', new AbortController().signal)",
    'parse_extra': "data.parseSession({id: 'a', minutes: 5, done: false, source: 'x'})",
    'toggle_missing': f"(() => {{ const state = [{LESSON}]; const next = core.reducer(state, {{type: 'toggle', id: 'missing'}}); return [next === state, next[0] === state[0], next.length]; }})()",
    'add_short': f"(() => {{ const state = [{LESSON}]; return core.reducer(state, {{type: 'add', id: 'b', title: ' x '}}) === state; }})()",
    'loader_signal': "(async () => { const controller = new AbortController(); let seen; await http.makeHttpLoader('/api', async (url, init) => { seen = init.signal; return new Response(JSON.stringify({id: 'types', title: 'T'})); })('types', controller.signal); return seen === controller.signal; })()",
    'round_trip': f"(() => {{ const rows = [{LESSON}, {{id: 'b', title: 'Beta', done: true}}]; return JSON.stringify(core.decodeSaved(core.encodeSaved(rows))) === JSON.stringify(rows); }})()",
    'loader_url': "(async () => { let seen; await http.makeHttpLoader('/api/', async url => { seen = url; return new Response(JSON.stringify({id: 'a b', title: 'T'})); })('a b', new AbortController().signal); return seen; })()",
    'transition_unknown': "(() => { const action = {type: 'rename'}; return data.transition([], action) === action; })()",
    'add_duplicate': f"(() => {{ const state = [{LESSON}]; return core.reducer(state, {{type: 'add', id: 'a', title: 'Again'}}) === state; }})()",
    'loader_mismatch': "http.makeHttpLoader('/api', reply(200, {id: 'state', title: 'State detail'}))('types', new AbortController().signal)",
    'too_many': "core.decodeSaved(JSON.stringify({version: 1, lessons: Array.from({length: 1001}, (_, i) => ({id: String(i), title: 'Lesson ' + i, done: false}))}))",
    'save_local': f"(() => {{ const saved = {{}}; bridge.saveLocal({{setItem: (k, v) => saved[k] = v}}, [{LESSON}]); return saved; }})()",
    'parse_trim': "data.parseSession({id: ' a ', minutes: 0, done: false})",
    'parse_array': "data.parseSession([])",
    'full': "(() => { const state = Array.from({length: core.MAX_LESSONS}, (_, i) => ({id: String(i), title: 'Lesson ' + i, done: false})); return [state.length, core.reducer(state, {type: 'add', id: 'new', title: 'New lesson'}) === state]; })()",
    'duplicate_backup': "core.decodeSaved(JSON.stringify({version: 1, lessons: [{id: 'a', title: 'OK', done: false}, {id: 'a', title: 'OK', done: true}]}))",
    'v2_decode': "core.decodeSaved(JSON.stringify({version: 2, lessons: []}))",
    'v2_migrate': "bridge.migrateSaved(JSON.stringify({version: 2, lessons: [{id: 'a', title: 'OK', done: false}]})).length",
    'load_empty': "bridge.loadLocal({getItem: () => null})",
    'v3_migrate': "bridge.migrateSaved(JSON.stringify({version: 3, lessons: []}))",
    'filter_focus': "perf.filterRows(perf.makeRows(), '  FOCUS ').length",
}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def node(*args):
    if not NODE:
        raise RuntimeError('Node.js is required for the React course facts')
    run = subprocess.run([NODE, '--experimental-strip-types', '--no-warnings', *args], cwd=PRACTICE,
                         capture_output=True, text=True, timeout=60)
    if run.returncode:
        raise RuntimeError(run.stderr or run.stdout)
    return run.stdout


@cache
def evaluated():
    return json.loads(node('--input-type=module', '-e', HARNESS, json.dumps(list(EXPRESSIONS.items()))))


def value(key):
    result = evaluated()[key]
    if 'throws' in result:
        raise AssertionError(f'{key} threw {result["throws"]!r}')
    return result['value']


def thrown(key):
    result = evaluated()[key]
    if 'throws' not in result:
        raise AssertionError(f'{key} returned {result["value"]!r}')
    return result['throws']


def source(name):
    return (PRACTICE / name).read_text(encoding='utf-8')


def json_key(value):
    return json.dumps(value, sort_keys=True)


def web_basics():
    return pick('<p aria-live="polite">{count} of {lessons.length} complete</p>' in source('App.tsx'),
                {True: 'The count is in a paragraph with aria-live set to polite'})


def values():
    return str(value('number_spaces'))


def collections():
    steps = source('javascript-steps.js')
    out = node('javascript-steps.js').strip()
    return pick(('assert.equal(lessons[0].done, false); // State was not mutated.' in steps, out),
                {(True, 'PASS: conversion, arrays, immutable update and async failure'):
                 'false: the original record is unchanged'})


def functions():
    return pick(tuple(value('transition_pure')), {(False, False, True): 'Nothing: a new array is returned and rows is unchanged'})


def async_():
    return 'Throws Error: ' + thrown('loader_404')


def typescript():
    return pick(json_key(value('parse_extra')), {json_key({'ok': False, 'error': 'exact fields required'}):
                                                 'ok false, with the error exact fields required'})


def components():
    return pick(len(re.findall(r'<li key=\{row\.id\}>', source('App.tsx'))), {1: 'row.id, the stable record ID'})


def state():
    return pick(tuple(value('toggle_missing')), {(False, True, 1): 'A new array with the same records'})


def forms():
    return pick(value('add_short'), {True: 'The same state, because the trimmed title is shorter than 2 characters'})


def effects():
    return pick(value('loader_signal'), {True: "The caller's AbortSignal"})


def capstone():
    return pick(value('round_trip'), {True: 'The same lessons'})


def modules_closures():
    return value('loader_url')


def type_design():
    return pick(value('transition_unknown'), {True: 'The action object itself'})


def reducers():
    return pick(value('add_duplicate'), {True: 'The same state: IDs must be unique'})


def context_hooks():
    app = source('AdvancedApp.tsx')
    return pick(('const titleRef = useRef<HTMLInputElement>(null);' in app, 'titleRef.current?.focus()' in app,
                 '<input ref={titleRef}' in app),
                {(True, True, True): 'Back on the title input, through titleRef'})


def identity():
    return pick(source('AdvancedApp.tsx').count('dispatch({type:"add",id:crypto.randomUUID(),title});'),
                {1: 'One from crypto.randomUUID(), created when the lesson is added'})


def race_safe_loading():
    return 'It throws ' + thrown('loader_mismatch')


def routing():
    match = re.search(r'searchParams\.get\("lesson"\) \|\| "(\w+)"', source('RemoteLesson.tsx'))
    return match.group(1)


def testing():
    return node('tracker-core.test.ts').strip()


def resilience_security():
    return 'It throws ' + thrown('too_many')


def performance():
    out = node('performance-runner.js')
    numbers = re.search(r'records: (\d+), matches: (\d+), filterMilliseconds: [\d.]+', out)
    return pick(numbers.groups(), {('10000', '1000'): '10000 records and 1000 matches, with a time that varies by machine'})


def delivery():
    saved = value('save_local')
    stored = json.loads(saved['learning-tracker-v2'])
    return pick((tuple(saved), stored['version']), {(('learning-tracker-v2',), 2): 'A version 2 backup under learning-tracker-v2'})


def foundation_px():
    return value('number_px')


def foundation_trim():
    return pick(json_key(value('parse_trim')), {json_key({'ok': True, 'value': {'id': 'a', 'minutes': 0, 'done': False}}):
                                                'ok true, with the id trimmed to a'})


def foundation_array():
    return pick(json_key(value('parse_array')), {json_key({'ok': False, 'error': 'object required'}):
                                                 'ok false, with the error object required'})


def intermediate_full():
    return pick(tuple(value('full')), {(1000, True): 'The same state: 1000 is the maximum'})


def intermediate_duplicate():
    return 'It throws ' + thrown('duplicate_backup')


def intermediate_versions():
    return pick((thrown('v2_decode'), value('v2_migrate')), {('Unsupported saved format', 1):
                                                             'decodeSaved throws, and migrateSaved accepts it'})


def advanced_empty():
    return str(value('load_empty')).replace('None', 'null')


def advanced_future():
    return 'It throws ' + thrown('v3_migrate')


def advanced_filter():
    return str(value('filter_focus'))


FACTS = {
    'web-basics/2': web_basics, 'values/2': values, 'collections/2': collections, 'functions/2': functions,
    'async/2': async_, 'typescript/2': typescript, 'components/2': components, 'state/2': state,
    'forms/2': forms, 'effects/2': effects, 'capstone/2': capstone, 'modules-closures/2': modules_closures,
    'type-design/2': type_design, 'reducers/2': reducers, 'context-hooks/2': context_hooks,
    'identity/2': identity, 'race-safe-loading/2': race_safe_loading, 'routing/2': routing,
    'testing/2': testing, 'resilience-security/2': resilience_security, 'performance/2': performance,
    'delivery/2': delivery,
    'stage/foundation/1': foundation_px, 'stage/foundation/2': foundation_trim, 'stage/foundation/3': foundation_array,
    'stage/intermediate/1': intermediate_full, 'stage/intermediate/2': intermediate_duplicate,
    'stage/intermediate/3': intermediate_versions,
    'stage/advanced/1': advanced_empty, 'stage/advanced/2': advanced_future, 'stage/advanced/3': advanced_filter,
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
        sys.exit('JavaScript → TypeScript → React checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} JavaScript → TypeScript → React checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
