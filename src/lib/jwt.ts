import { reportError } from "@/errors/errorReporter";
import { maskToken } from "./util";

type BufferLike = { from: (input: string, encoding: string) => { toString: (encoding: string) => string } };
const decoder = new TextDecoder();
const decodeBinary = (binary: string): string => {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return decoder.decode(bytes);
};
const decodeBase64 = (value: string): string => {
  if (typeof globalThis.atob === "function") return globalThis.atob(value);
  const buffer = (globalThis as { Buffer?: BufferLike }).Buffer;
  if (buffer) return buffer.from(value, "base64").toString("binary");
  throw new Error("No base64 decoder available");
};
const decodeSegment = (segment: string): unknown => {
  const pad = (4 - (segment.length % 4)) % 4;
  const base64 = (segment + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(decodeBinary(decodeBase64(base64)));
};
export function decodeJwtClaims(token: string): { masked: string; header?: unknown; claims?: unknown } {
  try {
    const masked = maskToken(token);
    const parts = token.split(".");
    if (parts.length < 2) return { masked };
    const headerPart = parts[0];
    const claimsPart = parts[1];
    if (!headerPart || !claimsPart) return { masked };
    return { masked, header: decodeSegment(headerPart), claims: decodeSegment(claimsPart) };
  } catch (error) {
    reportError("parser-jwt", error as Error, { tokenPreview: maskToken(token) });
    throw error;
  }
}
