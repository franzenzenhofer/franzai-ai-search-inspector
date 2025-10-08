import type { UiStreamRow } from "@/types";
import type { ExtractedData } from "@/lib/searchExtract";
import { SearchResults } from "./SearchResults";
import { SearchQueries } from "./SearchQueries";

interface Props {
  rows: UiStreamRow[];
}

function getAllExt(row: UiStreamRow): ExtractedData[] {
  if (row.kind !== "jsonl") return [];
  return row.parsed.items
    .filter((it) => it.parsed?.extracted)
    .map((it) => it.parsed?.extracted)
    .filter((e): e is ExtractedData => !!e);
}

function aggregate(rows: UiStreamRow[]): ExtractedData {
  const all = rows.flatMap(getAllExt);
  const first = all.length > 0 ? all[0] : undefined;
  return {
    searchQueries: all.flatMap((e) => e.searchQueries),
    searchResults: all.flatMap((e) => e.searchResults),
    conversationId: first?.conversationId,
    createTime: first?.createTime,
    contentRefs: [],
    messages: [],
  };
}

function Header({ qc, rc }: { qc: number; rc: number }): JSX.Element {
  return (
    <div className="global-header">
      <h1>Search Data Inspector</h1>
      <div className="global-stats">
        {qc === 0 && rc === 0 && <span className="badge warn">0 searches</span>}
        {qc > 0 && <span className="badge search">{qc} {qc === 1 ? "query" : "queries"}</span>}
        {rc > 0 && <span className="badge success">{rc} {rc === 1 ? "result" : "results"}</span>}
      </div>
    </div>
  );
}

export function GlobalSearchView({ rows }: Props): JSX.Element {
  const data = aggregate(rows);
  const qc = data.searchQueries.length;
  const rc = data.searchResults.reduce((sum, g) => sum + g.entries.length, 0);
  return (
    <div className="global-search-view">
      <Header qc={qc} rc={rc} />
      {qc > 0 && <SearchQueries queries={data.searchQueries} />}
      {rc > 0 && <SearchResults groups={data.searchResults} />}
    </div>
  );
}
