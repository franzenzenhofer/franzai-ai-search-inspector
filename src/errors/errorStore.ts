import type { ErrorEntry } from "./errorTypes";

type Listener = (entries: ErrorEntry[]) => void;

const entries: ErrorEntry[] = [];
const listeners = new Set<Listener>();

function notify(): void {
  const copy = entries.slice();
  listeners.forEach((listener) => listener(copy));
}

export function addError(entry: ErrorEntry): void {
  entries.push(entry);
  notify();
}

export function clearErrors(): void {
  entries.length = 0;
  notify();
}

export function getErrors(): ErrorEntry[] {
  return entries.slice();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(entries.slice());
  return () => {
    listeners.delete(listener);
  };
}
