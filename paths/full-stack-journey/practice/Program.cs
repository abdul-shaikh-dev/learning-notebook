using System.Data;
using System.Text.Json.Serialization;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
// Synthetic single-user, loopback-only lab. No user-supplied identity is trusted.
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 16_384);
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins("http://127.0.0.1:5173").WithMethods("GET", "POST", "PUT").WithHeaders("Content-Type")));
var connection = builder.Configuration["PlannerConnection"];
IPlanner store = string.IsNullOrWhiteSpace(connection) ? new MemoryPlanner() : new SqlPlanner(connection);
var app = builder.Build();
app.Use(async (ctx, next) => {
    if (ctx.Connection.RemoteIpAddress is not null && !System.Net.IPAddress.IsLoopback(ctx.Connection.RemoteIpAddress)) {
        ctx.Response.StatusCode = 403; return;
    }
    var start = System.Diagnostics.Stopwatch.GetTimestamp();
    try { await next(ctx); }
    finally { app.Logger.LogInformation("Request {Method} {Path} {Status} {ElapsedMs}ms trace={Trace}", ctx.Request.Method, ctx.Request.Path, ctx.Response.StatusCode, System.Diagnostics.Stopwatch.GetElapsedTime(start).TotalMilliseconds, ctx.TraceIdentifier); }
});
app.UseCors();
app.MapGet("/health", () => Results.Ok(new { status = "alive", storage = store is SqlPlanner ? "sql-server" : "memory" }));
app.MapGet("/api/tasks", async (CancellationToken ct) => Results.Ok(await store.List(ct)));
app.MapGet("/api/tasks/{id:guid}", async (Guid id, CancellationToken ct) => {
    var task = await store.Get(id, ct); return task is null ? Results.NotFound() : Results.Ok(task);
});
app.MapPost("/api/tasks", async (CreateTask input, CancellationToken ct) => {
    if (!Valid(input.Title, input.Minutes)) return Results.BadRequest(new { error = "title: 1–120 characters; minutes: integer 0–1440" });
    var task = await store.Create(input.Title!.Trim(), input.Minutes!.Value, ct);
    return Results.Created($"/api/tasks/{task.Id}", task);
});
app.MapPut("/api/tasks/{id:guid}", async (Guid id, UpdateTask input, CancellationToken ct) => {
    if (!Valid(input.Title, input.Minutes) || input.Version is null or < 1 || input.Done is null) return Results.BadRequest(new { error = "title, minutes, done and positive version are required" });
    var (status, task) = await store.Update(id, input.Title!.Trim(), input.Minutes!.Value, input.Done.Value, input.Version.Value, ct);
    return status == 200 ? Results.Ok(task) : status == 409 ? Results.Conflict(new { error = "Stale version. Reload and compare your draft." }) : Results.NotFound();
});
app.Run();
static bool Valid(string? title, int? minutes) => title is not null && title.Trim().Length is >= 1 and <= 120 && minutes is >= 0 and <= 1440;
record CreateTask(string? Title, int? Minutes);
record UpdateTask(string? Title, int? Minutes, bool? Done, int? Version);
record StudyTask(Guid Id, string Title, int Minutes, bool Done, int Version);
interface IPlanner {
    Task<StudyTask?> Get(Guid id, CancellationToken ct);
    Task<StudyTask[]> List(CancellationToken ct);
    Task<StudyTask> Create(string title, int minutes, CancellationToken ct);
    Task<(int, StudyTask?)> Update(Guid id, string title, int minutes, bool done, int version, CancellationToken ct);
}
class MemoryPlanner : IPlanner {
    readonly Dictionary<Guid, StudyTask> tasks = new(); readonly object gate = new();
    public Task<StudyTask?> Get(Guid id, CancellationToken ct) { ct.ThrowIfCancellationRequested(); lock(gate) return Task.FromResult(tasks.GetValueOrDefault(id)); }
    public Task<StudyTask[]> List(CancellationToken ct) { ct.ThrowIfCancellationRequested(); lock(gate) return Task.FromResult(tasks.Values.OrderBy(x => x.Id).ToArray()); }
    public Task<StudyTask> Create(string title, int minutes, CancellationToken ct) { ct.ThrowIfCancellationRequested(); lock(gate) { var task = new StudyTask(Guid.NewGuid(), title, minutes, false, 1); tasks.Add(task.Id, task); return Task.FromResult(task); } }
    public Task<(int, StudyTask?)> Update(Guid id, string title, int minutes, bool done, int version, CancellationToken ct) {
        ct.ThrowIfCancellationRequested(); lock(gate) {
            if (!tasks.TryGetValue(id, out var old)) return Task.FromResult<(int, StudyTask?)>((404, null));
            if (old.Version != version) return Task.FromResult<(int, StudyTask?)>((409, null));
            var task = new StudyTask(id, title, minutes, done, checked(version + 1)); tasks[id] = task;
            return Task.FromResult<(int, StudyTask?)>((200, task));
        }
    }
}
class SqlPlanner(string connection) : IPlanner {
    static StudyTask Read(SqlDataReader r) => new(r.GetGuid(0), r.GetString(1), r.GetInt32(2), r.GetBoolean(3), r.GetInt32(4));
    public async Task<StudyTask?> Get(Guid id, CancellationToken ct) {
        await using var db = new SqlConnection(connection); await db.OpenAsync(ct);
        await using var cmd = new SqlCommand("SELECT Id,Title,Minutes,Done,Version FROM dbo.StudyTasks WHERE Id=@id", db);
        cmd.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = id;
        await using var r = await cmd.ExecuteReaderAsync(ct); return await r.ReadAsync(ct) ? Read(r) : null;
    }
    public async Task<StudyTask[]> List(CancellationToken ct) {
        await using var db = new SqlConnection(connection); await db.OpenAsync(ct);
        await using var cmd = new SqlCommand("SELECT Id,Title,Minutes,Done,Version FROM dbo.StudyTasks ORDER BY Id", db);
        await using var r = await cmd.ExecuteReaderAsync(ct); var rows = new List<StudyTask>();
        while (await r.ReadAsync(ct)) rows.Add(Read(r)); return rows.ToArray();
    }
    public async Task<StudyTask> Create(string title, int minutes, CancellationToken ct) {
        var task = new StudyTask(Guid.NewGuid(), title, minutes, false, 1);
        await using var db = new SqlConnection(connection); await db.OpenAsync(ct);
        await using var cmd = new SqlCommand("INSERT dbo.StudyTasks(Id,Title,Minutes,Done,Version) VALUES(@id,@title,@minutes,0,1)", db);
        Bind(cmd, task); await cmd.ExecuteNonQueryAsync(ct); return task;
    }
    public async Task<(int, StudyTask?)> Update(Guid id, string title, int minutes, bool done, int version, CancellationToken ct) {
        await using var db = new SqlConnection(connection); await db.OpenAsync(ct);
        await using var cmd = new SqlCommand("UPDATE dbo.StudyTasks SET Title=@title,Minutes=@minutes,Done=@done,Version=Version+1 OUTPUT inserted.Id,inserted.Title,inserted.Minutes,inserted.Done,inserted.Version WHERE Id=@id AND Version=@version", db);
        Bind(cmd, new StudyTask(id, title, minutes, done, version));
        await using (var r = await cmd.ExecuteReaderAsync(ct)) { if (await r.ReadAsync(ct)) return (200, Read(r)); }
        await using var exists = new SqlCommand("SELECT COUNT(*) FROM dbo.StudyTasks WHERE Id=@id", db); exists.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = id;
        return ((int)(await exists.ExecuteScalarAsync(ct))! == 0 ? 404 : 409, null);
    }
    static void Bind(SqlCommand cmd, StudyTask task) {
        cmd.Parameters.Add("@id", SqlDbType.UniqueIdentifier).Value = task.Id;
        cmd.Parameters.Add("@title", SqlDbType.NVarChar, 120).Value = task.Title;
        cmd.Parameters.Add("@minutes", SqlDbType.Int).Value = task.Minutes;
        cmd.Parameters.Add("@done", SqlDbType.Bit).Value = task.Done;
        cmd.Parameters.Add("@version", SqlDbType.Int).Value = task.Version;
    }
}
