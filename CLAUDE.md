# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Chrome Side Panel Extension** for inspecting Server-Sent Events (SSE) and JSON Lines (JSONL) network traffic from ChatGPT and similar streaming services.

**Core Architecture Philosophy**: Only real data. No mocks, no fallbacks, no dummy data. Fail fast, loud, and early.

**Tech Stack**: TypeScript + React + Vite + CRXJS (Manifest V3)

---

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run dev          # Vite dev server with HMR
npm run build        # Production build to dist/
```

### Quality Gates (all must pass before commit)
```bash
npm run typecheck    # TypeScript strict mode (0 errors)
npm run lint         # ESLint strict (0 warnings)
npm run test         # Vitest with 100% coverage
npm run validate     # Run all checks: lint + typecheck + test
```

### Testing
```bash
npm run test         # Run all tests with coverage report
npm run test:watch   # Watch mode with live coverage
npm run test:ui      # Vitest UI for debugging tests
```

### Code Quality
```bash
npm run lint         # Check linting (0 warnings allowed)
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Load Extension in Chrome
1. `npm run build` → creates `dist/` folder
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `dist/` folder

---

## Architecture

### High-Level Data Flow

```
Chrome Tab (ChatGPT)
    ↓ Network Request
chrome.debugger (CDP)
    ↓ Response Body Capture
background.ts (Service Worker)
    ↓ Filter & Forward
Side Panel UI (React)
    ↓ Parse
lib/sse.ts | lib/jsonl.ts | lib/jwt.ts
    ↓ Render
Components (StreamTable, EventDetails)
```

### Key Architectural Decisions

**1. Chrome Debugger Protocol (CDP) for Network Capture**
- Uses `chrome.debugger` API to attach to the active tab
- Captures complete response bodies including SSE streams
- Only way in MV3 to reliably get streaming response bodies
- Scoped to single tab, requires user permission

**2. Background Service Worker Pattern**
- `src/background.ts` handles all CDP communication
- Captures `Network.responseReceived` and `Network.loadingFinished` events
- Filters for URLs matching: `/backend-api/conversation`, `process_upload_stream`, etc.
- Forwards captured data to side panel via `chrome.runtime.sendMessage`

**3. Parser Isolation**
- Each parser (`sse.ts`, `jsonl.ts`, `jwt.ts`) is pure, stateless
- Parsers only extract data that explicitly exists in responses
- No inference, no enrichment, no external calls
- All parsers have 100% test coverage

**4. Security-First Secrets Handling**
- JWT tokens are **masked by default** (e.g., `abc123...xyz789`)
- Only decoded **claims** are shown (iat, exp, conduit_uuid, etc.)
- Full token visible only when user toggles "Show secrets"
- Implemented in `lib/jwt.ts` + `SecretToggle.tsx`

**5. Centralized Error Handling - SINGLE SOURCE OF TRUTH**
- **ALL errors** from all sources flow to `src/errors/ErrorMonitor.tsx`
- Error monitor displays in UI (side panel footer)
- Errors are **viewable and copyable** (full stack trace)
- Each error shows **source context** (background worker, parser, UI, Chrome API)
- Error sources: TypeScript errors, runtime errors, Chrome API errors, parser errors, network errors
- Implementation: `src/errors/` directory with error aggregation

---

## Code Organization

### Directory Structure
```
src/
├── background.ts              # MV3 service worker - CDP network capture (IMPURE)
├── types.ts                   # Shared TypeScript types (types only, no functions)
├── lib/                       # ⭐ PURE FUNCTIONS ONLY - NO SIDE EFFECTS
│   ├── sse.ts                 # SSE parser: event/data blocks (PURE)
│   ├── jsonl.ts               # JSON Lines parser (PURE)
│   ├── jwt.ts                 # JWT claims decoder (PURE)
│   └── util.ts                # Small helpers (PURE)
├── effects/                   # ⚠️ IMPURE FUNCTIONS ONLY - ALL SIDE EFFECTS
│   ├── chrome.ts              # Chrome API calls (effectSendMessage, effectAttachDebugger)
│   └── storage.ts             # Storage operations (effectSaveToStorage, effectLoadFromStorage)
├── errors/                    # 🚨 CENTRALIZED ERROR HANDLING
│   ├── ErrorMonitor.tsx       # Error display component (UI footer)
│   ├── errorStore.ts          # Error aggregation store (all errors flow here)
│   ├── errorTypes.ts          # Error type definitions with source context
│   └── errorReporter.ts       # Global error reporter (catches all errors)
├── sidepanel/                 # React UI (impure by nature)
│   ├── index.html
│   ├── main.tsx               # React root
│   ├── App.tsx                # Main app component
│   └── components/
│       ├── Controls.tsx       # Start/Stop/Clear/Export buttons (≤75 lines)
│       ├── StreamTable.tsx    # List of captured requests (≤75 lines)
│       ├── EventDetails.tsx   # Detailed view of selected request (≤75 lines)
│       └── SecretToggle.tsx   # Show/hide secrets toggle (≤75 lines)
└── styles.css                 # Global styles

tests/
├── sse.test.ts                # SSE parser tests (100% coverage)
├── jwt.test.ts                # JWT decoder tests (100% coverage)
├── jsonl.test.ts              # JSONL parser tests (100% coverage)
├── errors/
│   ├── errorStore.test.ts     # Error store tests (100% coverage)
│   └── errorReporter.test.ts  # Error reporter tests (100% coverage)
└── effects/
    ├── chrome.test.ts         # Chrome effects tests (mocked)
    └── storage.test.ts        # Storage effects tests (mocked)
```

**Directory Rules**:
- `src/lib/` → **ONLY pure functions** → No Chrome APIs, no DOM, no I/O
- `src/effects/` → **ONLY impure functions** → All side effects go here
- `src/errors/` → **ALL error handling** → Single source of truth for errors
- `src/types.ts` → **ONLY types** → No functions, no logic
- `src/sidepanel/components/` → **React components** → Max 75 lines each
- `tests/` → **Mirrors src/ structure** → Every file has corresponding test

### Module Responsibilities

**background.ts**
- Listens for `startCapture` / `stopCapture` messages from UI
- Attaches/detaches `chrome.debugger` to active tab
- Monitors `Network.*` CDP events
- Filters requests matching target URL patterns
- Fetches response bodies via `Network.getResponseBody`
- Sends captured data to side panel

**lib/sse.ts**
- `parseEventStream(body: string): SseEvent[]` - Parses SSE format
- `summarize(events: SseEvent[])` - Extracts conversation_id, message_id, model_slug, etc.
- Handles multi-line `data:` fields (spec allows concatenation with `\n`)
- Auto-detects JSON in data fields

**lib/jsonl.ts**
- `parseJsonl(url: string, body: string): ParsedJsonl` - Parses newline-delimited JSON
- Used for `process_upload_stream` responses

**lib/jwt.ts**
- `decodeJwtClaims(token: string)` - Decodes JWT header and claims
- Returns `{ masked: string, header?: unknown, claims?: JwtClaims }`
- Base64url decoder handles padding

**App.tsx**
- Manages capture state and row data
- Listens for messages from background worker
- Routes captured responses to correct parser based on content-type
- Handles row selection for detail view

---

## HARDCORE CONSTRAINTS - NON-NEGOTIABLE

### ⚠️ IMMEDIATE FIX POLICY
**STOP WORK IMMEDIATELY** when any of these occur:
- TypeScript error appears → **FIX NOW** before continuing
- ESLint warning appears → **FIX NOW** before continuing
- Test fails → **FIX NOW** before continuing
- Coverage drops below 100% → **FIX NOW** before continuing

**NO EXCEPTIONS. NO DELAYS. NO "I'll fix it later".**

### 75-Line File Limit - ABSOLUTE MAXIMUM
Every TypeScript/TSX file MUST be ≤75 lines including imports and blank lines.

**Enforcement**: ESLint rule `max-lines: ["error", {"max": 75}]`

**Strategy**:
- Functions ≤15 lines each (HARD LIMIT)
- Extract to new module when approaching limit
- Split components into sub-components
- **ZERO exceptions** for source code files

**File exceeds 75 lines = BUILD FAILS = COMMIT BLOCKED**

### 100% Test Coverage - NO FUNCTION UNTESTED
Every function must have unit tests with 100% coverage (branches, functions, lines, statements).

**Enforcement**: Vitest coverage thresholds in `vitest.config.ts`
```typescript
coverage: {
  branches: 100,
  functions: 100,
  lines: 100,
  statements: 100
}
```

**Requirements**:
- **NO function without test** - period
- **NO branch untested** - all if/else/switch paths
- **NO error path untested** - all try/catch/throw scenarios
- **NO edge case ignored** - empty, null, undefined, extreme values

**Function without test = CANNOT COMMIT**

### TypeScript Strict Mode - ZERO TOLERANCE
**ABSOLUTE ZERO** tolerance for type errors.

**Required tsconfig flags**:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`

**Forbidden**:
- ❌ `any` types (use `unknown` and type guard)
- ❌ `@ts-ignore` comments
- ❌ `@ts-expect-error` comments
- ❌ Type assertions without validation (`as`)
- ❌ Non-null assertions (`!`) without guard

**1 TypeScript error = BUILD BLOCKED = WORK STOPPED**

### Zero ESLint Warnings - ZERO MEANS ZERO
Build fails if **ANY** ESLint warnings exist.

**Key rules**:
- `@typescript-eslint/no-explicit-any: "error"`
- `@typescript-eslint/explicit-function-return-type: "error"`
- `@typescript-eslint/no-unused-vars: "error"`
- `complexity: ["error", 10]` - Max cyclomatic complexity
- `max-depth: ["error", 3]` - Max nesting depth
- `max-lines-per-function: ["error", 15]` - Max function length

**1 ESLint warning = COMMIT BLOCKED**

---

## Git Workflow

### Atomic Commits (MANDATORY)
After **every single file change**:
```bash
git add <file>
git commit -m "type(scope): description"
git push
```

**NO batching** multiple files. **NO accumulating** changes.

### Commit Format
Use Conventional Commits:
- `feat(parser): add SSE event stream parser`
- `fix(ui): correct token masking logic`
- `test(jwt): add edge case for malformed tokens`
- `refactor(types): extract ParsedStream interface`
- `chore(deps): update vitest to 2.1.4`

---

## Common Development Tasks

### Adding a New Parser
1. Create `src/lib/newparser.ts` (≤75 lines, pure functions)
2. Export type-safe parsing function with explicit return type
3. Create `tests/newparser.test.ts` with 100% coverage
4. Commit parser and tests separately (atomic commits)
5. Integrate into `App.tsx` content-type routing

### Adding a New UI Component
1. Create `src/sidepanel/components/NewComponent.tsx` (≤75 lines)
2. Keep props interface minimal (≤3 parameters, use object if more)
3. Add to parent component
4. Consider splitting if approaching 75 lines
5. Atomic commit

### Modifying Background Worker
1. Read `src/background.ts` first to understand CDP flow
2. Modify CDP event handlers or filtering logic
3. Keep session management separate from event handling
4. Test with `npm run build` + load extension + check DevTools console
5. Atomic commit

---

## Testing Strategy

### Parser Tests (Critical)
Every parser must test:
- Valid input → correct output
- Empty input
- Malformed input (invalid format)
- Edge cases (single event, no events, very long data fields)
- Type safety (return types match spec)

### React Component Tests
Use Testing Library patterns:
- Render component
- Query by role/label (accessibility-first)
- Simulate user interactions
- Assert on rendered output

### Chrome API Mocking
Mock `chrome.*` APIs in tests:
```typescript
global.chrome = {
  runtime: { sendMessage: vi.fn() },
  debugger: { attach: vi.fn(), sendCommand: vi.fn() }
  // ...
};
```

---

## Debugging

### Extension Debugging
1. Build extension: `npm run build`
2. Load unpacked in Chrome
3. Open side panel
4. Open DevTools → **inspect service worker** (background.ts logs)
5. Open DevTools → **inspect side panel** (React component logs)
6. Check `chrome://extensions` for errors

### Network Capture Issues
- Verify `chrome.debugger` permission granted
- Check target URL regex in `background.ts:495`
- Verify content-type matching in `App.tsx:731`
- Check CDP protocol version (currently `"1.3"`)

### Build Issues
- Run `npm run validate` to check all gates
- Check `tsc --noEmit` for type errors
- Check `npm run lint` for ESLint issues
- Verify all tests pass: `npm run test`

---

## Dependencies Philosophy

### Allowed
- **react**, **react-dom** - UI framework
- **typescript** - Type safety
- **vite**, **@crxjs/vite-plugin** - Build tooling
- **vitest**, **@testing-library/react** - Testing
- **eslint**, **prettier** - Code quality
- **@types/chrome** - Chrome extension types

### Forbidden
- ❌ **No lodash** - use native ES2022 methods
- ❌ **No axios** - use native `fetch` or CDP
- ❌ **No moment** - use native `Date`
- ❌ **No mock data libraries** - real data only
- ❌ **No state management** (Redux, MobX) - React state sufficient

---

## PURE FUNCTIONS - MANDATORY FUNCTIONAL PROGRAMMING

### Pure vs Impure Function Separation - STRICT ISOLATION

**PURE FUNCTIONS** (Default - 95% of codebase):
- **Location**: `src/lib/*.ts` - ALL functions MUST be pure
- **Naming**: Normal camelCase (e.g., `parseEventStream`, `decodeJwtClaims`)
- **Characteristics**:
  - Same input → Same output (deterministic)
  - No side effects (no I/O, no mutations, no DOM, no console.log)
  - No external state dependencies
  - Referentially transparent (can replace call with return value)
- **Testing**: Simple - input → assert output

**IMPURE FUNCTIONS** (Exception - <5% of codebase):
- **Location**: `src/effects/*.ts` - SEPARATE directory from pure functions
- **Naming**: Prefix with `effect` (e.g., `effectSendMessage`, `effectAttachDebugger`)
- **Characteristics**:
  - Side effects (Chrome APIs, DOM, network, storage, console)
  - State mutations
  - I/O operations
- **Documentation**: MUST have JSDoc with `@impure` tag explaining side effects
- **Testing**: Requires mocking

**FORBIDDEN**:
- ❌ Pure and impure functions in same file
- ❌ Impure function without `effect` prefix
- ❌ Impure function without `@impure` JSDoc
- ❌ Side effects in `src/lib/` directory

**Example**:
```typescript
// ✅ GOOD - Pure function in src/lib/sse.ts
export function parseEventStream(body: string): SseEvent[] {
  const lines = body.split(/\r?\n/);
  return lines.filter(line => line.trim().startsWith('data:'));
}

// ✅ GOOD - Impure function in src/effects/chrome.ts
/**
 * @impure Sends message to Chrome runtime (side effect)
 */
export function effectSendMessage(tabId: number, payload: unknown): void {
  chrome.runtime.sendMessage({ tabId, payload });
}

// ❌ BAD - Impure function without effect prefix
export function sendMessage(tabId: number, payload: unknown): void {
  chrome.runtime.sendMessage({ tabId, payload });
}

// ❌ BAD - Side effect in pure function
export function parseAndLog(body: string): SseEvent[] {
  console.log('Parsing...'); // ❌ SIDE EFFECT
  return parseEventStream(body);
}
```

### DRY Code - ZERO DUPLICATION TOLERANCE

**Duplication Detection**:
- Run duplication analysis before every commit
- **>5% code duplication = COMMIT BLOCKED**
- Use tools: `jscpd`, `jsinspect`

**Extraction Rules**:
- ≥3 lines duplicated → Extract to function
- ≥2 functions duplicated → Extract to shared utility
- Similar logic in 2+ files → Extract to `src/lib/`

**Configuration** (`.jscpd.json`):
```json
{
  "threshold": 5,
  "reporters": ["console"],
  "ignore": ["**/*.test.ts", "**/dist/**"],
  "format": ["typescript", "tsx"]
}
```

**Enforcement**:
```bash
npm run check-duplication  # Must pass before commit
```

### DRY Violations - Common Patterns to Eliminate

**❌ BAD - Duplicated validation**:
```typescript
// File A
if (typeof data !== 'object' || data === null) throw new Error('Invalid');

// File B
if (typeof data !== 'object' || data === null) throw new Error('Invalid');
```

**✅ GOOD - Shared validation**:
```typescript
// src/lib/validate.ts
export function assertObject(data: unknown): asserts data is object {
  if (typeof data !== 'object' || data === null) {
    throw new TypeError('Expected object');
  }
}
```

### Function Purity Checklist

Before committing any function, verify:
- ✅ No `console.*` calls (use logger if needed)
- ✅ No `Math.random()` or `Date.now()` (pass as parameter)
- ✅ No mutations of input parameters
- ✅ No `let` variables (prefer `const` and `.map/.filter/.reduce`)
- ✅ No DOM access (`document`, `window`)
- ✅ No Chrome API calls (`chrome.*`)
- ✅ No network calls (`fetch`, `XMLHttpRequest`)
- ✅ No file system access
- ✅ No shared state access

**If ANY checklist item fails → Function is IMPURE → Move to `src/effects/` → Add `effect` prefix**

### Data Integrity Principles

**Only Parse What Exists**:
- Extract fields that are **present** in responses
- No assumptions about missing data
- No enrichment from external sources
- No inference about internal model state

**Fail Loudly**:
```typescript
// ❌ BAD - Silent failure
try { parse(data); } catch { return null; }

// ✅ GOOD - Explicit error with type
try {
  return parse(data);
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  throw new ParseError('Failed to parse SSE', { cause: err });
}
```

**Type Safety Over Runtime Checks**:
```typescript
// ❌ BAD - Runtime check
function process(data: unknown): string {
  if (typeof data === 'string') return data;
  throw new Error('Not a string');
}

// ✅ GOOD - Type guard
function isString(data: unknown): data is string {
  return typeof data === 'string';
}

function process(data: unknown): string {
  if (!isString(data)) throw new TypeError('Expected string');
  return data; // TypeScript knows data is string
}
```

---

## CENTRALIZED ERROR HANDLING - MANDATORY ARCHITECTURE

### Error Flow - ALL ERRORS → ONE LOCATION

**Principle**: Every error from every source MUST flow to `src/errors/errorStore.ts`

**Error Sources** (ALL must report to central store):
1. **Background Worker Errors** → Chrome API failures, CDP errors
2. **Parser Errors** → SSE/JSONL/JWT parsing failures
3. **UI Runtime Errors** → React errors, component failures
4. **Network Errors** → Failed requests, timeout errors
5. **Storage Errors** → Chrome storage API failures
6. **Type Errors** → Runtime type assertion failures
7. **Unknown Errors** → Unhandled exceptions, promise rejections

### Error Store Architecture

**Location**: `src/errors/errorStore.ts`

**Interface**:
```typescript
export interface ErrorEntry {
  id: string;                    // Unique error ID (timestamp + random)
  timestamp: number;              // When error occurred
  source: ErrorSource;            // Where error came from
  sourceFile?: string;            // File that threw error
  sourceLine?: number;            // Line number (if available)
  message: string;                // Human-readable message
  stack?: string;                 // Full stack trace
  context?: Record<string, unknown>; // Additional context
  severity: 'error' | 'warning' | 'info';
}

export type ErrorSource =
  | 'background-worker'
  | 'parser-sse'
  | 'parser-jsonl'
  | 'parser-jwt'
  | 'ui-component'
  | 'chrome-api'
  | 'network'
  | 'storage'
  | 'unknown';

export interface ErrorStore {
  errors: ErrorEntry[];
  addError: (entry: Omit<ErrorEntry, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  getErrors: () => ErrorEntry[];
  subscribe: (callback: (errors: ErrorEntry[]) => void) => () => void;
}
```

### Error Reporter - Global Error Catcher

**Location**: `src/errors/errorReporter.ts`

**Catches**:
- `window.onerror` → Global JavaScript errors
- `window.onunhandledrejection` → Unhandled promise rejections
- React Error Boundaries → Component errors
- Chrome API errors → `chrome.runtime.lastError`
- Manual `reportError()` calls → Explicit error reporting

**Implementation Pattern**:
```typescript
// src/errors/errorReporter.ts
import { errorStore } from './errorStore';

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

/**
 * Manual error reporting function
 */
export function reportError(
  source: ErrorSource,
  error: Error | string,
  context?: Record<string, unknown>
): void {
  const message = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;

  errorStore.addError({
    source,
    message,
    stack,
    context,
    severity: 'error'
  });
}
```

### Error Monitor Component - UI Display

**Location**: `src/errors/ErrorMonitor.tsx`

**Requirements**:
- **Always visible** in UI (footer or collapsible panel)
- **Shows error count** badge (e.g., "🔴 3 errors")
- **Expandable** to show full error list
- **Each error displays**:
  - Timestamp (human-readable)
  - Source (badge showing origin)
  - Message (full text)
  - Stack trace (collapsible)
  - Context (JSON viewer)
- **Copy button** for each error (copies full error as JSON)
- **Copy all button** (copies all errors as JSON array)
- **Clear button** (clears all errors)

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ 🔴 Errors (3)                      [Clear]  │
├─────────────────────────────────────────────┤
│ [background-worker] 14:32:15                │
│ Failed to attach debugger to tab 123        │
│ [View Stack] [Copy]                         │
├─────────────────────────────────────────────┤
│ [parser-sse] 14:31:42                       │
│ Invalid SSE format: missing data field      │
│ File: src/lib/sse.ts:45                     │
│ [View Stack] [Copy]                         │
├─────────────────────────────────────────────┤
│ [chrome-api] 14:30:18                       │
│ chrome.runtime.lastError: No tab found      │
│ [View Stack] [Copy]                         │
└─────────────────────────────────────────────┘
```

### Error Reporting Pattern - How to Use

**In Pure Functions** (parsers):
```typescript
// src/lib/sse.ts
import { reportError } from '@/errors/errorReporter';

export function parseEventStream(body: string): SseEvent[] {
  try {
    // Parsing logic
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

**In Impure Functions** (Chrome API):
```typescript
// src/effects/chrome.ts
import { reportError } from '@/errors/errorReporter';

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

**In React Components**:
```typescript
// src/sidepanel/App.tsx
import { reportError } from '@/errors/errorReporter';
import { ErrorMonitor } from '@/errors/ErrorMonitor';

function App() {
  const handleCapture = () => {
    try {
      // Capture logic
    } catch (error) {
      reportError('ui-component', error as Error, { component: 'App', action: 'capture' });
    }
  };

  return (
    <div>
      {/* Main UI */}
      <ErrorMonitor /> {/* Always visible at bottom */}
    </div>
  );
}
```

**In Background Worker**:
```typescript
// src/background.ts
import { reportError } from '@/errors/errorReporter';

chrome.debugger.onEvent.addListener((source, method, params) => {
  try {
    // Handle event
  } catch (error) {
    reportError('background-worker', error as Error, { method, params });
  }
});
```

### Error Handling Requirements - MANDATORY

**Every function that can error MUST**:
1. Wrap risky code in try/catch
2. Call `reportError()` with correct source
3. Include context (function params, state)
4. Re-throw error after reporting (don't swallow)

**Every Chrome API call MUST**:
1. Check `chrome.runtime.lastError`
2. Report error if exists
3. Include API name and parameters in context

**Every parser MUST**:
1. Report parsing errors with sample data (first 100 chars)
2. Specify parser type in source
3. Include line number if possible

**Error Monitor MUST**:
1. Be visible at all times (even when collapsed)
2. Show error count badge
3. Update in real-time (reactive)
4. Allow copying individual errors
5. Allow copying all errors as JSON
6. Allow clearing all errors

---

## CHROME EXTENSION BEST PRACTICES - 10 MANDATORY RULES

### 1. Manifest V3 Strict Compliance - NO MANIFEST V2

**Rule**: Use ONLY Manifest V3 APIs and patterns.

**Forbidden**:
- ❌ Background pages → Use service workers
- ❌ `executeScript` with code strings → Use files only
- ❌ Broad host permissions → Use activeTab + specific hosts
- ❌ `webRequest` blocking → Use declarativeNetRequest

**Required**:
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "src/background.ts",
    "type": "module"
  }
}
```

### 2. Minimal Permissions - Principle of Least Privilege

**Rule**: Request ONLY permissions actually needed.

**Pattern**:
```json
{
  "permissions": [
    "debugger",   // ONLY for CDP network capture
    "sidePanel",  // ONLY for UI
    "storage",    // ONLY for settings
    "tabs"        // ONLY for active tab info
  ],
  "host_permissions": [
    "https://chat.openai.com/*",    // Specific hosts only
    "https://chatgpt.com/*"
  ]
}
```

**Forbidden**:
- ❌ `<all_urls>` or `*://*/*` → Too broad
- ❌ `http://*` → Insecure
- ❌ Unused permissions

### 3. Service Worker Lifecycle - Handle Termination

**Rule**: Service workers can terminate at any time. Design for it.

**Pattern**:
```typescript
// ❌ BAD - Assumes service worker stays alive
const sessions = new Map(); // Lost on termination!

// ✅ GOOD - Persist critical state
chrome.storage.session.set({ sessions: Array.from(sessions.entries()) });

// Restore on startup
chrome.runtime.onStartup.addListener(async () => {
  const { sessions } = await chrome.storage.session.get('sessions');
  // Restore state
});
```

**Requirements**:
- Save state to `chrome.storage.session` or `chrome.storage.local`
- Handle `chrome.runtime.onStartup` and `chrome.runtime.onInstalled`
- No global variables that persist important data
- Design for stateless service workers

### 4. Message Passing - Structured Communication

**Rule**: Use typed message passing between contexts.

**Pattern**:
```typescript
// src/types.ts
export type Message =
  | { type: 'startCapture'; tabId: number }
  | { type: 'stopCapture'; tabId: number }
  | { type: 'captureData'; data: RawCapture };

// Background worker
chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  if (msg.type === 'startCapture') {
    // Handle with type safety
  }
  return true; // Keep channel open for async response
});

// Side panel
chrome.runtime.sendMessage({ type: 'startCapture', tabId: 123 });
```

**Forbidden**:
- ❌ Untyped messages (`msg.action`, `msg.data` without types)
- ❌ `sendResponse` without `return true`
- ❌ Long-lived connections without cleanup

### 5. Content Security Policy - No Inline Code

**Rule**: NO inline scripts, NO eval, NO unsafe-inline.

**Pattern**:
```html
<!-- ❌ BAD -->
<script>console.log('inline')</script>
<div onclick="handleClick()">Click</div>

<!-- ✅ GOOD -->
<script src="main.js"></script>
<div id="clickable">Click</div>
<!-- Add listener in main.js -->
```

**Default CSP (Manifest V3)**:
```
script-src 'self'; object-src 'self'
```

**Forbidden**:
- ❌ `eval()`, `new Function()`
- ❌ Inline `<script>` tags
- ❌ Inline event handlers (`onclick=""`)
- ❌ `javascript:` URLs

### 6. Chrome API Error Handling - Always Check lastError

**Rule**: EVERY Chrome API callback MUST check `chrome.runtime.lastError`.

**Pattern**:
```typescript
// ✅ GOOD - Always check
chrome.debugger.attach({ tabId }, '1.3', () => {
  if (chrome.runtime.lastError) {
    reportError('chrome-api', new Error(chrome.runtime.lastError.message));
    return;
  }
  // Proceed only if no error
});

// ❌ BAD - No error check
chrome.debugger.attach({ tabId }, '1.3', () => {
  // API might have failed silently!
  chrome.debugger.sendCommand(...); // Will fail
});
```

**Required Everywhere**:
- `chrome.debugger.*`
- `chrome.storage.*`
- `chrome.tabs.*`
- `chrome.runtime.sendMessage`
- ANY Chrome API with callback

### 7. Resource Cleanup - No Leaked Resources

**Rule**: Clean up ALL resources when done.

**Resources Requiring Cleanup**:
- Chrome debugger sessions → `chrome.debugger.detach()`
- Event listeners → Remove when unmounted
- Timers → `clearTimeout`, `clearInterval`
- Storage sessions → Clear temporary data
- Message ports → `port.disconnect()`

**Pattern**:
```typescript
// ✅ GOOD - React cleanup
useEffect(() => {
  const handleMessage = (msg: Message) => { /* ... */ };
  chrome.runtime.onMessage.addListener(handleMessage);

  return () => {
    chrome.runtime.onMessage.removeListener(handleMessage);
  };
}, []);

// ✅ GOOD - Debugger cleanup
async function stopCapture(tabId: number) {
  try {
    await chrome.debugger.detach({ tabId });
  } catch {
    // Already detached - ignore
  }
}
```

### 8. Side Panel Best Practices - Optimal UX

**Rule**: Side panel should be fast, responsive, and memory-efficient.

**Requirements**:
- **Lazy load** components (React.lazy, dynamic imports)
- **Virtualize** long lists (react-window, react-virtuoso)
- **Debounce** user inputs (search, filters)
- **Limit** stored data (max N events, auto-trim)
- **Clear** data on user action (Clear button)

**Pattern**:
```typescript
// ✅ GOOD - Virtualized list
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={rows.length}
  itemSize={50}
>
  {({ index, style }) => <Row data={rows[index]} style={style} />}
</FixedSizeList>

// ✅ GOOD - Auto-trim data
const MAX_ROWS = 1000;
if (rows.length > MAX_ROWS) {
  rows = rows.slice(-MAX_ROWS); // Keep last 1000 only
}
```

### 9. Debugger Protocol - Respect Limits

**Rule**: Chrome Debugger Protocol has limits. Respect them.

**Limits**:
- Max response body size: ~50MB (configurable via `maxTotalBufferSize`)
- Max concurrent sessions: Limited per tab
- Session exclusive: Only one debugger per tab

**Pattern**:
```typescript
// ✅ GOOD - Set buffer size
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

**Forbidden**:
- ❌ Attaching without checking existing sessions
- ❌ Requesting unlimited buffer size
- ❌ Capturing all network traffic (filter specific URLs)

### 10. Extension Updates - Handle Gracefully

**Rule**: Extension can update at any time. Handle it gracefully.

**Pattern**:
```typescript
// Listen for update events
chrome.runtime.onUpdateAvailable.addListener((details) => {
  // Save state before reload
  chrome.storage.local.set({
    pendingUpdate: true,
    savedState: getCurrentState()
  });

  // Reload extension
  chrome.runtime.reload();
});

// Restore after update
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

**Requirements**:
- Handle `chrome.runtime.onInstalled` (install, update, chrome_update)
- Save critical state before update
- Restore state after update
- Show update notification to user (optional)

---

## Performance Considerations

### Bundle Size Target
- Total bundle < 500KB
- Lazy load components if needed
- Tree-shake unused code
- No large dependencies

### Memory Management
- Clear captured rows on user action (Clear button)
- Limit stored events per request
- Detach debugger when not capturing

---

## Security Guidelines

### Token Handling
- **Never log** full JWT tokens
- **Mask by default** in UI: `abc123...xyz789`
- Decode claims **client-side only** (no server calls)
- Show full token only on explicit user toggle

### Permissions
- Request minimal permissions in `manifest.json`
- `debugger` - required for CDP
- `sidePanel` - required for UI
- `storage` - for persisting settings
- `tabs` - for active tab info

### Content Security Policy
- No `eval()` or `Function()` constructor
- No inline scripts in HTML
- All code in bundled JS files

---

## DEFINITION OF DONE - ABSOLUTE REQUIREMENTS

### Pre-Commit Checklist (ALL must pass)

**QUALITY GATES** (Automated):
- ✅ `npm run typecheck` → 0 errors
- ✅ `npm run lint` → 0 warnings
- ✅ `npm run test` → All pass, 100% coverage
- ✅ `npm run check-duplication` → <5% duplication
- ✅ `npm run format:check` → All files formatted

**FILE CONSTRAINTS** (Manual verification):
- ✅ File is ≤75 lines (including imports, blank lines)
- ✅ All functions ≤15 lines
- ✅ Max 3 nesting levels
- ✅ Cyclomatic complexity ≤10

**FUNCTIONAL PROGRAMMING** (Manual verification):
- ✅ Pure functions in `src/lib/` only
- ✅ Impure functions in `src/effects/` with `effect` prefix
- ✅ No side effects in pure functions
- ✅ All impure functions have `@impure` JSDoc
- ✅ No `let` variables (use `const` and functional transforms)

**TESTING** (Automated + Manual):
- ✅ Every function has unit test
- ✅ All branches tested (if/else/switch)
- ✅ All error paths tested (try/catch/throw)
- ✅ Edge cases tested (empty, null, undefined, extreme values)
- ✅ Coverage report shows 100% (branches, functions, lines, statements)

**TYPE SAFETY** (Manual verification):
- ✅ No `any` types
- ✅ No `@ts-ignore` or `@ts-expect-error`
- ✅ No type assertions (`as`) without validation
- ✅ No non-null assertions (`!`) without guard
- ✅ All function parameters and return types explicit

**CODE QUALITY** (Manual verification):
- ✅ No code duplication (<5% threshold)
- ✅ Public functions have JSDoc comments
- ✅ Descriptive variable names (no abbreviations)
- ✅ Single Responsibility Principle followed
- ✅ DRY principle followed

**GIT WORKFLOW**:
- ✅ Atomic commit (ONE file changed)
- ✅ Conventional commit message format
- ✅ Pushed to GitHub immediately

### Pre-Commit Command Sequence

**Run this before EVERY commit**:
```bash
#!/bin/bash
set -e  # Exit on any error

# 1. Type check
npm run typecheck

# 2. Lint check
npm run lint

# 3. Format check
npm run format:check

# 4. Duplication check
npm run check-duplication

# 5. Test with coverage
npm run test

# 6. Manual verification
echo "✅ All automated checks passed"
echo "⚠️  Manual verification required:"
echo "   - File ≤75 lines?"
echo "   - Functions ≤15 lines?"
echo "   - Pure functions in src/lib/?"
echo "   - Impure functions have 'effect' prefix?"
echo "   - No 'any' types?"
echo "   - All functions tested?"
```

**If ANY check fails → FIX IMMEDIATELY → Re-run all checks**

### Definition of "DONE" - Per Task Type

**New Feature**:
1. Implementation file created (≤75 lines, pure functions)
2. Test file created (100% coverage)
3. Types defined in `src/types.ts` (if needed)
4. Integration into existing code
5. All quality gates pass
6. Atomic commits for each file
7. Documentation updated (if public API)

**Bug Fix**:
1. Root cause identified (5 Whys analysis)
2. Regression test added (proves bug existed)
3. Fix implemented
4. Test passes
5. All quality gates pass
6. Atomic commit
7. Commit message references bug

**Refactoring**:
1. Tests green before refactoring
2. Refactoring applied
3. Tests still green after refactoring
4. No behavior change (tests prove it)
5. Code quality improved (duplication reduced, lines reduced, complexity reduced)
6. All quality gates pass
7. Atomic commit

---

## FORBIDDEN PRACTICES - AUTOMATIC REJECT

**NEVER commit code that**:
- ❌ Has TypeScript errors
- ❌ Has ESLint warnings
- ❌ Has failing tests
- ❌ Has <100% coverage
- ❌ Has >75 lines per file
- ❌ Has functions >15 lines
- ❌ Has `any` types
- ❌ Has `@ts-ignore` comments
- ❌ Has untested functions
- ❌ Has >5% code duplication
- ❌ Has side effects in `src/lib/`
- ❌ Has impure functions without `effect` prefix
- ❌ Batches multiple file changes
- ❌ Has commented-out code
- ❌ Has `console.log` in production code
- ❌ Has `TODO` or `FIXME` comments

**Violation of any forbidden practice = COMMIT BLOCKED = PR REJECTED**

---

## ENFORCEMENT MECHANISMS

### Automated Enforcement
```json
// package.json scripts
{
  "scripts": {
    "precommit": "npm run validate",
    "validate": "npm run typecheck && npm run lint && npm run test && npm run check-duplication",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "test": "vitest run --coverage",
    "check-duplication": "jscpd src/ --threshold 5"
  }
}
```

### Git Hook (Husky)
```bash
# .husky/pre-commit
#!/bin/sh
npm run validate || {
  echo "❌ Quality gates failed. Commit blocked."
  exit 1
}
```

### CI/CD Pipeline
```yaml
# GitHub Actions - all checks must pass
- run: npm run typecheck
- run: npm run lint
- run: npm run test
- run: npm run check-duplication
- run: npm run build
```

---

**Last Updated**: 2025-10-08
**Repository**: https://github.com/franzenzenhofer/franzai-ai-search-inspector
**Constraint Level**: MAXIMUM HARDCORE
