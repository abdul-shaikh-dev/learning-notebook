using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

var dir=Path.Combine(Path.GetTempPath(),"notebook-sqlite-"+Guid.NewGuid());Directory.CreateDirectory(dir);
var file=Path.Combine(dir,"tasks.db");
int assertions=0;
void Check(bool ok,string reason){if(!ok)throw new Exception(reason);assertions++;}
async Task<WebApplication> Host() {
    var builder=WebApplication.CreateBuilder(new WebApplicationOptions{EnvironmentName="Testing"});
    builder.Logging.SetMinimumLevel(LogLevel.Warning);
    builder.Services.AddDataProtection().UseEphemeralDataProtectionProvider();
    builder.WebHost.UseTestServer();
    builder.Services.AddDbContext<TaskDb>(o=>o.UseSqlite($"Data Source={file};Pooling=False"));
    builder.Services.AddAuthentication("TestOnly").AddScheme<AuthenticationSchemeOptions,FakeAuth>("TestOnly",_=>{});
    builder.Services.AddAuthorization(o=>o.AddPolicy("tasks",p=>p.RequireAuthenticatedUser().RequireClaim(ClaimTypes.NameIdentifier).RequireClaim("permission","tasks")));
    var app=builder.Build();app.UseAuthentication();app.UseAuthorization();PersistenceApi.Map(app);
    using(var scope=app.Services.CreateScope())await scope.ServiceProvider.GetRequiredService<TaskDb>().Database.EnsureCreatedAsync();
    await app.StartAsync();return app;
}
HttpClient Client(WebApplication app,string? name=null,bool permission=true) {
    var client=app.GetTestClient();if(name is not null)client.DefaultRequestHeaders.Add("X-Test-User",name);
    if(permission)client.DefaultRequestHeaders.Add("X-Test-Permission","tasks");return client;
}
try {
    int id;
    await using(var app=await Host()) {
        using var anon=Client(app);Check((await anon.GetAsync("/tasks/1")).StatusCode==HttpStatusCode.Unauthorized,"Anonymous must be 401");
        using var denied=Client(app,"alice",false);Check((await denied.GetAsync("/tasks/1")).StatusCode==HttpStatusCode.Forbidden,"Missing permission must be 403");
        using var alice=Client(app,"alice");
        Check((await alice.PostAsJsonAsync("/tasks",new CreateTask(" "))).StatusCode==HttpStatusCode.BadRequest,"Blank title must be 400");
        var created=await alice.PostAsJsonAsync("/tasks",new CreateTask("Persistent task"));Check(created.StatusCode==HttpStatusCode.Created,"Create must be 201");
        var row=(await created.Content.ReadFromJsonAsync<TaskRow>())!;id=row.Id;
        using var bob=Client(app,"bob");Check((await bob.GetAsync($"/tasks/{id}")).StatusCode==HttpStatusCode.NotFound,"Other owner must not read");
        Check((await bob.PostAsJsonAsync($"/tasks/{id}/complete",new CompleteTask(1))).StatusCode==HttpStatusCode.NotFound,"Other owner must not write");
        Check((await alice.PostAsJsonAsync($"/tasks/{id}/complete",new CompleteTask(1))).StatusCode==HttpStatusCode.OK,"Owner can write");
        Check((await alice.PostAsJsonAsync($"/tasks/{id}/complete",new CompleteTask(1))).StatusCode==HttpStatusCode.Conflict,"Stale request must be 409");
    }
    // Rebuild the whole host against the same disk file, not merely a tracked context.
    await using(var restarted=await Host()) {
        using var alice=Client(restarted,"alice");var row=await alice.GetFromJsonAsync<TaskRow>($"/tasks/{id}");
        Check(row is {Done:true,Version:2,Title:"Persistent task"},"Restart must preserve values and version");
        using(var scope=restarted.Services.CreateScope()) {
            var db=scope.ServiceProvider.GetRequiredService<TaskDb>();
            await using var tx=await db.Database.BeginTransactionAsync();
            db.Tasks.Add(new TaskRow{Owner="alice",Title="Rolled back"});await db.SaveChangesAsync();await tx.RollbackAsync();
        }
        using(var scope=restarted.Services.CreateScope())Check(!await scope.ServiceProvider.GetRequiredService<TaskDb>().Tasks.AnyAsync(t=>t.Title=="Rolled back"),"Rollback checked from fresh context");
        using var firstScope=restarted.Services.CreateScope();using var secondScope=restarted.Services.CreateScope();
        var first=firstScope.ServiceProvider.GetRequiredService<TaskDb>();var second=secondScope.ServiceProvider.GetRequiredService<TaskDb>();
        var a=await first.Tasks.SingleAsync(t=>t.Id==id);var b=await second.Tasks.SingleAsync(t=>t.Id==id);
        a.Title="Winner";a.Version++;await first.SaveChangesAsync();b.Title="Lost update";b.Version++;
        try {await second.SaveChangesAsync();Check(false,"Competing stale context must fail");}catch(DbUpdateConcurrencyException){Check(true,"Concurrency conflict observed");}
        using var verifyScope=restarted.Services.CreateScope();var verify=verifyScope.ServiceProvider.GetRequiredService<TaskDb>();
        Check((await verify.Tasks.SingleAsync(t=>t.Id==id)).Title=="Winner","Conflict cannot overwrite winner");
        using var cancel=new CancellationTokenSource();cancel.Cancel();
        try {await verify.Tasks.ToListAsync(cancel.Token);Check(false,"Canceled query must not succeed");}catch(OperationCanceledException){Check(true,"Pre-canceled query observed");}
    }
    Console.WriteLine($"PASS: {assertions} SQLite and test-host authorization assertions.");
} finally {Directory.Delete(dir,true);}

// This handler is compiled only into this executable TEST HOST. Never copy it to a deployed API.
public sealed class FakeAuth(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options,logger,encoder) {
    protected override Task<AuthenticateResult> HandleAuthenticateAsync() {
        var name=Request.Headers["X-Test-User"].ToString();
        if(string.IsNullOrWhiteSpace(name))return Task.FromResult(AuthenticateResult.NoResult());
        var claims=new List<Claim>{new(ClaimTypes.NameIdentifier,name)};
        if(Request.Headers["X-Test-Permission"]=="tasks")claims.Add(new("permission","tasks"));
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims,Scheme.Name)),Scheme.Name)));
    }
}
