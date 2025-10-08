import type { UiStreamRow } from "@/types";
import type { ExtractedData } from "@/lib/searchExtract";
import { SearchResults } from "./SearchResults";
import { SearchQueries } from "./SearchQueries";

interface Props {
  rows: UiStreamRow[];
}

function getExt(row: UiStreamRow): ExtractedData | undefined {
  if (row.kind !== "jsonl") return undefined;
  const item = row.parsed.items.find((it) => it.parsed?.extracted);
  return item?.parsed?.extracted;
}

function aggregate(rows: UiStreamRow[]): ExtractedData {
  const all = rows.map(getExt).filter((e): e is ExtractedData => !!e);
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
