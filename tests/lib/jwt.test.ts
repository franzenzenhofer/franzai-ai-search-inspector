import { beforeEach, expect, it } from "vitest";
import { clearErrors, getErrors } from "@/errors/errorStore";
import { decodeJwtClaims } from "@/lib/jwt";
declare const Buffer: {
  from: (input: string, encoding: string) => { toString: (encoding: string) => string };
};
type AtobHolder = { atob?: (value: string) => string };
interface BufferHolder {
  Buffer?: {
    from: (input: string, encoding: string) => { toString: (encoding: string) => string };
  };
}
type GlobalDecoders = AtobHolder & BufferHolder;
const toBase64Url = (value: string): string =>
  Buffer.from(value, "utf8").toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const mustExist = <T>(value: T | undefined): T => {
  if (value === undefined) throw new Error("Expected value");
  return value;
};
beforeEach(() => {
  clearErrors();
});
const createToken = (claims: Record<string, unknown>): string =>
  `${toBase64Url('{"alg":"HS256","typ":"JWT"}')}.${toBase64Url(JSON.stringify(claims))}.sig`;
it("decodes header and claims while masking token", () => {
  const token = createToken({ sub: "abc", exp: 123 });
  const result = decodeJwtClaims(token);
  expect(result.masked.startsWith(token.slice(0, 6))).toBe(true);
  expect(result.masked.endsWith(token.slice(-6))).toBe(true);
  expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
  expect(result.claims).toEqual({ sub: "abc", exp: 123 });
});
it("reports errors when segments fail to decode", () => {
  expect(() => decodeJwtClaims("bad.bad")).toThrow();
  expect(mustExist(getErrors().at(0)).source).toBe("parser-jwt");
});
it("handles tokens without claims", () => {
  expect(decodeJwtClaims("short")).toEqual({ masked: "•••" });
});
it("falls back to Buffer when atob is absent", () => {
  const holder = globalThis as unknown as GlobalDecoders;
  const originalAtob = holder.atob;
  delete holder.atob;
  expect(decodeJwtClaims(createToken({ sub: "fallback" })).claims).toEqual({ sub: "fallback" });
  if (originalAtob) holder.atob = originalAtob;
  else delete holder.atob;
});
it("throws when no base64 decoder is available", () => {
  const holder = globalThis as unknown as GlobalDecoders;
  const originalAtob = holder.atob;
  const originalBuffer = holder.Buffer;
  const token = createToken({ sub: "fallback" });
  delete holder.atob;
  delete holder.Buffer;
  expect(() => decodeJwtClaims(token)).toThrow("No base64 decoder available");
  if (originalAtob) holder.atob = originalAtob;
  else delete holder.atob;
  if (originalBuffer) holder.Buffer = originalBuffer;
  else delete holder.Buffer;
});
it("returns masked result when segments are empty", () => {
  const token = toBase64Url('{"alg":"HS256","typ":"JWT"}') + '.';
  const result = decodeJwtClaims(token);
  expect(result.header).toBeUndefined();
  expect(result.claims).toBeUndefined();
});
