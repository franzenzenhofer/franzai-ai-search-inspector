import { beforeEach, expect, it } from "vitest";
import { clearErrors, getErrors } from "@/errors/errorStore";
import { reportError } from "@/errors/errorReporter";
beforeEach(() => clearErrors());
it("reports error with stack and context", () => {
  const err = new Error("test");
  reportError("parser-sse", err, { key: "value" });
  const errors = getErrors();
  expect(errors).toHaveLength(1);
  const first = errors[0];
  expect(first).toBeDefined();
  expect(first?.message).toBe("test");
  expect(first?.stack).toBeDefined();
  expect(first?.context).toEqual({ key: "value" });
});
it("reports error without stack", () => {
  const err = new Error("no stack");
  delete err.stack;
  reportError("parser-sse", err);
  const errors = getErrors();
  expect(errors).toHaveLength(1);
  const first = errors[0];
  expect(first).toBeDefined();
  expect(first?.stack).toBeUndefined();
  expect(first?.context).toBeUndefined();
});
it("reports error with stack no context", () => {
  const err = new Error("stack only");
  reportError("parser-jsonl", err);
  const errors = getErrors();
  expect(errors).toHaveLength(1);
  const first = errors[0];
  expect(first).toBeDefined();
  expect(first?.stack).toBeDefined();
  expect(first?.context).toBeUndefined();
});
it("reports error with context no stack", () => {
  const err = new Error("context only");
  delete err.stack;
  reportError("parser-jwt", err, { test: true });
  const errors = getErrors();
  expect(errors).toHaveLength(1);
  const first = errors[0];
  expect(first).toBeDefined();
  expect(first?.stack).toBeUndefined();
  expect(first?.context).toEqual({ test: true });
});
