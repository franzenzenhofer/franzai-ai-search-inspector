function recurseFind(current: unknown, key: string, results: unknown[]): void {
  if (!current || typeof current !== "object") return;
  const curr = current as Record<string, unknown>;
  if (Array.isArray(curr[key])) {
    results.push(...(curr[key] as unknown[]));
  } else if (curr[key] !== undefined) {
    results.push(curr[key]);
  }
  Object.values(curr).forEach((v) => recurseFind(v, key, results));
}

export function deepFind(obj: unknown, key: string): unknown[] {
  const results: unknown[] = [];
  recurseFind(obj, key, results);
  return results;
}
