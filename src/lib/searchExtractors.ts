import type { SearchResultGroup, SearchQuery, SearchResultEntry } from "@/types-search";
import { queryFieldNames, resultFieldNames } from "./searchFieldNames";
import { deepFind } from "./deepFind";

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

export function extractResults(obj: Record<string, unknown>): SearchResultGroup[] {
  const all = resultFieldNames.flatMap((k) => deepFind(obj, k));
  return all
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

function dedupeQueries(queries: SearchQuery[]): SearchQuery[] {
  const seen = new Set<string>();
  return queries.filter((q) => {
    if (seen.has(q.query)) return false;
    seen.add(q.query);
    return true;
  });
}

export function extractQueries(obj: Record<string, unknown>): SearchQuery[] {
  const all = queryFieldNames.flatMap((k) => deepFind(obj, k));
  const queries = all.map(toQuery).filter((q): q is SearchQuery => q !== null);
  return dedupeQueries(queries);
}
