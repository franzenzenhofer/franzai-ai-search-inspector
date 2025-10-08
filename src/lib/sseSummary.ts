import { reportError } from "@/errors/errorReporter";
import type { ParsedStreamSummary, SseEvent } from "@/types";

const createSummary = (): ParsedStreamSummary => ({ conversationIds: new Set(), requestIds: new Set(), messageIds: new Set(), modelSlugs: new Set() });
const asRecord = (value: unknown): Record<string, unknown> | undefined => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined);
const addString = (set: Set<string>, value: unknown): void => { if (typeof value === "string") set.add(value); };
const addTopLevel = (summary: ParsedStreamSummary, data: Record<string, unknown>): void => {
  ([
    [summary.conversationIds, data.conversation_id],
    [summary.requestIds, data.request_id],
    [summary.messageIds, data.message_id],
    [summary.modelSlugs, data.model_slug]
  ] as Array<[Set<string>, unknown]>).forEach(([set, value]) => addString(set, value));
};
const addNested = (summary: ParsedStreamSummary, data: Record<string, unknown>): Record<string, unknown> | undefined => {
  const nested = asRecord(data.v);
  if (!nested) return undefined;
  addString(summary.conversationIds, nested.conversation_id);
  const message = asRecord(nested.message);
  if (message) {
    addString(summary.messageIds, message.id);
    const meta = asRecord(message.metadata);
    if (meta) {
      addString(summary.requestIds, meta.request_id);
      addString(summary.modelSlugs, meta.model_slug);
    }
  }
  return nested;
};
const updateSummary = (summary: ParsedStreamSummary, event: SseEvent): void => {
  const data = asRecord(event.data);
  if (!data) return;
  addTopLevel(summary, data);
  const nested = addNested(summary, data);
  const candidate = typeof nested?.v === "string" ? nested?.v : data.v;
  if (event.event === "delta_encoding" && typeof candidate === "string") summary.deltaEncoding = candidate;
};
export function summarize(events: SseEvent[]): ParsedStreamSummary {
  try {
    const summary = createSummary();
    events.forEach((event) => updateSummary(summary, event));
    return summary;
  } catch (error) {
    reportError("parser-sse", error as Error, { reason: "summarize" });
    throw error;
  }
}
