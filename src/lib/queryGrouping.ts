import type { SearchQuery, SearchResultGroup } from "@/types-search";

export interface QueryWithResults {
  query: SearchQuery;
  results: SearchResultGroup[];
  totalResults: number;
}

export function groupResultsByQuery(
  queries: SearchQuery[],
  results: SearchResultGroup[]
): QueryWithResults[] {
  return queries.map((query) => {
    const totalResults = results.reduce((sum, g) => sum + g.entries.length, 0);
    return {
      query,
      results,
      totalResults,
    };
  });
}
