import { reportError } from "@/errors/errorReporter";
import type { ParsedJsonl, JsonlItem } from "@/types";
import { tryParseJson } from "./util";
import { extractSearchData } from "./searchExtract";

function enrichItem(line: string): JsonlItem {
  const result = tryParseJson(line);
  const parsed = result.success ? result.value : undefined;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { line, parsed: undefined };
  }
  const enriched = { ...parsed, extracted: extractSearchData(parsed) };
  return { line, parsed: enriched };
}

export function parseJsonl(url: string, body: string): ParsedJsonl {
  try {
    const lines = body.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const items = lines.map(enrichItem);
    return { url, items };
  } catch (error) {
    reportError("parser-jsonl", error as Error, { url });
    throw error;
  }
}
