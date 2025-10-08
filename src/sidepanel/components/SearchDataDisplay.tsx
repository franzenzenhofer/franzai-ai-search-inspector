import type { ExtractedData } from "@/lib/searchExtract";
import { extractResults } from "@/lib/searchExtractors";
import { SearchResults } from "./SearchResults";
import { SearchQueries } from "./SearchQueries";
import { MetadataDisplay } from "./MetadataDisplay";

interface Props {
  data: ExtractedData;
}

function SearchHeader({ q, r }: { q: number; r: number }): JSX.Element {
  return (
    <div className="search-header">
      <h2>FranzAI Search Inspector</h2>
      <div className="search-stats">
        {q === 0 && r === 0 && <span className="badge warn">0 searches discovered</span>}
        {q > 0 && <span className="badge search">{q} {q === 1 ? "query" : "queries"}</span>}
        {r > 0 && <span className="badge success">{r} {r === 1 ? "result" : "results"}</span>}
      </div>
    </div>
  );
}

function countResults(groups: ReturnType<typeof extractResults>): number {
  return groups.reduce((sum, g) => sum + g.entries.length, 0);
}

export function SearchDataDisplay({ data }: Props): JSX.Element {
  const qc = data.searchQueries.length;
  const rc = countResults(data.searchResults);
  return (
    <div className="search-data-display">
      <SearchHeader q={qc} r={rc} />
      <MetadataDisplay data={data} />
      {qc > 0 && <SearchQueries queries={data.searchQueries} />}
      {rc > 0 && <SearchResults groups={data.searchResults} />}
    </div>
  );
}
