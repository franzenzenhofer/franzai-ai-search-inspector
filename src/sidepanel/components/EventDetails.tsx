import type { CapturedStream, SecretVisibility } from "@/types";
import { parseEventStream, summarize } from "@/lib/sse";
import { maskToken } from "@/lib/util";

interface EventDetailsProps {
  stream: CapturedStream | null;
  visibility: SecretVisibility;
}

function formatValue(value: unknown, visibility: SecretVisibility): string {
  if (typeof value === "string" && value.length > 50 && visibility === "masked") {
    return maskToken(value);
  }
  return JSON.stringify(value, null, 2);
}

function DetailRow({ label, value, visibility }: { label: string; value: unknown; visibility: SecretVisibility }): JSX.Element {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}:</span>
      <pre className="detail-value mono">{formatValue(value, visibility)}</pre>
    </div>
  );
}

function StreamDetails({ stream, visibility }: { stream: CapturedStream; visibility: SecretVisibility }): JSX.Element {
  const events = parseEventStream(stream.body);
  const summary = summarize(events);
  return (
    <div className="details">
      <DetailRow label="URL" value={stream.url} visibility={visibility} />
      <DetailRow label="Request ID" value={stream.requestId} visibility={visibility} />
      <DetailRow label="Timestamp" value={new Date(stream.timestamp).toISOString()} visibility={visibility} />
      <DetailRow label="Summary" value={summary} visibility={visibility} />
      <DetailRow label="Events" value={events.length} visibility={visibility} />
    </div>
  );
}

export function EventDetails({ stream, visibility }: EventDetailsProps): JSX.Element {
  if (!stream) return <div className="empty">Select a stream to view details</div>;
  return <StreamDetails stream={stream} visibility={visibility} />;
}
