import { memo } from "react";
import type { UiStreamRow } from "@/types";

interface StreamTableProps {
  rows: UiStreamRow[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

function SummaryCell({ row }: { row: UiStreamRow }): JSX.Element {
  if (row.kind === "sse") {
    return (
      <>
        {row.parsed.summary.deltaEncoding && <span className="badge" title="delta_encoding">delta={row.parsed.summary.deltaEncoding}</span>}{" "}
        {!!row.parsed.summary.modelSlugs.size && <span className="badge" title="model slug(s)">model: {[...row.parsed.summary.modelSlugs].join(",")}</span>}{" "}
        {!!row.parsed.summary.requestIds.size && <span className="badge" title="request ids">reqs: {row.parsed.summary.requestIds.size}</span>}{" "}
        events: {row.events.length}
      </>
    );
  }
  if (row.kind === "jsonl") return <>lines: {row.parsed.items.length}</>;
  return <>{row.note}</>;
}

function TypeBadge({ kind }: { kind: "sse" | "jsonl" | "other" }): JSX.Element {
  if (kind === "sse") return <span className="badge">SSE</span>;
  if (kind === "jsonl") return <span className="badge">JSONL</span>;
  return <span className="badge warn">OTHER</span>;
}

function RowComponent({ row, index, isSelected, onSelect }: { row: UiStreamRow; index: number; isSelected: boolean; onSelect: (i: number) => void }): JSX.Element {
  return (
    <tr onClick={() => onSelect(index)} style={{ background: isSelected ? "#0f1722" : "transparent", cursor: "pointer" }}>
      <td><TypeBadge kind={row.kind} /></td>
      <td className="small" title={row.url}>{row.url}</td>
      <td className="small"><SummaryCell row={row} /></td>
    </tr>
  );
}

function TableBody({ rows, selectedIndex, onSelect }: StreamTableProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={3} className="small">No captured requests yet. Click <b>Start capture</b> and use ChatGPT (or reload).</td>
        </tr>
      </tbody>
    );
  }
  return <tbody>{rows.map((r, i) => <RowComponent key={i} row={r} index={i} isSelected={selectedIndex === i} onSelect={onSelect} />)}</tbody>;
}

export const StreamTable = memo(function StreamTable(props: StreamTableProps): JSX.Element {
  return (
    <table className="table mono">
      <thead>
        <tr>
          <th style={{ width: 90 }}>Type</th>
          <th>URL</th>
          <th style={{ width: 240 }}>Summary</th>
        </tr>
      </thead>
      <TableBody {...props} />
    </table>
  );
});
