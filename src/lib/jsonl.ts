import { reportError } from "@/errors/errorReporter";
import type { ParsedJsonl } from "@/types";
import { tryParseJson } from "./util";

export function parseJsonl(url: string, body: string): ParsedJsonl {
  try {
    const lines = body.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const items = lines.map((line) => {
      const result = tryParseJson(line);
      return { line, parsed: result.success ? result.value : undefined };
    });
    return { url, items };
  } catch (error) {
    reportError("parser-jsonl", error as Error, { url });
    throw error;
  }
}
