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

export function extractResults(obj: Record<string, unknown>): SearchResultGroup[] {
  if (!Array.isArray(obj.search_result_groups)) return [];
  return obj.search_result_groups
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map(extractGroup);
}

export function extractQueries(obj: Record<string, unknown>): SearchQuery[] {
  if (!Array.isArray(obj.search_model_queries)) return [];
  return obj.search_model_queries
    .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
    .map((q) => ({
      query: typeof q.query === "string" ? q.query : "",
      timestamp: typeof q.timestamp === "number" ? q.timestamp : undefined,
    }));
}
