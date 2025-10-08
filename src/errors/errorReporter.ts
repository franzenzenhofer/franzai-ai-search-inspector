import { addError } from "./errorStore";
import type { ErrorEntry, ErrorSource } from "./errorTypes";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildEntry(
  source: ErrorSource,
  error: Error,
  context?: Record<string, unknown>
): ErrorEntry {
  return {
    id: createId(),
    timestamp: Date.now(),
    source,
    message: error.message,
    severity: "error",
    ...(error.stack ? { stack: error.stack } : {}),
    ...(context ? { context } : {})
  };
}

/**
 * @impure Records an error in the shared error store.
 */
export function reportError(
  source: ErrorSource,
  error: Error,
  context?: Record<string, unknown>
): void {
  addError(buildEntry(source, error, context));
}
