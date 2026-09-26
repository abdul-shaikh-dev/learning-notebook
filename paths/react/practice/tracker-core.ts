export type Lesson = {id: string; title: string; done: boolean};
export type Action = {type:"add"; id:string; title:string} | {type:"toggle"; id:string} | {type:"remove"; id:string};
export function reducer(state: Lesson[], action: Action): Lesson[] {
  if (action.type === "add") {
    const title = action.title.trim();
    if (!action.id.trim() || title.length < 2 || title.length > 100 || state.some(row => row.id === action.id)) return state;
    return [...state, {id:action.id, title, done:false}];
  }
  if (action.type === "toggle") return state.map(row => row.id === action.id ? {...row,done:!row.done} : row);
  return state.filter(row => row.id !== action.id);
}
export function decodeSaved(text: string): Lesson[] {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("lessons" in value) || !Array.isArray(value.lessons)) throw new Error("Unsupported saved format");
  if(value.lessons.length > 1000) throw new Error("Too many lessons");
  const ids = new Set<string>();
  return value.lessons.map((row: unknown) => {
    if(!row || typeof row !== "object" || !("id" in row) || typeof row.id !== "string" || !row.id.trim() || ids.has(row.id) ||
       !("title" in row) || typeof row.title !== "string" || row.title.trim().length < 2 || row.title.trim().length > 100 ||
       !("done" in row) || typeof row.done !== "boolean") throw new Error("Invalid lesson record");
    ids.add(row.id);
    return {id:row.id,title:row.title.trim(),done:row.done};
  });
}
export function encodeSaved(rows: Lesson[]): string {
  return JSON.stringify({version:1,lessons:rows});
}

