"""Fact checks for the C# & .NET checkpoint answers.

The course's labs in paths/dotnet/practice are built with the .NET SDK in a temporary directory:
foundation.cs and BoundaryChecks are run and their output read, and task-api.cs is started on a
loopback port for each HTTP fact, so every one sees a fresh in-memory store. A probe project compiles the
labs' own type declarations unchanged (LearningTask from foundation.cs, Session, SessionClient and
ScriptedHandler from HttpBoundary.cs, TaskStore and its records from task-api.cs) with a small program
that runs edge cases against them. The EF Core and SQLite lab (persistence-checks.cs) is restored from
NuGet and run as shipped; the persistence answers name the assertion in it that states the expected
behaviour, and that run must pass. Each fact returns the text of the option the result supports, and
the script fails if that differs from the authored correct option.
Run with Python 3.14+ and the .NET 10 SDK: python tests/dotnet_checkpoint_facts.py
For a local compatibility run with another SDK, pass --framework, for example --framework net9.0; the
persistence lab pins net10.0 and its packages, so its answers fail on any other framework.
"""
import argparse
from functools import cache
import json
from pathlib import Path
import re
import shutil
import socket
import subprocess
import sys
from tempfile import TemporaryDirectory
import time
import urllib.error
import urllib.request

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'dotnet'
PRACTICE = COURSE / 'practice'
FRAMEWORK = 'net10.0'
WORK = None

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {}

PROJECT = """<Project Sdk="{sdk}">
  <PropertyGroup><OutputType>Exe</OutputType><TargetFramework>{framework}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable>
    <EnableDefaultCompileItems>false</EnableDefaultCompileItems></PropertyGroup>
  <ItemGroup>{items}</ItemGroup>
</Project>
"""

# Runs edge cases against the labs' own classes and prints one JSON object.
PROBE = r"""
using System.Diagnostics.Metrics;
using System.Net;
using System.Text.Json;

var results = new Dictionary<string, object?>();
string Describe(Exception e) => "throws " + (e is JsonException ? "JsonException" : e.GetType().Name)
    + (e.InnerException is { } inner ? " inner " + inner.GetType().Name : "")
    + (e is HttpRequestException { StatusCode: { } code } ? " status " + (int)code : "");
object? Try(Func<object?> action) { try { return action(); } catch (Exception e) { return Describe(e); } }
Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> Body(string body, HttpStatusCode status = HttpStatusCode.OK) =>
    (request, token) => Task.FromResult(new HttpResponseMessage(status) { Content = new StringContent(body) });
async Task<Dictionary<string, object?>> Call(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> reply,
    string address = "https://example.invalid/", int id = 7, CancellationToken token = default, TimeSpan? timeout = null)
{
    int calls = 0; string? path = null;
    using var handler = new ScriptedHandler((request, t) => { calls++; path = request.RequestUri!.AbsolutePath; return reply(request, t); });
    using var http = new HttpClient(handler) { BaseAddress = new Uri(address) };
    if (timeout is { } limit) http.Timeout = limit;
    object? result;
    try { var session = await new SessionClient(http).Get(id, token); result = session is null ? "null" : $"{session.Id}:{session.Minutes}"; }
    catch (Exception e) { result = Describe(e); }
    return new() { ["result"] = result, ["calls"] = calls, ["path"] = path };
}

results["task_zero_id"] = Try(() => new LearningTask(0, "Read"));
results["task_null_title"] = Try(() => new LearningTask(1, null!));
results["record_equal"] = new Session(7, 0) == new Session(7, 0);
results["minutes_1440"] = await Call(Body("{\"id\":7,\"minutes\":1440}"));
results["minutes_1441"] = await Call(Body("{\"id\":7,\"minutes\":1441}"));
results["extra_property"] = await Call(Body("{\"id\":7,\"minutes\":5,\"extra\":true}"));
results["not_json"] = await Call(Body("not json"));
results["server_error"] = await Call(Body("", HttpStatusCode.InternalServerError));
results["base_without_slash"] = await Call(Body("{\"id\":7,\"minutes\":5}"), "https://example.invalid/api");
using (var cancelled = new CancellationTokenSource(TimeSpan.FromMilliseconds(100)))
    results["cancel_while_waiting"] = await Call(async (request, token) => { await Task.Delay(Timeout.Infinite, token); return new HttpResponseMessage(); },
        token: cancelled.Token);
results["timeout"] = await Call(async (request, token) => { await Task.Delay(Timeout.Infinite, token); return new HttpResponseMessage(); },
    timeout: TimeSpan.FromMilliseconds(100));

var tags = new List<string>(); bool meterCompleted = false;
using var listener = new MeterListener();
listener.InstrumentPublished = (instrument, l) => { if (instrument.Meter.Name == "Learning.Tasks") l.EnableMeasurementEvents(instrument); };
listener.SetMeasurementEventCallback<long>((instrument, value, measured, state) => { foreach (var tag in measured) tags.Add($"{tag.Key}={tag.Value}"); });
listener.MeasurementsCompleted = (instrument, state) => meterCompleted = true;
listener.Start();
var provider = new ServiceCollection().AddLogging().AddSingleton<TaskStore>().BuildServiceProvider();
var store = provider.GetRequiredService<TaskStore>();
foreach (var title in new[] { "a", "b", "c", "d", "e" }) store.Add(title);
results["page_after_2_limit_2"] = store.Page(2, 2).Select(item => item.Id).ToArray();
var page = store.Page(0, 3);
page[0] = page[0] with { Title = "changed" };
results["page_copy_title"] = store.Find(1)!.Title;
store.Complete(1, 1); store.Complete(1, 1); store.Complete(99, 1);
results["metric_tags"] = tags.ToArray();
var shared = new TaskStore(provider.GetRequiredService<ILogger<TaskStore>>());
var ids = await Task.WhenAll(Enumerable.Range(0, 50).Select(n => Task.Run(() => shared.Add("t" + n).Id)));
results["concurrent_ids"] = new[] { ids.Distinct().Count(), ids.Min(), ids.Max() };
results["meter_before_dispose"] = meterCompleted;
provider.Dispose();
results["meter_after_dispose"] = meterCompleted;
Console.WriteLine(JsonSerializer.Serialize(results));
"""


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def dotnet(*args, cwd=None, timeout=300):
    run = subprocess.run(['dotnet', *args], cwd=cwd, capture_output=True, text=True, timeout=timeout)
    if run.returncode:
        raise RuntimeError(run.stdout[-3000:] + run.stderr[-3000:])
    return run.stdout


def declarations(name, marker):
    source = (PRACTICE / name).read_text(encoding='utf-8')
    if source.count(marker) != 1:
        raise RuntimeError(f'{name} no longer contains {marker!r} exactly once')
    return source[source.index(marker):]


def build(name, sdk, files):
    folder = WORK / name
    folder.mkdir()
    for target, text in files.items():
        (folder / target).write_text(text, encoding='utf-8')
    items = ''.join(f'<Compile Include="{target}" />' for target in files)
    (folder / f'{name}.csproj').write_text(PROJECT.format(sdk=sdk, framework=FRAMEWORK, items=items), encoding='utf-8')
    dotnet('build', f'{name}.csproj', '-c', 'Release', '--nologo', cwd=folder)
    return folder / 'bin' / 'Release' / FRAMEWORK / f'{name}.dll'


@cache
def built():
    practice = lambda name: (PRACTICE / name).read_text(encoding='utf-8')  # noqa: E731
    return {
        'foundation': build('Foundation', 'Microsoft.NET.Sdk', {'Program.cs': practice('foundation.cs')}),
        'boundary': build('BoundaryChecks', 'Microsoft.NET.Sdk', {'HttpBoundary.cs': practice('HttpBoundary.cs')}),
        'api': build('Api', 'Microsoft.NET.Sdk.Web', {'Program.cs': practice('task-api.cs')}),
        'probe': build('Probe', 'Microsoft.NET.Sdk.Web', {
            'Probe.cs': PROBE,
            'LearningTask.cs': declarations('foundation.cs', 'sealed class LearningTask'),
            'Session.cs': 'using System.Net;\nusing System.Text.Json;\n' + declarations('HttpBoundary.cs', 'sealed record Session('),
            'TaskStore.cs': 'using System.Diagnostics.Metrics;\n' + declarations('task-api.cs', 'record CreateTask('),
        }),
    }


@cache
def persistence():
    """Run the SQLite and test-host lab as shipped; it pins net10.0 and its NuGet packages."""
    if FRAMEWORK != 'net10.0':
        raise RuntimeError('the persistence lab targets net10.0 only')
    folder = WORK / 'Persistence'
    folder.mkdir()
    for name in ('PersistenceChecks.csproj', 'persistence-api.cs', 'persistence-checks.cs'):
        shutil.copyfile(PRACTICE / name, folder / name)
    out = dotnet('run', '--project', str(folder / 'PersistenceChecks.csproj'), '-c', 'Release', timeout=600).strip()
    if not re.fullmatch(r'PASS: \d+ SQLite and test-host authorization assertions\.', out.splitlines()[-1]):
        raise RuntimeError('persistence lab did not pass: ' + out[-500:])
    return out


def passes(text, name):
    """The persistence lab ran and passed, and its source still contains the given assertion."""
    persistence()
    return text in (PRACTICE / name).read_text(encoding='utf-8')


@cache
def output(name):
    return dotnet(str(built()[name]), timeout=60)


@cache
def probe():
    return json.loads(output('probe'))


class Api:
    """A fresh task-api host on a free loopback port, stopped on exit."""

    def __enter__(self):
        with socket.socket() as s:
            s.bind(('127.0.0.1', 0))
            self.base = f'http://127.0.0.1:{s.getsockname()[1]}'
        self.host = subprocess.Popen(['dotnet', str(built()['api']), '--urls', self.base],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        deadline = time.monotonic() + 30
        while True:
            if self.host.poll() is not None:
                raise RuntimeError('task API exited before it was ready')
            try:
                with urllib.request.urlopen(self.base + '/health', timeout=1):
                    return self
            except (OSError, TimeoutError):
                if time.monotonic() > deadline:
                    raise TimeoutError('task API did not start')
                time.sleep(0.1)

    def __exit__(self, *exc):
        self.host.terminate()
        try:
            self.host.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.host.kill()
            self.host.wait()

    def call(self, method, path, body=None, data=None):
        if body is not None:
            data = json.dumps(body).encode()
        request = urllib.request.Request(self.base + path, data=data, method=method,
                                         headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                status, headers, text = response.status, response.headers, response.read().decode()
        except urllib.error.HTTPError as error:
            status, headers, text = error.code, error.headers, error.read().decode()
        try:
            value = json.loads(text) if text else None
        except ValueError:
            value = text
        return status, headers, value


def api(*calls):
    with Api() as host:
        return [host.call(*c) for c in calls]


def errors_for(response):
    status, _, body = response
    return status, tuple(sorted((body or {}).get('errors', {})))


def first_program():
    lines = tuple(output('foundation').splitlines())
    return pick(lines, {('2: Practice', '3: Review', 'PASS: 4 foundation assertions.'):
                        '2: Practice and 3: Review, then PASS: 4 foundation assertions.'})


def types_null():
    return pick(probe()['task_null_title'], {'throws ArgumentException': 'It throws ArgumentException, as a blank title does'})


def control_collections():
    status, _, body = api(('GET', '/tasks/99'))[0]
    return pick((status, body['title']), {(404, 'Task not found'): '404 with the problem title Task not found'})


def methods():
    return pick(probe()['task_zero_id'], {'throws ArgumentOutOfRangeException': 'It throws ArgumentOutOfRangeException'})


def objects():
    return pick(probe()['record_equal'], {True: 'True: records compare by value'})


def exceptions():
    result = probe()['server_error']['result']
    return pick(result, {'throws HttpRequestException status 500': 'HttpRequestException with status code 500'})


def linq():
    return pick(tuple(probe()['page_after_2_limit_2']), {(3, 4): '3 and 4'})


def async_():
    result = probe()['cancel_while_waiting']
    thrown = result['result'].split(' inner ')
    return pick((thrown[0], 'TimeoutException' in result['result'], result['calls']),
                {('throws TaskCanceledException', False, 1): 'TaskCanceledException, with no TimeoutException inside'})


def contracts_generics():
    return pick(probe()['page_copy_title'], {'a': 'The original task, unchanged'})


def resource_ownership():
    p = probe()
    return pick((p['meter_before_dispose'], p['meter_after_dispose']),
                {(False, True): 'It is disposed: a MeterListener sees its measurements complete'})


def delegates_patterns():
    status, _, stale = api(('POST', '/tasks', {'title': 'x'}), ('PATCH', '/tasks/1/complete', {'expectedVersion': 1}),
                           ('PATCH', '/tasks/1/complete', {'expectedVersion': 1}))[2]
    return pick((status, stale['title']), {(409, 'Task changed; reload before retrying'):
                                           '409 with the title Task changed; reload before retrying'})


def testing():
    return output('boundary').strip()


def api_di():
    responses = api(('POST', '/tasks', {'title': 'a'}), ('POST', '/tasks', {'title': 'b'}))
    return pick(tuple((s, b['id']) for s, _, b in responses),
                {((201, 1), (201, 2)): '1, then 2, because one TaskStore serves every request'})


def api_contracts():
    return pick(errors_for(api(('POST', '/tasks', {'title': 'x' * 121}))[0]),
                {(400, ('title',)): '400 with a validation error for title'})


def integration_checks():
    return pick(api(('GET', '/tasks/abc'))[0][0], {404: '404, because the route requires an integer ID'})


def database():
    source = (PRACTICE / 'persistence-api.cs').read_text(encoding='utf-8')
    lookups = source.count('t.Id==id&&t.Owner==user.FindFirstValue(ClaimTypes.NameIdentifier)')
    hidden = passes('Check((await bob.GetAsync($"/tasks/{id}")).StatusCode==HttpStatusCode.NotFound,"Other owner must not read");',
                    'persistence-checks.cs')
    return pick((lookups, hidden), {(2, True): "By ID and the caller's NameIdentifier claim together"})


def ef_evolution():
    api_source = (PRACTICE / 'persistence-api.cs').read_text(encoding='utf-8')
    rolled_back = passes('catch(DbUpdateException){Check(true,"Second audit write failed on unique key");await tx.RollbackAsync();}',
                         'persistence-checks.cs')
    fresh = passes('Check(!await db.Tasks.AnyAsync(t=>t.Title=="Rolled back"),"Failed audit rolls back task in fresh context");',
                   'persistence-checks.cs')
    return pick(('HasIndex(a=>a.EventKey).IsUnique()' in api_source, rolled_back, fresh),
                {(True, True, True): 'DbUpdateException, after which the task insert is rolled back'})


def capstone():
    status = api(('POST', '/tasks', None, json.dumps({'title': 'x' * 17000}).encode()))[0][0]
    return pick(status, {413: '413 Payload Too Large'})


def cancellation_budgets():
    return pick(probe()['timeout']['result'], {'throws TaskCanceledException inner TimeoutException':
                                               'TaskCanceledException, with a TimeoutException inside'})


def concurrency():
    return pick(tuple(probe()['concurrent_ids']), {(50, 1, 50): '50, numbered 1 to 50'})


def auth_boundaries():
    expected = ('using var denied=Client(app,"alice",false);Check((await denied.GetAsync("/tasks/1")).StatusCode'
                '==HttpStatusCode.Forbidden,"Missing permission must be 403");')
    return pick(passes(expected, 'persistence-checks.cs'), {True: '403 Forbidden'})


def observability():
    return pick(tuple(probe()['metric_tags']), {('outcome=success', 'outcome=conflict', 'outcome=missing'):
                                                'outcome as success, conflict and missing'})


def deploy_operations():
    status, _, body = api(('GET', '/health'))[0]
    return pick((status, json.dumps(body, sort_keys=True)),
                {(200, '{"status": "ok", "storage": "memory"}'): '200 with status ok and storage memory'})


def performance():
    statuses = tuple(r[0] for r in api(('GET', '/tasks?limit=100'), ('GET', '/tasks?limit=101')))
    return pick(statuses, {(200, 400): '100: limit=101 returns 400'})


def foundation_range():
    p = probe()
    return pick((p['minutes_1440']['result'], p['minutes_1441']['result']),
                {('7:1440', 'throws FormatException'): '1440 is accepted, and 1441 throws FormatException'})


def foundation_extra():
    return pick(probe()['extra_property']['result'], {'7:5': 'It returns the session; extra properties are allowed'})


def foundation_not_json():
    return probe()['not_json']['result'].removeprefix('throws ')


def intermediate_base():
    return probe()['base_without_slash']['path']


def intermediate_empty():
    return pick(errors_for(api(('POST', '/tasks', {}))[0]), {(400, ('title',)): '400 with a validation error for title'})


def intermediate_repeat():
    responses = api(('POST', '/tasks', {'title': 'x'}), ('PATCH', '/tasks/1/complete', {'expectedVersion': 1}),
                    ('PATCH', '/tasks/1/complete', {'expectedVersion': 2}))
    status, _, body = responses[2]
    return pick((status, body['version'], body['done']), {(200, 2, True): '200, with the task still at version 2'})


def advanced_version():
    responses = api(('POST', '/tasks', {'title': 'x'}), ('PATCH', '/tasks/1/complete', {'expectedVersion': 0}))
    return pick(errors_for(responses[1]), {(400, ('expectedVersion',)): '400 with a validation error for expectedVersion'})


def advanced_problem_type():
    _, headers, _ = api(('GET', '/tasks/99'))[0]
    return headers['Content-Type'].split(';')[0]


def advanced_cursor():
    return pick(errors_for(api(('GET', '/tasks?after=-1'))[0]), {(400, ('after',)): '400 with a validation error for after'})


FACTS = {
    'first-program/2': first_program, 'types-null/2': types_null, 'control-collections/2': control_collections,
    'methods/2': methods, 'objects/2': objects, 'exceptions/2': exceptions, 'linq/2': linq, 'async/2': async_,
    'contracts-generics/2': contracts_generics, 'resource-ownership/2': resource_ownership,
    'delegates-patterns/2': delegates_patterns, 'testing/2': testing, 'api-di/2': api_di,
    'api-contracts/2': api_contracts, 'integration-checks/2': integration_checks, 'database/2': database,
    'ef-evolution/2': ef_evolution, 'capstone/2': capstone, 'cancellation-budgets/2': cancellation_budgets,
    'concurrency/2': concurrency, 'auth-boundaries/2': auth_boundaries, 'observability/2': observability,
    'deploy-operations/2': deploy_operations, 'performance/2': performance,
    'stage/foundation/1': foundation_range, 'stage/foundation/2': foundation_extra,
    'stage/foundation/3': foundation_not_json,
    'stage/intermediate/1': intermediate_base, 'stage/intermediate/2': intermediate_empty,
    'stage/intermediate/3': intermediate_repeat,
    'stage/advanced/1': advanced_version, 'stage/advanced/2': advanced_problem_type,
    'stage/advanced/3': advanced_cursor,
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
    global FRAMEWORK, WORK
    parser = argparse.ArgumentParser()
    parser.add_argument('--framework', default=FRAMEWORK, help='target framework, net10.0 for release checks')
    FRAMEWORK = parser.parse_args().framework
    if not shutil.which('dotnet'):
        sys.exit('The .NET SDK is required for the C# & .NET facts')
    seen, failures = set(), []
    with TemporaryDirectory(prefix='notebook-dotnet-facts-', ignore_cleanup_errors=True) as folder:
        WORK = Path(folder)
        built()
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
        sys.exit('C# & .NET checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} C# & .NET checkpoint answers checked against the course labs on {FRAMEWORK}; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
