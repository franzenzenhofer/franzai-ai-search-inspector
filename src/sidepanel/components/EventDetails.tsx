import type { UiStreamRow, SecretVisibility } from "@/types";
import { SseView } from "./SseView";

interface EventDetailsProps {
  stream: UiStreamRow | null;
  visibility: SecretVisibility;
}

function OtherView({ stream }: { stream: Extract<UiStreamRow, { kind: "other" }> }): JSX.Element {
  return (
    <div>
      <h3>Other Response</h3>
      <div className="small">{stream.url}</div>
      <pre className="mono">{stream.note}</pre>
    </div>
  );
}

function JsonlRow({ line, idx }: { line: { line: string }; idx: number }): JSX.Element {
  return (
    <tr>
      <td>{idx + 1}</td>
      <td><pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{line.line}</pre></td>
    </tr>
  );
}

function JsonlView({ stream }: { stream: Extract<UiStreamRow, { kind: "jsonl" }> }): JSX.Element {
  return (
    <div>
      <h3>JSON Lines</h3>
      <div className="small">{stream.url}</div>
      <table className="table mono">
        <thead><tr><th style={{ width: 60 }}>#</th><th>Line</th></tr></thead>
        <tbody>{stream.parsed.items.map((it, idx) => <JsonlRow key={idx} line={it} idx={idx} />)}</tbody>
      </table>
    </div>
  );
}

export function EventDetails({ stream, visibility }: EventDetailsProps): JSX.Element {
  if (!stream) return <div className="empty">Select a stream to view details</div>;
  if (stream.kind === "other") return <OtherView stream={stream} />;
  if (stream.kind === "jsonl") return <JsonlView stream={stream} />;
  return <SseView stream={stream} visibility={visibility} />;
}
