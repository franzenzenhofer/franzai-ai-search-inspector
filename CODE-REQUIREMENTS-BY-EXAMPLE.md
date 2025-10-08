# CODE REQUIREMENTS BY EXAMPLE

All code patterns, examples, and anti-patterns for the Chrome SSE Inspector Extension.

**Referenced by**: CLAUDE.md

---

## Table of Contents

1. [Pure vs Impure Functions](#pure-vs-impure-functions)
2. [Error Handling Patterns](#error-handling-patterns)
3. [Type Safety Patterns](#type-safety-patterns)
4. [Chrome Extension Patterns](#chrome-extension-patterns)
5. [Testing Patterns](#testing-patterns)
6. [DRY Code Patterns](#dry-code-patterns)

---

## Pure vs Impure Functions

### Pure Function Pattern (Default)

**Location**: `src/lib/`

```typescript
// ✅ GOOD - Pure function in src/lib/sse.ts
export function parseEventStream(body: string): SseEvent[] {
  const lines = body.split(/\r?\n/);
  return lines.filter(line => line.trim().startsWith('data:'));
}

// ✅ GOOD - Pure function with no side effects
export function maskToken(token: string): string {
  if (token.length <= 12) return '•••';
  return token.slice(0, 6) + '…' + token.slice(-6);
}

// ✅ GOOD - Pure function with type guard
export function isString(data: unknown): data is string {
  return typeof data === 'string';
}
```

### Impure Function Pattern (Exception)

**Location**: `src/effects/`

```typescript
// ✅ GOOD - Impure function in src/effects/chrome.ts
/**
 * @impure Sends message to Chrome runtime (side effect)
 */
export function effectSendMessage(tabId: number, payload: unknown): void {
  chrome.runtime.sendMessage({ tabId, payload });
}

// ✅ GOOD - Impure function with error handling
/**
 * @impure Attaches Chrome debugger (side effect)
 */
export function effectAttachDebugger(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        const error = new Error(chrome.runtime.lastError.message);
        reportError('chrome-api', error, { tabId, api: 'chrome.debugger.attach' });
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
```

### Anti-Patterns

```typescript
// ❌ BAD - Impure function without effect prefix
export function sendMessage(tabId: number, payload: unknown): void {
  chrome.runtime.sendMessage({ tabId, payload });
}

// ❌ BAD - Side effect in pure function
export function parseAndLog(body: string): SseEvent[] {
  console.log('Parsing...'); // ❌ SIDE EFFECT
  return parseEventStream(body);
}

// ❌ BAD - Pure and impure functions in same file
export function parseData(data: string): object {
  return JSON.parse(data); // Pure
}
export function saveData(data: object): void {
  chrome.storage.local.set({ data }); // Impure - WRONG FILE
}
```

---

## Error Handling Patterns

### Pure Function Error Handling

```typescript
// ✅ GOOD - Error handling in pure function
import { reportError } from '@/errors/errorReporter';

export function parseEventStream(body: string): SseEvent[] {
  try {
    if (!body.trim()) {
      throw new Error('Empty SSE body');
    }
    return parseEvents(body);
  } catch (error) {
    reportError('parser-sse', error as Error, { body: body.slice(0, 100) });
    throw error; // Re-throw after reporting
  }
}
```

### Impure Function Error Handling

```typescript
// ✅ GOOD - Chrome API error handling
/**
 * @impure Attaches Chrome debugger
 */
export function effectAttachDebugger(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        const error = new Error(chrome.runtime.lastError.message);
        reportError('chrome-api', error, { tabId, api: 'chrome.debugger.attach' });
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
```

### React Component Error Handling

```typescript
// ✅ GOOD - Error handling in React component
import { reportError } from '@/errors/errorReporter';
import { ErrorMonitor } from '@/errors/ErrorMonitor';

function App() {
  const handleCapture = () => {
    try {
      // Capture logic
      startCaptureProcess();
    } catch (error) {
      reportError('ui-component', error as Error, {
        component: 'App',
        action: 'capture'
      });
    }
  };

  return (
    <div>
      {/* Main UI */}
      <button onClick={handleCapture}>Start</button>
      <ErrorMonitor /> {/* Always visible at bottom */}
    </div>
  );
}
```

### Background Worker Error Handling

```typescript
// ✅ GOOD - Background worker error handling
import { reportError } from '@/errors/errorReporter';

chrome.debugger.onEvent.addListener((source, method, params) => {
  try {
    // Handle event
    processNetworkEvent(method, params);
  } catch (error) {
    reportError('background-worker', error as Error, { method, params });
  }
});
```

### Global Error Reporter Setup

```typescript
// ✅ GOOD - Global error reporter initialization
// src/errors/errorReporter.ts

/**
 * @impure Global error reporter - catches all errors
 */
export function effectInitializeErrorReporter(): void {
  // Catch global errors
  window.onerror = (message, source, lineno, colno, error) => {
    errorStore.addError({
      source: 'unknown',
      sourceFile: source,
      sourceLine: lineno,
      message: String(message),
      stack: error?.stack,
      severity: 'error'
    });
  };

  // Catch unhandled promise rejections
  window.onunhandledrejection = (event) => {
    errorStore.addError({
      source: 'unknown',
      message: String(event.reason),
      stack: event.reason?.stack,
      severity: 'error'
    });
  };
}
```

### Error Handling Anti-Patterns

```typescript
// ❌ BAD - Silent failure
try {
  parse(data);
} catch {
  return null; // Error swallowed!
}

// ❌ BAD - No context provided
try {
  parseData(input);
} catch (error) {
  reportError('parser-sse', error as Error); // No context!
  throw error;
}

// ❌ BAD - Not re-throwing after reporting
try {
  risky();
} catch (error) {
  reportError('ui-component', error as Error, { });
  // ❌ Should re-throw!
}

// ❌ BAD - Not checking chrome.runtime.lastError
chrome.debugger.attach({ tabId }, '1.3', () => {
  // ❌ Should check chrome.runtime.lastError!
  chrome.debugger.sendCommand(...);
});
```

---

## Type Safety Patterns

### Type Guards

```typescript
// ✅ GOOD - Type guard with assertion
export function assertObject(data: unknown): asserts data is object {
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('Expected object');
  }
}

// ✅ GOOD - Type guard predicate
export function isString(data: unknown): data is string {
  return typeof data === 'string';
}

// ✅ GOOD - Using type guards
export function process(data: unknown): string {
  if (!isString(data)) {
    throw new TypeError('Expected string');
  }
  return data; // TypeScript knows data is string
}
```

### Explicit Return Types

```typescript
// ✅ GOOD - Explicit return type
export function parseEventStream(body: string): SseEvent[] {
  // Implementation
}

// ✅ GOOD - Explicit return type with generic
export function tryParseJson<T>(s: string): T | undefined {
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}
```

### Type Safety Anti-Patterns

```typescript
// ❌ BAD - Runtime check instead of type guard
function process(data: unknown): string {
  if (typeof data === 'string') return data;
  throw new Error('Not a string');
}

// ❌ BAD - Using `any`
function parse(data: any): object {
  return data;
}

// ❌ BAD - Non-null assertion without guard
function getFirstItem(arr: string[] | undefined): string {
  return arr![0]; // ❌ Dangerous!
}

// ❌ BAD - Type assertion without validation
function convert(data: unknown): SseEvent {
  return data as SseEvent; // ❌ No validation!
}
```

---

## Chrome Extension Patterns

### 1. Manifest V3 Service Worker

```typescript
// ✅ GOOD - Service worker with state persistence
const sessions = new Map<number, Session>();

// Save state before termination
function saveState(): void {
  chrome.storage.session.set({
    sessions: Array.from(sessions.entries())
  });
}

// Restore state on startup
chrome.runtime.onStartup.addListener(async () => {
  const { sessions: savedSessions } = await chrome.storage.session.get('sessions');
  if (savedSessions) {
    sessions.clear();
    savedSessions.forEach(([key, value]: [number, Session]) => {
      sessions.set(key, value);
    });
  }
});
```

### 2. Message Passing

```typescript
// ✅ GOOD - Typed message passing
// src/types.ts
export type Message =
  | { type: 'startCapture'; tabId: number }
  | { type: 'stopCapture'; tabId: number }
  | { type: 'captureData'; data: RawCapture };

// Background worker
chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  if (msg.type === 'startCapture') {
    handleStartCapture(msg.tabId);
    sendResponse({ ok: true });
  }
  return true; // Keep channel open for async response
});

// Side panel
chrome.runtime.sendMessage({
  type: 'startCapture',
  tabId: 123
});
```

### 3. Chrome API Error Checking

```typescript
// ✅ GOOD - Always check lastError
chrome.debugger.attach({ tabId }, '1.3', () => {
  if (chrome.runtime.lastError) {
    reportError('chrome-api', new Error(chrome.runtime.lastError.message));
    return;
  }
  // Proceed only if no error
  chrome.debugger.sendCommand({ tabId }, 'Network.enable');
});

// ✅ GOOD - Promise wrapper with error checking
function chromeStorageGet(key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result[key]);
      }
    });
  });
}
```

### 4. Resource Cleanup

```typescript
// ✅ GOOD - React cleanup pattern
useEffect(() => {
  const handleMessage = (msg: Message) => {
    // Handle message
  };

  chrome.runtime.onMessage.addListener(handleMessage);

  return () => {
    chrome.runtime.onMessage.removeListener(handleMessage);
  };
}, []);

// ✅ GOOD - Debugger cleanup
async function stopCapture(tabId: number): Promise<void> {
  try {
    await chrome.debugger.detach({ tabId });
  } catch {
    // Already detached - ignore
  }
}
```

### 5. CDP (Chrome DevTools Protocol) Patterns

```typescript
// ✅ GOOD - Set buffer size limit
chrome.debugger.sendCommand(
  { tabId },
  'Network.enable',
  { maxTotalBufferSize: 52428800 } // 50MB
);

// ✅ GOOD - Check if already attached
chrome.debugger.getTargets((targets) => {
  const attached = targets.find(t => t.tabId === tabId && t.attached);
  if (attached) {
    // Already attached - don't re-attach
    return;
  }
  chrome.debugger.attach({ tabId }, '1.3');
});
```

### 6. Extension Update Handling

```typescript
// ✅ GOOD - Handle extension updates
chrome.runtime.onUpdateAvailable.addListener((details) => {
  // Save state before reload
  chrome.storage.local.set({
    pendingUpdate: true,
    savedState: getCurrentState()
  });

  // Reload extension
  chrome.runtime.reload();
});

// ✅ GOOD - Restore after update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'update') {
    const { savedState } = await chrome.storage.local.get('savedState');
    if (savedState) {
      restoreState(savedState);
      chrome.storage.local.remove('savedState');
    }
  }
});
```

### Chrome Extension Anti-Patterns

```typescript
// ❌ BAD - Assumes service worker stays alive
const sessions = new Map(); // Lost on termination!

// ❌ BAD - No error check
chrome.debugger.attach({ tabId }, '1.3', () => {
  chrome.debugger.sendCommand(...); // Might fail!
});

// ❌ BAD - No cleanup
useEffect(() => {
  chrome.runtime.onMessage.addListener(handleMessage);
  // ❌ Missing return for cleanup
}, []);

// ❌ BAD - Broad permissions
{
  "permissions": ["<all_urls>", "webRequest", "webRequestBlocking"]
}
```

---

## Testing Patterns

### Pure Function Tests

```typescript
// ✅ GOOD - Pure function test
import { describe, it, expect } from 'vitest';
import { parseEventStream, summarize } from '../src/lib/sse';

describe('SSE parser', () => {
  it('parses blocks and summarizes known fields', () => {
    const sample = `event: delta_encoding
data: "v1"

data: {"message": {"id": "abc123"}}
`;

    const events = parseEventStream(sample);
    expect(events.length).toBe(2);
    expect(events[0].event).toBe('delta_encoding');

    const summary = summarize(events);
    expect([...summary.messageIds]).toContain('abc123');
  });

  it('handles empty input', () => {
    expect(parseEventStream('')).toEqual([]);
  });

  it('handles malformed SSE', () => {
    expect(() => parseEventStream('invalid')).toThrow();
  });
});
```

### Impure Function Tests (with Mocking)

```typescript
// ✅ GOOD - Impure function test with mocking
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { effectSendMessage } from '../src/effects/chrome';

// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn()
  }
} as any;

describe('effectSendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends message via chrome.runtime', () => {
    effectSendMessage(123, { test: 'data' });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      tabId: 123,
      payload: { test: 'data' }
    });
  });
});
```

### React Component Tests

```typescript
// ✅ GOOD - React component test
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Controls } from '../src/sidepanel/components/Controls';

describe('Controls', () => {
  it('calls onStart when Start button clicked', () => {
    const onStart = vi.fn();
    render(<Controls onStart={onStart} onStop={vi.fn()} />);

    fireEvent.click(screen.getByText('Start capture'));

    expect(onStart).toHaveBeenCalledOnce();
  });
});
```

---

## DRY Code Patterns

### Extract Duplicated Validation

```typescript
// ❌ BAD - Duplicated validation
// File A
if (typeof data !== 'object' || data === null) {
  throw new Error('Invalid');
}

// File B
if (typeof data !== 'object' || data === null) {
  throw new Error('Invalid');
}

// ✅ GOOD - Shared validation
// src/lib/validate.ts
export function assertObject(data: unknown): asserts data is object {
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('Expected object');
  }
}

// File A
assertObject(data);

// File B
assertObject(data);
```

### Extract Duplicated Logic

```typescript
// ❌ BAD - Duplicated error handling
try {
  parseSSE(body);
} catch (error) {
  reportError('parser-sse', error as Error, { body });
  throw error;
}

try {
  parseJSONL(body);
} catch (error) {
  reportError('parser-jsonl', error as Error, { body });
  throw error;
}

// ✅ GOOD - Extracted error wrapper
function withErrorReporting<T>(
  fn: () => T,
  source: ErrorSource,
  context: Record<string, unknown>
): T {
  try {
    return fn();
  } catch (error) {
    reportError(source, error as Error, context);
    throw error;
  }
}

// Usage
withErrorReporting(() => parseSSE(body), 'parser-sse', { body });
withErrorReporting(() => parseJSONL(body), 'parser-jsonl', { body });
```

---

## Configuration Examples

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "types": ["chrome", "vite/client", "vitest/globals"]
  }
}
```

### .eslintrc.cjs

```javascript
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json"
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/strict",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "max-lines": ["error", { "max": 75 }],
    "max-lines-per-function": ["error", { "max": 15 }],
    "complexity": ["error", 10],
    "max-depth": ["error", 3]
  },
  ignorePatterns: ["dist/**", "*.config.ts"]
};
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
      exclude: ['**/*.config.ts', '**/dist/**', '**/tests/**']
    }
  }
});
```

### .jscpd.json (Duplication Check)

```json
{
  "threshold": 5,
  "reporters": ["console"],
  "ignore": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/dist/**",
    "**/node_modules/**"
  ],
  "format": ["typescript", "tsx"]
}
```

---

**Last Updated**: 2025-10-08
