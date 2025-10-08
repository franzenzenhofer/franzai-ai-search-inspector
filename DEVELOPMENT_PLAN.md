# Development Plan

1. Initialize project scaffold (npm init, Vite + CRXJS, manifest, configs) exactly as specified, wiring lint/test/coverage/duplication scripts so Husky enforces the definition of done from day one.
2. Implement TypeScript types in src/types.ts and the pure utility/parsing modules in src/lib/ (util, sse, jsonl, jwt), keeping every function ≤15 lines and adding Vitest suites in tests/lib/ that prove 100% branch coverage.
3. Build impure Chrome/storage effects in src/effects/ with effect prefix plus @impure JSDoc, wrapping every Chrome API call in lastError checks and reporting failures through the shared error reporter; add mocked Vitest suites in tests/effects/.
