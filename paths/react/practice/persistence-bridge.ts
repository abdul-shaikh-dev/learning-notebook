import {decodeSaved, encodeSaved, type Lesson} from "./tracker-core";

export const STORAGE_KEY = "learning-tracker-v2";
export function migrateSaved(text: string): Lesson[] {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || !("version" in value)) throw Error("Unsupported saved format");
  if (value.version === 1) return decodeSaved(text);
  if (value.version !== 2 || !("lessons" in value)) throw Error("Unsupported saved format");
  return decodeSaved(JSON.stringify({version:1, lessons:value.lessons}));
}
export function saveLocal(storage: Pick<Storage,"setItem">, rows: Lesson[]): void {
  const parsed = JSON.parse(encodeSaved(rows)) as {lessons: Lesson[]};
  storage.setItem(STORAGE_KEY, JSON.stringify({version:2, lessons:parsed.lessons}));
}
export function loadLocal(storage: Pick<Storage,"getItem">): Lesson[] | null {
  const text = storage.getItem(STORAGE_KEY);
  return text === null ? null : migrateSaved(text);
}
