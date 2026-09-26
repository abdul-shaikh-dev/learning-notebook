// Complete console Program.cs. No packages or input files required.
var items = new List<LearningTask>
{
    new(1, "  Read  "), new(2, "Practice"), new(3, "Review")
};
items[0].Complete();
foreach (var item in items.Where(item => !item.Done).OrderBy(item => item.Id))
    Console.WriteLine($"{item.Id}: {item.Title}");
Check(items[0].Done, "Completion changes state");
Check(items[0].Title == "Read", "Titles are trimmed");
Check(items.Count(item => !item.Done) == 2, "Open task count");
bool blankRejected = false;
try { _ = new LearningTask(4, "  "); }
catch (ArgumentException) { blankRejected = true; }
Check(blankRejected, "Blank title rejected");
Console.WriteLine("PASS: 4 foundation assertions.");

static void Check(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException("FAIL: " + message);
}
sealed class LearningTask
{
    public int Id { get; }
    public string Title { get; }
    public bool Done { get; private set; }
    public LearningTask(int id, string title)
    {
        if (id < 1) throw new ArgumentOutOfRangeException(nameof(id));
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title required", nameof(title));
        Id = id;
        Title = title.Trim();
    }
    public void Complete() => Done = true;
}
