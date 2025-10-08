import type { CapturedStream } from "@/types";

interface StreamTableProps {
  streams: CapturedStream[];
  onSelect: (stream: CapturedStream) => void;
  selected: CapturedStream | null;
}

function StreamRow({ stream, onSelect, isSelected }: { stream: CapturedStream; onSelect: () => void; isSelected: boolean }): JSX.Element {
  const time = new Date(stream.timestamp).toLocaleTimeString();
  const url = new URL(stream.url).pathname;
  return (
    <tr className={isSelected ? "row selected" : "row"} onClick={onSelect}>
      <td className="cell">{time}</td>
      <td className="cell">{url}</td>
      <td className="cell mono">{stream.requestId}</td>
    </tr>
  );
}

function TableHeader(): JSX.Element {
  return (
    <thead>
      <tr>
        <th className="header">Time</th>
        <th className="header">URL</th>
        <th className="header">Request ID</th>
      </tr>
    </thead>
  );
}

function TableBody({ streams, onSelect, selected }: Pick<StreamTableProps, "streams" | "onSelect" | "selected">): JSX.Element {
  return (
    <tbody>
      {streams.map((stream) => (
        <StreamRow
          key={stream.requestId}
          stream={stream}
          onSelect={() => onSelect(stream)}
          isSelected={selected?.requestId === stream.requestId}
        />
      ))}
    </tbody>
  );
}

export function StreamTable(props: StreamTableProps): JSX.Element {
  return (
    <table className="table">
      <TableHeader />
      <TableBody {...props} />
    </table>
  );
}
