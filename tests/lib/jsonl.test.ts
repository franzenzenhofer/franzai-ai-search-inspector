import { beforeEach, expect, it } from "vitest";
import { clearErrors, getErrors } from "@/errors/errorStore";
import { parseJsonl } from "@/lib/jsonl";

const mustExist = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("Expected value");
  return value;
};

beforeEach(() => {
  clearErrors();
});

it("parseJsonl returns parsed items for each non-empty line", () => {
  const body = ['{"a":1}', "  ", 'invalid', '{"b":2}'].join("\n");
  const parsed = parseJsonl("https://example.com", body);
  expect(parsed.url).toBe("https://example.com");
  expect(parsed.items).toHaveLength(3);
  const item0 = mustExist(parsed.items.at(0)).parsed as Record<string, unknown>;
  expect(item0.a).toBe(1);
  expect(item0.extracted).toBeDefined();
  expect(mustExist(parsed.items.at(1)).parsed).toBeUndefined();
  const item2 = mustExist(parsed.items.at(2)).parsed as Record<string, unknown>;
  expect(item2.b).toBe(2);
  expect(item2.extracted).toBeDefined();
});

it("parseJsonl reports and rethrows errors", () => {
  expect(() => parseJsonl("https://example.com", 123 as unknown as string)).toThrow();
  expect(mustExist(getErrors().at(0)).source).toBe("parser-jsonl");
});
