using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

string address = args.Length > 0 ? args[0] : "http://127.0.0.1:5086";
using var client = new HttpClient { BaseAddress = new Uri(address), Timeout = TimeSpan.FromSeconds(10) };
int assertions = 0;
void Check(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException("FAIL: " + message);
    assertions++;
}
using (var health = await client.GetAsync("/health"))
    Check(health.StatusCode == HttpStatusCode.OK, "Health succeeds");

using (var invalid = await client.PostAsJsonAsync("/tasks", new { title = "  " }))
{
    Check(invalid.StatusCode == HttpStatusCode.BadRequest, "Blank title is rejected");
    using var body = JsonDocument.Parse(await invalid.Content.ReadAsStringAsync());
    Check(body.RootElement.GetProperty("errors").TryGetProperty("title", out _), "Validation error names title");
}

string title = "acceptance-" + Guid.NewGuid().ToString("N");
TaskView item;
Uri location;
using (var created = await client.PostAsJsonAsync("/tasks", new { title = "  " + title + "  " }))
{
    Check(created.StatusCode == HttpStatusCode.Created, "Creation returns 201");
    item = await created.Content.ReadFromJsonAsync<TaskView>() ?? throw new Exception("Missing created body");
    Check(item.Title == title && !item.Done && item.Version == 1, "Creation normalizes title and sets initial state");
    location = created.Headers.Location ?? throw new Exception("Missing Location");
}
using (var fetched = await client.GetAsync(location))
{
    var body = await fetched.Content.ReadFromJsonAsync<TaskView>();
    Check(fetched.StatusCode == HttpStatusCode.OK && body?.Id == item.Id, "Location retrieves the created task");
}
using (var completed = await client.PatchAsJsonAsync($"/tasks/{item.Id}/complete", new { expectedVersion = 1 }))
{
    var body = await completed.Content.ReadFromJsonAsync<TaskView>();
    Check(completed.StatusCode == HttpStatusCode.OK && body is { Done: true, Version: 2 }, "Completion updates state and version");
}
using (var stale = await client.PatchAsJsonAsync($"/tasks/{item.Id}/complete", new { expectedVersion = 1 }))
    Check(stale.StatusCode == HttpStatusCode.Conflict, "Stale completion conflicts");
using (var missing = await client.GetAsync("/tasks/2147483647"))
    Check(missing.StatusCode == HttpStatusCode.NotFound, "Unknown task is missing");
using (var invalidPage = await client.GetAsync("/tasks?limit=101"))
    Check(invalidPage.StatusCode == HttpStatusCode.BadRequest, "Unbounded page size is rejected");

var concurrent = await Task.WhenAll(Enumerable.Range(0, 8).Select(async number =>
{
    using var response = await client.PostAsJsonAsync("/tasks", new { title = $"{title}-{number}" });
    response.EnsureSuccessStatusCode();
    return await response.Content.ReadFromJsonAsync<TaskView>() ?? throw new Exception("Missing concurrent result");
}));
Check(concurrent.Select(task => task.Id).Distinct().Count() == concurrent.Length, "Concurrent creates have distinct IDs");
Console.WriteLine($"PASS: {assertions} HTTP acceptance assertions.");

record TaskView(int Id, string Title, bool Done, int Version);
