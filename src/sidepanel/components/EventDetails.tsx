import type { UiStreamRow, SecretVisibility } from "@/types";
import type { ExtractedData } from "@/lib/searchExtract";
import { SseView } from "./SseView";
import { SearchDataDisplay } from "./SearchDataDisplay";
import { JsonViewer } from "./JsonViewer";

interface EventDetailsProps {
  stream: UiStreamRow | null;
  visibility: SecretVisibility;
}

function getExt(stream: Extract<UiStreamRow, { kind: "jsonl" }>): ExtractedData | undefined {
  const item = stream.parsed.items.find((it) => it.parsed?.extracted);
  return item?.parsed?.extracted;
}

function JsonlView({ stream }: { stream: Extract<UiStreamRow, { kind: "jsonl" }> }): JSX.Element {
  const ext = getExt(stream);
  return (
    <div className="event-details">
      {ext && <SearchDataDisplay data={ext} />}
      <div className="raw-data-section">
        <JsonViewer data={stream.parsed} title="Raw JSONL Data" />
      </div>
    </div>
  );
}

function OtherView({ stream }: { stream: Extract<UiStreamRow, { kind: "other" }> }): JSX.Element {
  return (
    <div className="event-details">
      <div className="no-search">Unknown response format</div>
      <JsonViewer data={{ url: stream.url, note: stream.note }} title="Raw Data" />
    </div>
  );
}

export function EventDetails({ stream, visibility }: EventDetailsProps): JSX.Element {
  if (!stream) return <div className="empty">Select a stream to view details</div>;
  if (stream.kind === "other") return <OtherView stream={stream} />;
  if (stream.kind === "jsonl") return <JsonlView stream={stream} />;
  return <SseView stream={stream} visibility={visibility} />;
}
