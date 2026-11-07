"""Fact checks for the Full-Stack Project Journey checkpoint answers.

Each fact uses the course's lab in paths/full-stack-journey/practice. planner-api.ts runs under Node
with type stripping and a stubbed fetch, so decodeTask and request execute as shipped. acceptance.py is
imported and its address guard is called; no request is sent. The .NET API, SQL schema, React component
and build files are read as data, because building and running the API needs the .NET 10 SDK and NuGet
(scripts/verify-fullstack.py does that in its own CI job). Each fact returns the text of the option the
result supports, and the script fails if that differs from the authored correct option.
Needs Node.js 22.18+ on PATH. Run with Python 3.14+: python tests/full_stack_journey_checkpoint_facts.py
"""
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'full-stack-journey'
PRACTICE = COURSE / 'practice'
NODE = shutil.which('node')

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'transactions/2': 'Two independent successful calls do not create an atomic operation, lesson 13',
    'delivery/2': 'Vite normally replaces import.meta.env values during the frontend build, lesson 19',
}


def text(name):
    return (PRACTICE / name).read_text(encoding='utf-8')


PROGRAM, SCHEMA, APP, MILESTONES = text('Program.cs'), text('schema.sql'), text('App.tsx'), text('milestones.md')

# Imports planner-api.ts and runs one call. argv: [call, fetch-response-or-null, task-json].
HARNESS = r"""
const [call, reply, task] = process.argv.slice(1).map(x => JSON.parse(x));
const api = await import(new URL('./planner-api.ts', 'file:///' + process.cwd().replaceAll('\\', '/') + '/'));
let seen = null;
globalThis.fetch = async (url, init) => { seen = {url, type: init.headers['Content-Type']};
  return new Response(reply?.body ?? '{}', {status: reply?.status ?? 200, headers: {'Content-Type': reply?.type ?? 'application/json'}}); };
try {
  const value = call === 'decode' ? api.decodeTask(task) : await api.request(task.path, task.init);
  console.log(JSON.stringify({value, seen}));
} catch (error) { console.log(JSON.stringify({error: error.message, seen})); }
"""

VALID = {'id': 'aabbccdd-1234-1234-1234-123456789abc', 'title': 'SQL', 'minutes': 25, 'done': False, 'version': 1}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def node(call, task, reply=None):
    if not NODE:
        raise RuntimeError('Node.js is required for the Full-Stack Project Journey facts')
    run = subprocess.run([NODE, '--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', HARNESS,
                          json.dumps(call), json.dumps(reply), json.dumps(task)],
                         cwd=PRACTICE, capture_output=True, text=True, timeout=30)
    if run.returncode:
        raise RuntimeError(run.stderr or run.stdout)
    return json.loads(run.stdout)


def decode(**changes):
    return node('decode', {**VALID, **changes})


def thrown(result):
    return result.get('error')


def acceptance():
    spec = importlib.util.spec_from_file_location('journey_acceptance', PRACTICE / 'acceptance.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def guard(base):
    try:
        acceptance().check(base)
    except ValueError as error:
        return f'Raises ValueError: {error}'
    raise AssertionError(f'{base} was not refused')


def scope():
    line = next(x for x in MILESTONES.splitlines() if x.startswith('Create and list sessions'))
    return pick(line, {'Create and list sessions; validate 0, 1440, -1, 1441, blank title and boolean minutes.':
                       'Minutes of 0, 1440, -1 and 1441, a blank title and boolean minutes'})


def workspace():
    match = re.search(r"<TargetFramework Condition=\"'\$\(TargetFramework\)' == ''\">(.+?)<", text('Planner.csproj'))
    return match.group(1)


def architecture():
    vite = text('vite.config.ts')
    return pick(("host:'127.0.0.1',port:5173" in vite, "proxy:{'/api':'http://127.0.0.1:5087'}" in vite,
                 "fetch('/api/tasks' + path" in text('planner-api.ts')),
                {(True, True, True): 'To Vite on 127.0.0.1:5173, which proxies it to the API on 127.0.0.1:5087'})


def contract():
    rejects = 'UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow' in PROGRAM
    checked = "{'title':'x','minutes':1,'owner':'admin'}" in text('acceptance.py')
    return pick((rejects, checked), {(True, True): '400, because unmapped JSON members are rejected'})


def data_model():
    return pick('Minutes int NOT NULL CHECK(Minutes BETWEEN 0 AND 1440)' in SCHEMA,
                {True: 'The CHECK constraint on Minutes in schema.sql'})


def ui_state():
    controls = re.findall(r'<(?:input|button)\b[^>]*>', APP)
    return pick(('[busy,setBusy]=useState(true)' in APP, len(controls), all('disabled={busy}' in c for c in controls)),
                {(True, 5, True): 'Disabled, because busy starts as true'})


def first_slice():
    return pick(('IsNullOrWhiteSpace(connection) ? new MemoryPlanner()' in PROGRAM,
                 'storage = store is SqlPlanner ? "sql-server" : "memory"' in PROGRAM), {(True, True): 'memory'})


def response_validation():
    value = decode(owner='admin')['value']
    return pick(tuple(value), {('id', 'title', 'minutes', 'done', 'version'): 'A new object with only the five known fields'})


def effects():
    return pick(('return ()=>controller.abort()' in APP, 'if(!controller.signal.aborted)setStatus' in APP,
                 'if(!controller.signal.aborted)setBusy(false)' in APP),
                {(True, True, True): 'Aborts the request, and a late error is not shown'})


def sql_setup():
    return pick(("IF OBJECT_ID(N'dbo.StudyTasks',N'U') IS NULL" in SCHEMA, 'DROP' in SCHEMA.upper(),
                 'CREATE DATABASE' in SCHEMA.upper()),
                {(True, False, False): 'Nothing changes: the table is created only if it does not exist'})


def parameters():
    commands = re.findall(r'new SqlCommand\((\$?)"', PROGRAM)
    bound = 'cmd.Parameters.Add("@title", SqlDbType.NVarChar, 120).Value = task.Title' in PROGRAM
    return pick((len(commands), '$' in commands, bound),
                {(5, False, True): 'As an NVarChar(120) parameter, never as part of the command text'})


def conflicts():
    return pick(('WHERE Id=@id AND Version=@version' in PROGRAM, 'SELECT COUNT(*) FROM dbo.StudyTasks WHERE Id=@id' in PROGRAM,
                 '== 0 ? 404 : 409' in PROGRAM),
                {(True, True, True): 'It counts rows with that ID: none means 404, otherwise 409'})


def retries():
    return pick(('The baseline does not implement idempotent create.' in MILESTONES, 'idempotency' in PROGRAM.lower()),
                {(True, False): 'No: the workbook asks you to add idempotent create as an extension'})


def identity():
    loopback = '!System.Net.IPAddress.IsLoopback(ctx.Connection.RemoteIpAddress)' in PROGRAM
    return pick((loopback, 'ctx.Response.StatusCode = 403' in PROGRAM, 'Authentication' in PROGRAM),
                {(True, True, False): 'Any caller on a loopback address; others get 403'})


def browser_boundaries():
    policy = re.search(r'AddDefaultPolicy\(p => p\.WithOrigins\("(.+?)"\)\.WithMethods\((.+?)\)', PROGRAM)
    return pick((policy.group(1), policy.group(2)),
                {('http://127.0.0.1:5173', '"GET", "POST", "PUT"'): 'The origin http://127.0.0.1:5173, with GET, POST and PUT'})


def tests():
    script = json.loads(text('package.json'))['scripts']['test']
    return pick(script, {'node --experimental-strip-types planner-api.test.ts && vitest run planner-ui.test.tsx --environment jsdom':
                         'The decoder test under Node, then the UI tests with Vitest in jsdom'})


def observability():
    template = re.search(r'LogInformation\("(.+?)"', PROGRAM).group(1)
    return pick((template, 'Request.Body' in PROGRAM), {('Request {Method} {Path} {Status} {ElapsedMs}ms trace={Trace}', False):
                                                'Method, path, status, elapsed milliseconds and trace identifier'})


def recovery():
    return pick('Practice backup/restore into a NEW database and verify task counts/versions after recovery.' in MILESTONES,
                {True: 'Into a new database, then verify task counts and versions'})


def foundation_upper():
    return pick(decode(minutes=1440).get('value', {}).get('minutes'), {1440: 'It is accepted: 1440 is the upper bound'})


def foundation_server_error():
    return thrown(node('request', {'path': '', 'init': {}}, {'status': 500}))


def foundation_guard():
    return guard('http://example.com/')


def intermediate_long_title():
    return 'Throws: ' + thrown(decode(title='x' * 121))


def intermediate_null():
    return thrown(node('decode', None))


def intermediate_url():
    seen = node('request', {'path': '/abc', 'init': {'method': 'PUT'}})['seen']
    return f"{seen['url']} with Content-Type {seen['type']}"


def advanced_path():
    return guard('http://127.0.0.1:5087/api')


def advanced_html():
    return thrown(node('request', {'path': '', 'init': {}}, {'status': 200, 'type': 'text/html', 'body': '<html>'}))


def advanced_spaces():
    return f"'{decode(title=' SQL ')['value']['title']}', unchanged"


FACTS = {
    'scope/2': scope, 'workspace/2': workspace, 'architecture/2': architecture, 'contract/2': contract,
    'data-model/2': data_model, 'ui-state/2': ui_state, 'first-slice/2': first_slice,
    'response-validation/2': response_validation, 'effects/2': effects, 'sql-setup/2': sql_setup,
    'parameters/2': parameters, 'conflicts/2': conflicts, 'retries/2': retries, 'identity/2': identity,
    'browser-boundaries/2': browser_boundaries, 'tests/2': tests, 'observability/2': observability,
    'recovery/2': recovery,
    'stage/foundation/1': foundation_upper, 'stage/foundation/2': foundation_server_error,
    'stage/foundation/3': foundation_guard,
    'stage/intermediate/1': intermediate_long_title, 'stage/intermediate/2': intermediate_null,
    'stage/intermediate/3': intermediate_url,
    'stage/advanced/1': advanced_path, 'stage/advanced/2': advanced_html, 'stage/advanced/3': advanced_spaces,
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
        sys.exit('Full-Stack Project Journey checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Full-Stack Project Journey checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
