import { describe, expect, it } from "vitest";
import { JsonParseResult, maskToken, normalizeHeaderMap, tryParseJson } from "@/lib/util";

describe("normalizeHeaderMap", () => {
  it("lower-cases header keys", () => {
    const mapped = normalizeHeaderMap({ "Content-Type": "text/event-stream" });
    expect(mapped).toEqual({ "content-type": "text/event-stream" });
  });
});

describe("tryParseJson", () => {
  const extract = (value: string): JsonParseResult => tryParseJson(value);

  it("returns parsed object for valid JSON", () => {
    const result = extract('{"a":1}');
    expect(result.success).toBe(true);
    expect(result.value).toEqual({ a: 1 });
  });

  it("returns failure result for invalid JSON", () => {
    expect(extract("not json").success).toBe(false);
  });
});

describe("maskToken", () => {
  it("masks long tokens with ellipsis", () => {
    expect(maskToken("abcdefghijklmnopqrstuvwxyz")).toBe("abcdef…uvwxyz");
  });

  it("returns placeholder for short tokens", () => {
    expect(maskToken("short")).toBe("•••");
  });
});
