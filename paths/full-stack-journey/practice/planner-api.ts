export type StudyTask = {id: string; title: string; minutes: number; done: boolean; version: number};
export function decodeTask(value: unknown): StudyTask {
  if (!value || typeof value !== 'object') throw new Error('Invalid task');
  const x = value as Record<string, unknown>;
  if (typeof x.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x.id) ||
      typeof x.title !== 'string' || !x.title.trim() || x.title.length > 120 ||
      typeof x.minutes !== 'number' || !Number.isInteger(x.minutes) || x.minutes < 0 || x.minutes > 1440 ||
      typeof x.done !== 'boolean' || typeof x.version !== 'number' || !Number.isInteger(x.version) || x.version < 1) throw new Error('Invalid task response');
  return {id:x.id,title:x.title,minutes:x.minutes,done:x.done,version:x.version};
}
export async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch('/api/tasks' + path, {...init, headers: {'Content-Type':'application/json', ...init.headers}});
  if (response.status === 409) throw new Error('Another edit won. Reload the list and compare before trying again.');
  if (!response.ok) throw new Error('Request failed (' + response.status + '). Your draft is still here.');
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Expected JSON response');
  return response.json();
}
