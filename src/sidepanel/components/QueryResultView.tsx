import type { QueryWithResults } from "@/lib/queryGrouping";
import { SearchResults } from "./SearchResults";

interface Props {
  data: QueryWithResults;
}

function QueryHeader({ query, totalResults }: { query: string; totalResults: number }): JSX.Element {
  return (
    <div className="query-result-header">
      <div className="query-text-large">{query}</div>
      <div className="query-meta">
        <span className="badge success">{totalResults} {totalResults === 1 ? "result" : "results"}</span>
      </div>
    </div>
  );
}

export function QueryResultView({ data }: Props): JSX.Element {
  return (
    <div className="query-result-block">
      <QueryHeader query={data.query.query} totalResults={data.totalResults} />
      <SearchResults groups={data.results} />
    </div>
  );
}
