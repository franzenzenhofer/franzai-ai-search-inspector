export type ErrorSource =
  | "background-worker"
  | "background-handler"
  | "background-listener"
  | "stream-capture"
  | "parser-sse"
  | "parser-jsonl"
  | "parser-jwt"
  | "ui-component"
  | "chrome-api"
  | "network"
  | "storage"
  | "unknown";

export type ErrorSeverity = "error" | "warning" | "info";

export interface ErrorEntry {
  id: string;
  timestamp: number;
  source: ErrorSource;
  message: string;
  stack?: string;
  sourceFile?: string;
  sourceLine?: number;
  context?: Record<string, unknown>;
  severity: ErrorSeverity;
}
