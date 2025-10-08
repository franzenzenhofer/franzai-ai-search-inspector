import type { UiStreamRow } from "@/types";

function getSearchCounts(row: UiStreamRow): { queries: number; results: number } {
  if (row.kind !== "jsonl") return { queries: 0, results: 0 };
  const item = row.parsed.items.find((it) => it.parsed?.extracted);
  const ex = item?.parsed?.extracted;
  return { queries: ex?.searchQueries.length ?? 0, results: ex?.searchResults.length ?? 0 };
}

function SseCell({ row }: { row: Extract<UiStreamRow, { kind: "sse" }> }): JSX.Element {
  return (
    <>
      {row.parsed.summary.deltaEncoding && <span className="badge" title="delta_encoding">delta={row.parsed.summary.deltaEncoding}</span>}{" "}
      {!!row.parsed.summary.modelSlugs.size && <span className="badge" title="model slug(s)">model: {[...row.parsed.summary.modelSlugs].join(",")}</span>}{" "}
      {!!row.parsed.summary.requestIds.size && <span className="badge" title="request ids">reqs: {row.parsed.summary.requestIds.size}</span>}{" "}
      events: {row.events.length}
    </>
  );
}

function JsonlCell({ row }: { row: Extract<UiStreamRow, { kind: "jsonl" }> }): JSX.Element {
  const { queries, results } = getSearchCounts(row);
  return (
    <>
      {queries > 0 && <span className="badge search" title="search queries">🔍 {queries} queries</span>}{" "}
      {results > 0 && <span className="badge search" title="search results">📄 {results} results</span>}{" "}
      lines: {row.parsed.items.length}
    </>
  );
}

export function SummaryCell({ row }: { row: UiStreamRow }): JSX.Element {
  if (row.kind === "sse") return <SseCell row={row} />;
  if (row.kind === "jsonl") return <JsonlCell row={row} />;
  return <>{row.note}</>;
}
