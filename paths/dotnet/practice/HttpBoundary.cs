using System.Net;
using System.Text.Json;

// The handler is replaced in-process. No socket, database or identity provider runs.
static void Check(bool condition, string name)
{
    if (!condition) throw new Exception("Failed: " + name);
}
static async Task Reject<T>(Func<Task> action) where T : Exception
{
    try { await action(); }
    catch (T) { return; }
    throw new Exception("Expected " + typeof(T).Name);
}
static HttpResponseMessage Reply(HttpStatusCode status, string body) =>
    new(status) { Content = new StringContent(body) };

int calls = 0;
using (var handler = new ScriptedHandler((request, token) =>
{
    calls++;
    Check(request.Method == HttpMethod.Get, "GET method");
    Check(request.RequestUri!.AbsolutePath == "/sessions/7", "ID in route");
    return Task.FromResult(Reply(HttpStatusCode.OK, "{\"id\":7,\"minutes\":0}"));
}))
using (var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.invalid/") })
{
    var result = await new SessionClient(http).Get(7, CancellationToken.None);
    Check(result == new Session(7, 0), "zero minutes accepted");
    await Reject<ArgumentOutOfRangeException>(async () => await new SessionClient(http).Get(0, CancellationToken.None));
    Check(calls == 1, "bad ID rejected before dispatch");
}

foreach (var body in new[] { "{\"id\":7}", "{\"id\":8,\"minutes\":5}",
    "{\"id\":7,\"minutes\":-1}", "{\"id\":7,\"minutes\":\"5\"}" })
{
    using var handler = new ScriptedHandler((r, t) => Task.FromResult(Reply(HttpStatusCode.OK, body)));
    using var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.invalid/") };
    await Reject<FormatException>(async () => await new SessionClient(http).Get(7, CancellationToken.None));
}
using (var handler = new ScriptedHandler((r, t) => Task.FromResult(Reply(HttpStatusCode.NotFound, ""))))
using (var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.invalid/") })
    Check(await new SessionClient(http).Get(7, CancellationToken.None) is null, "404 is missing");

int attempts = 0;
using (var handler = new ScriptedHandler((r, t) =>
{
    attempts++;
    return Task.FromResult(Reply(HttpStatusCode.ServiceUnavailable, ""));
}))
using (var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.invalid/") })
{
    await Reject<HttpRequestException>(async () => await new SessionClient(http).Get(7, CancellationToken.None));
    Check(attempts == 1, "failure not silently retried");
}

var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
using (var cancellation = new CancellationTokenSource())
using (var handler = new ScriptedHandler(async (r, token) =>
{
    started.SetResult();
    await Task.Delay(Timeout.Infinite, token);
    return Reply(HttpStatusCode.OK, "{}");
}))
using (var http = new HttpClient(handler) { BaseAddress = new Uri("https://example.invalid/") })
{
    var pending = new SessionClient(http).Get(7, cancellation.Token);
    await started.Task.WaitAsync(TimeSpan.FromSeconds(5));
    cancellation.Cancel();
    await Reject<OperationCanceledException>(async () => await pending.WaitAsync(TimeSpan.FromSeconds(5)));
}
Console.WriteLine("PASS: HTTP adapter success, missing, malformed, failure and cancellation contracts.");

sealed record Session(int Id, int Minutes);
sealed class SessionClient(HttpClient http)
{
    public async Task<Session?> Get(int id, CancellationToken cancellation)
    {
        if (id <= 0) throw new ArgumentOutOfRangeException(nameof(id));
        using var response = await http.GetAsync($"sessions/{id}", cancellation);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellation));
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object ||
            !root.TryGetProperty("id", out var identity) || identity.ValueKind != JsonValueKind.Number ||
            !identity.TryGetInt32(out var actualId) || actualId != id ||
            !root.TryGetProperty("minutes", out var minutes) || minutes.ValueKind != JsonValueKind.Number ||
            !minutes.TryGetInt32(out var value) || value < 0 || value > 1440)
            throw new FormatException("Unexpected session response");
        return new Session(actualId, value);
    }
}
sealed class ScriptedHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send)
    : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token)
        => send(request, token);
}
