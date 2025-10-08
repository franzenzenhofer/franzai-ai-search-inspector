import type { UiStreamRow, SecretVisibility, SseEvent } from "@/types";
import { decodeJwtClaims } from "@/lib/jwt";

interface SseViewProps {
  stream: Extract<UiStreamRow, { kind: "sse" }>;
  visibility: SecretVisibility;
}

function TokenItem({ event, visibility }: { event: SseEvent; visibility: SecretVisibility }): JSX.Element {
  const tok = (event.data as { token?: string }).token ?? "";
  const { masked, claims } = decodeJwtClaims(tok);
  const iat: string = claims ? String((claims as { iat?: number | string }).iat ?? "") : "";
  const showIat = claims !== null && iat.length > 0;
  return (
    <li>
      token: <span title="masked token">{visibility === "visible" ? tok : masked}</span>
      {showIat && <span className="badge">iat: {iat}</span>}
    </li>
  );
}

function JwtTokens({ stream, visibility }: SseViewProps): JSX.Element | null {
  const jwtEvents = stream.events.filter((e) => typeof e.data === "object" && e.data !== null && (e.data as { type?: string }).type === "resume_conversation_token");
  if (jwtEvents.length === 0) return null;
  return (
    <div style={{ margin: "10px 0" }}>
      <b>Resume tokens</b>
      <ul className="mono small" style={{ paddingLeft: 16 }}>
        {jwtEvents.map((e, i) => <TokenItem key={i} event={e} visibility={visibility} />)}
      </ul>
    </div>
  );
}

function EventRow({ event }: { event: SseEvent }): JSX.Element {
  return (
    <tr>
      <td>{event.event ?? <span className="small">(none)</span>}</td>
      <td>{typeof event.data === "string" ? <code>{event.data}</code> : <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(event.data, null, 2)}</pre>}</td>
    </tr>
  );
}

function EventTable({ stream }: { stream: Extract<UiStreamRow, { kind: "sse" }> }): JSX.Element {
  return (
    <table className="table mono">
      <thead>
        <tr>
          <th style={{ width: 140 }}>event</th>
          <th>data</th>
        </tr>
      </thead>
      <tbody>{stream.events.map((e, i) => <EventRow key={i} event={e} />)}</tbody>
    </table>
  );
}

export function SseView(props: SseViewProps): JSX.Element {
  return (
    <div>
      <h3>SSE Events</h3>
      <div className="small">{props.stream.url}</div>
      <JwtTokens {...props} />
      <EventTable stream={props.stream} />
    </div>
  );
}
