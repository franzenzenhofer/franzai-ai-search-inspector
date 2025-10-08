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

function recurseFind(current: unknown, key: string, results: unknown[]): void {
  if (!current || typeof current !== "object") return;
  const curr = current as Record<string, unknown>;
  if (Array.isArray(curr[key])) {
    results.push(...(curr[key] as unknown[]));
  } else if (curr[key] !== undefined) {
    results.push(curr[key]);
  }
  Object.values(curr).forEach((v) => recurseFind(v, key, results));
}

function deepFind(obj: unknown, key: string): unknown[] {
  const results: unknown[] = [];
  recurseFind(obj, key, results);
  return results;
}

export function extractResults(obj: Record<string, unknown>): SearchResultGroup[] {
  const groups = deepFind(obj, "search_result_groups");
  return groups
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map(extractGroup);
}

function toQuery(item: unknown): SearchQuery | null {
  if (typeof item === "string") return { query: item, timestamp: undefined };
  if (typeof item === "object" && item !== null) {
    const q = item as Record<string, unknown>;
    const queryText = typeof q.query === "string" ? q.query : "";
    if (queryText.length === 0) return null;
    return {
      query: queryText,
      timestamp: typeof q.timestamp === "number" ? q.timestamp : undefined,
    };
  }
  return null;
}

export function extractQueries(obj: Record<string, unknown>): SearchQuery[] {
  const keys = ["search_model_queries", "queries", "query", "search_query"];
  const all = keys.flatMap((k) => deepFind(obj, k));
  const queries = all.map(toQuery).filter((q): q is SearchQuery => q !== null);
  const seen = new Set<string>();
  return queries.filter((q) => {
    if (seen.has(q.query)) return false;
    seen.add(q.query);
    return true;
  });
}
