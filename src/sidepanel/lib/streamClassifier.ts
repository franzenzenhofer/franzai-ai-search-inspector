import { parseEventStream, summarize } from "@/lib/sse";
import { parseJsonl } from "@/lib/jsonl";
import type { CapturedStream, UiStreamRow } from "@/types";

export function classifyStream(stream: CapturedStream): UiStreamRow {
  const sample = stream.body.slice(0, 200).toLowerCase();
  if (sample.includes("event:") || sample.includes("data:")) {
    const events = parseEventStream(stream.body);
    const parsed = { url: stream.url, contentType: "text/event-stream", events, summary: summarize(events) };
    return { kind: "sse", url: stream.url, events, parsed };
  }
  if (sample.startsWith("{") || sample.split("\n").some((l) => l.trim().startsWith("{"))) {
    return { kind: "jsonl", url: stream.url, parsed: parseJsonl(stream.url, stream.body) };
  }
  return { kind: "other", url: stream.url, note: "Unknown format" };
}

export function exportToJson(rows: UiStreamRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sse-capture.json";
  a.click();
  URL.revokeObjectURL(url);
}
