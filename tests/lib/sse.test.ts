import { beforeEach, expect, it } from "vitest";
import { clearErrors, getErrors } from "@/errors/errorStore";
import { parseEventStream, summarize } from "@/lib/sse";

const DELTA_BODY = `event: delta_encoding
data: {"v":"v1"}

event: message
data: {"conversation_id":"c0","v":{"conversation_id":"c1","message":{"id":"m1","metadata":{"request_id":"r1","model_slug":"model"}}}}`;

const SUMMARY_BODY = `event: delta_encoding
data: {"v":"v1"}

event: message
data: {"conversation_id":"c0","request_id":"r0","message_id":"m0","model_slug":"m","v":{"conversation_id":"c1","message":{"id":"m1","metadata":{"request_id":"r1","model_slug":"m1"}}}}`;

const mustExist = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("Expected value");
  return value;
};

beforeEach(() => {
  clearErrors();
});

it("parseEventStream parses events and decodes JSON data", () => {
  const events = parseEventStream(DELTA_BODY);
  expect(events).toHaveLength(2);
  expect(mustExist(events.at(0)).data).toEqual({ v: "v1" });
  expect(mustExist(events.at(1)).rawBlock).toContain("conversation_id");
});

it("parseEventStream reports and rethrows errors", () => {
  expect(() => parseEventStream(123 as unknown as string)).toThrow();
  expect(mustExist(getErrors().at(0)).source).toBe("parser-sse");
});

it("parseEventStream returns an empty array for blank bodies", () => {
  expect(parseEventStream("   ")).toEqual([]);
});

it("parseEventStream parses array data", () => {
  const events = parseEventStream('data: [1,2]\n');
  expect(Array.isArray(mustExist(events.at(0)).data)).toBe(true);
});

it("parseEventStream keeps raw text when JSON parsing fails", () => {
  expect(mustExist(parseEventStream('data: {"broken"\n').at(0)).data).toBe('{"broken"');
});

it("summarize collects identifiers and delta encoding", () => {
  const summary = summarize(parseEventStream(SUMMARY_BODY));
  expect([...summary.conversationIds]).toEqual(["c0", "c1"]);
  expect([...summary.requestIds]).toEqual(["r0", "r1"]);
  expect([...summary.messageIds]).toEqual(["m0", "m1"]);
  expect([...summary.modelSlugs]).toEqual(["m", "m1"]);
  expect(summary.deltaEncoding).toBe("v1");
});

it("summarize uses nested delta encoding when available", () => {
  const body = ['event: delta_encoding', 'data: {"v":{"v":"v2"}}'].join("\n");
  expect(summarize(parseEventStream(body)).deltaEncoding).toBe("v2");
});

it("summarize ignores non-object data", () => {
  const summary = summarize(parseEventStream("event: ping\ndata: ok"));
  expect(summary.conversationIds.size).toBe(0);
  expect(summary.deltaEncoding).toBeUndefined();
});

it("summarize reports errors when summarization fails", () => {
  expect(() => summarize(null as unknown as [])).toThrow();
  expect(mustExist(getErrors().at(0)).source).toBe("parser-sse");
});
