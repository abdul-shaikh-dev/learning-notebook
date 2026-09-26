using System.Diagnostics.Metrics;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<TaskStore>();
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16 * 1024);
var app = builder.Build();
app.UseExceptionHandler();
app.UseStatusCodePages();

app.MapGet("/health", () => Results.Ok(new { status = "ok", storage = "memory" }));
app.MapGet("/tasks", (int? after, int? limit, TaskStore store) =>
{
    int cursor = after ?? 0, size = limit ?? 20;
    if (cursor < 0) return Invalid("after", "Use a nonnegative cursor.");
    if (size is < 1 or > 100) return Invalid("limit", "Use a value from 1 to 100.");
    return Results.Ok(store.Page(cursor, size));
});
app.MapGet("/tasks/{id:int}", (int id, TaskStore store) =>
    store.Find(id) is { } item ? Results.Ok(item) : Results.Problem(statusCode: 404, title: "Task not found"));
app.MapPost("/tasks", (CreateTask request, TaskStore store) =>
{
    string? title = request.Title?.Trim();
    if (string.IsNullOrWhiteSpace(title) || title.Length > 120)
        return Invalid("title", "Use 1–120 characters after trimming.");
    var item = store.Add(title);
    return Results.Created($"/tasks/{item.Id}", item);
});
app.MapPatch("/tasks/{id:int}/complete", (int id, CompleteTask request, TaskStore store) =>
{
    if (request.ExpectedVersion < 1) return Invalid("expectedVersion", "Use a positive version.");
    var result = store.Complete(id, request.ExpectedVersion);
    return result.Status switch
    {
        CompletionStatus.Missing => Results.Problem(statusCode: 404, title: "Task not found"),
        CompletionStatus.Conflict => Results.Problem(statusCode: 409, title: "Task changed; reload before retrying"),
        _ => Results.Ok(result.Item)
    };
});
app.Run();

static IResult Invalid(string field, string message) =>
    Results.ValidationProblem(new Dictionary<string, string[]> { [field] = new[] { message } });

record CreateTask(string? Title);
record CompleteTask(int ExpectedVersion);
record TaskItem(int Id, string Title, bool Done, int Version);
enum CompletionStatus { Success, Missing, Conflict }
record CompletionResult(CompletionStatus Status, TaskItem? Item);

// Local learning store only: no persistence, identity or distributed coordination.
sealed class TaskStore : IDisposable
{
    private readonly object gate = new();
    private readonly Dictionary<int, TaskItem> tasks = new();
    private readonly ILogger<TaskStore> logger;
    private readonly Meter meter = new("Learning.Tasks", "1.0");
    private readonly Counter<long> completions;
    private int nextId = 1;

    public TaskStore(ILogger<TaskStore> logger)
    {
        this.logger = logger;
        completions = meter.CreateCounter<long>("tasks.completion.attempts");
    }

    public TaskItem[] Page(int after, int limit)
    {
        lock (gate) return tasks.Values.Where(item => item.Id > after).OrderBy(item => item.Id).Take(limit).ToArray();
    }
    public TaskItem? Find(int id)
    {
        lock (gate) return tasks.GetValueOrDefault(id);
    }
    public TaskItem Add(string title)
    {
        lock (gate)
        {
            var item = new TaskItem(nextId++, title, false, 1);
            tasks.Add(item.Id, item);
            return item;
        }
    }
    public CompletionResult Complete(int id, int expectedVersion)
    {
        CompletionResult result;
        lock (gate)
        {
            if (!tasks.TryGetValue(id, out var item)) result = new(CompletionStatus.Missing, null);
            else if (item.Version != expectedVersion) result = new(CompletionStatus.Conflict, null);
            else
            {
                var updated = item.Done ? item : item with { Done = true, Version = item.Version + 1 };
                tasks[id] = updated;
                result = new(CompletionStatus.Success, updated);
            }
        }
        string outcome = result.Status.ToString().ToLowerInvariant();
        completions.Add(1, new KeyValuePair<string, object?>("outcome", outcome));
        logger.LogInformation("Complete task {TaskId} returned {Outcome}", id, outcome);
        return result;
    }
    public void Dispose() => meter.Dispose();
}

public partial class Program { }
