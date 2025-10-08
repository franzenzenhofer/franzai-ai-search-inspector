import { reportError } from "@/errors/errorReporter";
import type { SseEvent, SseEventData } from "@/types";
import { tryParseJson } from "./util";

type BlockBuilder = { event?: string; data: string[]; raw: string[] };
const createBuilder = (): BlockBuilder => ({ data: [], raw: [] });
const resetBuilder = (builder: BlockBuilder): void => { delete builder.event; builder.data.length = 0; builder.raw.length = 0; };
const parseData = (text: string): SseEventData => {
  const trimmed = text.trim();
  if (!trimmed) return text;
  const char = trimmed[0];
  if (char !== '{' && char !== '[' && char !== '"') return text;
  const result = tryParseJson(text);
  if (!result.success) return text;
  return result.value as SseEventData;
};
const buildBlock = (builder: BlockBuilder): SseEvent | undefined => {
  if (builder.raw.length === 0) return undefined;
  const event: SseEvent = { rawBlock: builder.raw.join("\n"), data: parseData(builder.data.join("\n")) };
  if (builder.event !== undefined) event.event = builder.event;
  return event;
};
const pushBlock = (builder: BlockBuilder, events: SseEvent[]): void => {
  const block = buildBlock(builder);
  if (block) events.push(block);
  resetBuilder(builder);
};
const processLine = (line: string, builder: BlockBuilder, events: SseEvent[]): void => {
  if (!line.trim()) {
    pushBlock(builder, events);
    return;
  }
  builder.raw.push(line);
  if (line.startsWith("event:")) builder.event = line.slice(6).trim();
  if (line.startsWith("data:")) builder.data.push(line.slice(5).trim());
};
export function parseEventStream(body: string): SseEvent[] {
  try {
    const events: SseEvent[] = [];
    const builder = createBuilder();
    for (const line of body.split(/\r?\n/)) processLine(line, builder, events);
    pushBlock(builder, events);
    return events;
  } catch (error) {
    reportError("parser-sse", error as Error, { bodyPreview: String(body).slice(0, 200) });
    throw error;
  }
}
