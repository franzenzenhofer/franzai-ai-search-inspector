export interface RawCapture {
  requestId: string;
  url: string;
  status: number;
  mimeType: string;
  headers: Record<string, string>;
  startedAt?: number;
  finishedAt?: number;
  body: string;
}

export type SseEventData =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export interface SseEvent {
  event?: string;
  data?: SseEventData;
  rawBlock: string;
}

export interface ParsedStreamSummary {
  conversationIds: Set<string>;
  requestIds: Set<string>;
  messageIds: Set<string>;
  modelSlugs: Set<string>;
  deltaEncoding?: string;
}

export interface ParsedStream {
  url: string;
  contentType: string;
  events: SseEvent[];
  summary: ParsedStreamSummary;
}

export interface JsonlItem {
  line: string;
  parsed?: (Record<string, unknown> & { extracted?: import("@/lib/searchExtract").ExtractedData | undefined }) | undefined;
}

export interface ParsedJsonl {
  url: string;
  items: JsonlItem[];
}

export type UiStreamRow =
  | { kind: "sse"; url: string; events: SseEvent[]; parsed: ParsedStream }
  | { kind: "jsonl"; url: string; parsed: ParsedJsonl }
  | { kind: "other"; url: string; note: string };

export type SecretVisibility = "masked" | "visible";

export interface CapturedStream {
  timestamp: number;
  url: string;
  requestId: string;
  body: string;
}
