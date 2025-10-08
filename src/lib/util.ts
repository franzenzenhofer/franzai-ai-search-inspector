export interface JsonParseResult {
  success: boolean;
  value: unknown;
}

export function normalizeHeaderMap(headers: Record<string, string>): Record<string, string> {
  const lower: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) lower[key.toLowerCase()] = value;
  return lower;
}

export function tryParseJson(value: string): JsonParseResult {
  try {
    return { success: true, value: JSON.parse(value) };
  } catch {
    return { success: false, value: undefined };
  }
}

export function maskToken(token: string): string {
  if (token.length <= 12) return "•••";
  return `${token.slice(0, 6)}…${token.slice(-6)}`;
}
