// Boundary parsing and immutable transitions before introducing React rendering.
export type Session = Readonly<{id: string; minutes: number; done: boolean}>;
export type ParseResult = {ok: true; value: Session} | {ok: false; error: string};
export function parseSession(input: unknown): ParseResult {
  if (input === null || typeof input !== 'object' || Array.isArray(input))
    return {ok: false, error: 'object required'};
  const row = input as Record<string, unknown>;
  if (Object.keys(row).sort().join(',') !== 'done,id,minutes')
    return {ok: false, error: 'exact fields required'};
  if (typeof row.id !== 'string' || !row.id.trim() ||
      typeof row.minutes !== 'number' || !Number.isInteger(row.minutes) ||
      row.minutes < 0 || row.minutes > 1440 || typeof row.done !== 'boolean')
    return {ok: false, error: 'invalid field value'};
  return {ok: true, value: {id: row.id.trim(), minutes: row.minutes, done: row.done}};
}
export type Action = {type: 'complete'; id: string} | {type: 'remove'; id: string};
export function transition(rows: readonly Session[], action: Action): readonly Session[] {
  switch (action.type) {
    case 'complete': return rows.map(row => row.id === action.id ? {...row, done: true} : row);
    case 'remove': return rows.filter(row => row.id !== action.id);
    default: { const impossible: never = action; return impossible; }
  }
}
