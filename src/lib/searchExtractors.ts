import type { SearchResultGroup, SearchQuery, SearchResultEntry } from "@/types-search";

export function extractEntry(e: Record<string, unknown>): SearchResultEntry {
  return {
    url: typeof e.url === "string" ? e.url : "",
    title: typeof e.title === "string" ? e.title : "",
    snippet: typeof e.snippet === "string" ? e.snippet : "",
    thumbnail: typeof e.thumbnail === "string" ? e.thumbnail : undefined,
    authority: typeof e.authority === "number" ? e.authority : undefined,
  };
}

export function extractGroup(g: Record<string, unknown>): SearchResultGroup {
  return {
    domain: typeof g.domain === "string" ? g.domain : "",
    entries: Array.isArray(g.entries) ?
      g.entries
        .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
        .map(extractEntry)
    : [],
  };
}

function deepFind(obj: unknown, key: string): unknown[] {
  const results: unknown[] = [];
  function recurse(current: unknown): void {
    if (!current || typeof current !== "object") return;
    const curr = current as Record<string, unknown>;
    if (Array.isArray(curr[key])) {
      const arr = curr[key] as unknown[];
      results.push(...arr);
    }
    Object.values(curr).forEach(recurse);
  }
  recurse(obj);
  return results;
}

export function extractResults(obj: Record<string, unknown>): SearchResultGroup[] {
  const groups = deepFind(obj, "search_result_groups");
  return groups
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map(extractGroup);
}

export function extractQueries(obj: Record<string, unknown>): SearchQuery[] {
  const smq = deepFind(obj, "search_model_queries");
  const q = deepFind(obj, "queries");
  const all = [...smq, ...q];
  return all
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((q) => ({
      query: typeof q.query === "string" ? q.query : (typeof q === "string" ? q : ""),
      timestamp: typeof q.timestamp === "number" ? q.timestamp : undefined,
    }));
}
