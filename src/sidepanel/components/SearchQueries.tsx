import type { SearchQuery } from "@/types-search";

interface Props {
  queries: SearchQuery[];
}

function formatTime(ts: number | undefined): string {
  if (ts === undefined) return "—";
  return new Date(ts * 1000).toLocaleTimeString();
}

function QueryItem({ query, timestamp }: SearchQuery): JSX.Element {
  return (
    <div className="query-item">
      <span className="badge">{formatTime(timestamp)}</span>
      <span className="query-text">{query}</span>
    </div>
  );
}

export function SearchQueries({ queries }: Props): JSX.Element {
  if (queries.length === 0) return <div className="empty small">No search queries</div>;
  return (
    <div className="search-queries">
      {queries.map((q, i) => <QueryItem key={i} {...q} />)}
    </div>
  );
}
