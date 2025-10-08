const knownFields = new Set([
  "url", "title", "snippet", "thumbnail", "authority",
  "favicon", "published_date", "last_updated", "author",
  "domain", "rank", "score", "entries"
]);

export function extractMetadata(e: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(e).filter(([k]) => !knownFields.has(k)));
}

export function getString(e: Record<string, unknown>, k: string): string | undefined {
  const v = e[k];
  return typeof v === "string" ? v : undefined;
}

export function getNumber(e: Record<string, unknown>, k: string): number | undefined {
  const v = e[k];
  return typeof v === "number" ? v : undefined;
}
