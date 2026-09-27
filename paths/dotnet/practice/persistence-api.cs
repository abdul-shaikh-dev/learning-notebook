using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

public sealed class TaskRow {
    public int Id {get;set;}
    public string Title {get;set;} = "";
    public string Owner {get;set;} = "";
    public bool Done {get;set;}
    public int Version {get;set;} = 1;
}
public sealed class TaskDb(DbContextOptions<TaskDb> options) : DbContext(options) {
    public DbSet<TaskRow> Tasks => Set<TaskRow>();
    protected override void OnModelCreating(ModelBuilder model) {
        model.Entity<TaskRow>().Property(t=>t.Version).IsConcurrencyToken();
        model.Entity<TaskRow>().HasIndex(t=>new {t.Owner,t.Id});
    }
}
public sealed record CreateTask(string? Title);
public sealed record CompleteTask(int Version);
public static class PersistenceApi {
    // Host installs real authentication in deployment; the downloadable checks install fake auth only in their test host.
    public static void Map(WebApplication app) {
        var group=app.MapGroup("/tasks").RequireAuthorization("tasks");
        group.MapPost("", async (CreateTask input, ClaimsPrincipal user, TaskDb db, CancellationToken ct) => {
            var title=input.Title?.Trim();
            if(string.IsNullOrEmpty(title)||title.Length>100)return Results.ValidationProblem(new Dictionary<string,string[]>{{"title",["Use 1 to 100 nonblank characters."]}});
            var row=new TaskRow {Title=title,Owner=user.FindFirstValue(ClaimTypes.NameIdentifier)!};
            db.Tasks.Add(row);await db.SaveChangesAsync(ct);return Results.Created($"/tasks/{row.Id}",row);
        });
        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal user, TaskDb db, CancellationToken ct) => {
            var row=await db.Tasks.AsNoTracking().SingleOrDefaultAsync(t=>t.Id==id&&t.Owner==user.FindFirstValue(ClaimTypes.NameIdentifier),ct);
            return row is null ? Results.NotFound() : Results.Ok(row);
        });
        group.MapPost("/{id:int}/complete", async (int id, CompleteTask input, ClaimsPrincipal user, TaskDb db, CancellationToken ct) => {
            var row=await db.Tasks.SingleOrDefaultAsync(t=>t.Id==id&&t.Owner==user.FindFirstValue(ClaimTypes.NameIdentifier),ct);
            if(row is null)return Results.NotFound();
            if(row.Version!=input.Version)return Results.Conflict(new {error="Stale version"});
            row.Done=true;row.Version++;
            try {await db.SaveChangesAsync(ct);}catch(DbUpdateConcurrencyException){return Results.Conflict(new {error="Concurrent update"});}
            return Results.Ok(row);
        });
    }
}
