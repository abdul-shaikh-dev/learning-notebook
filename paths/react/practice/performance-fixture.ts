/** Separate benchmark data; intentionally bypasses the tracker import limit. */
export type BenchmarkRow = {id: number; title: string};
export function makeRows(count = 10_000): BenchmarkRow[] {
  return Array.from({length: count}, (_, id) => ({id, title: `Lesson ${id} ${id % 10 === 0 ? "focus" : "review"}`}));
}
export function filterRows(rows: BenchmarkRow[], query: string): BenchmarkRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter(row => row.title.toLowerCase().includes(needle));
}
