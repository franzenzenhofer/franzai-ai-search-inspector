import { beforeEach, expect, it } from "vitest";
import { addError, clearErrors, getErrors, subscribe } from "@/errors/errorStore";
import type { ErrorEntry } from "@/errors/errorTypes";

const makeEntry = (overrides: Partial<ErrorEntry> = {}): ErrorEntry => ({
  id: "id",
  timestamp: 0,
  source: "parser-sse",
  message: "msg",
  severity: "error",
  ...overrides
});

beforeEach(() => {
  clearErrors();
});

it("adds errors and notifies subscribers", () => {
  const received: ErrorEntry[][] = [];
  const unsubscribe = subscribe((errors) => received.push(errors));
  addError(makeEntry({ id: "one" }));
  expect(getErrors()).toHaveLength(1);
  expect(received.at(-1)?.[0]?.id).toBe("one");
  unsubscribe();
});

it("clears errors and notifies subscribers", () => {
  addError(makeEntry({ id: "one" }));
  let latest: ErrorEntry[] | undefined;
  const unsubscribe = subscribe((errors) => (latest = errors));
  clearErrors();
  expect(latest).toEqual([]);
  unsubscribe();
});
