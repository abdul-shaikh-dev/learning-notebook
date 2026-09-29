import type {Detail, Loader} from "./RemoteLesson";

/** Use only against a same-origin or explicitly configured training API. */
export function makeHttpLoader(baseUrl: string, fetcher: typeof fetch = fetch): Loader {
  return async (id, signal): Promise<Detail> => {
    const response = await fetcher(`${baseUrl.replace(/\/$/, "")}/lessons/${encodeURIComponent(id)}`, {signal});
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || !("id" in value) || value.id !== id || !("title" in value) || typeof value.title !== "string")
      throw Error("Invalid lesson response");
    return {id, title:value.title};
  };
}
