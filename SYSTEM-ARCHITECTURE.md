# SYSTEM ARCHITECTURE

Complete architecture, data flow, and module responsibilities for the Chrome SSE Inspector Extension.

**Referenced by**: CLAUDE.md

---

## High-Level Data Flow

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
    ↓ (if error occurs at any stage)
errors/errorStore.ts
    ↓ Display
errors/ErrorMonitor.tsx
```

---

## Directory Structure

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

### Directory Rules

- **`src/lib/`** → ONLY pure functions → No Chrome APIs, no DOM, no I/O
- **`src/effects/`** → ONLY impure functions → All side effects go here
- **`src/errors/`** → ALL error handling → Single source of truth for errors
- **`src/types.ts`** → ONLY types → No functions, no logic
- **`src/sidepanel/components/`** → React components → Max 75 lines each
- **`tests/`** → Mirrors src/ structure → Every file has corresponding test

---

## Module Responsibilities

### background.ts (Service Worker)
- Listens for `startCapture` / `stopCapture` messages from UI
- Attaches/detaches `chrome.debugger` to active tab
- Monitors `Network.*` CDP events
- Filters requests matching target URL patterns: `/backend-api/conversation`, `process_upload_stream`, etc.
- Fetches response bodies via `Network.getResponseBody`
- Sends captured data to side panel via `chrome.runtime.sendMessage`
- Reports all errors to central error store

### lib/sse.ts (Pure Parser)
- `parseEventStream(body: string): SseEvent[]` - Parses SSE format
- `summarize(events: SseEvent[])` - Extracts conversation_id, message_id, model_slug, etc.
- Handles multi-line `data:` fields (spec allows concatenation with `\n`)
- Auto-detects JSON in data fields
- **Pure**: No side effects, deterministic output

### lib/jsonl.ts (Pure Parser)
- `parseJsonl(url: string, body: string): ParsedJsonl` - Parses newline-delimited JSON
- Used for `process_upload_stream` responses
- **Pure**: No side effects, deterministic output

### lib/jwt.ts (Pure Decoder)
- `decodeJwtClaims(token: string)` - Decodes JWT header and claims
- Returns `{ masked: string, header?: unknown, claims?: JwtClaims }`
- Base64url decoder handles padding
- **Pure**: No side effects, deterministic output

### lib/util.ts (Pure Helpers)
- `tryParseJson(s: string): unknown | undefined` - Safe JSON parsing
- `maskToken(token: string): string` - Token masking for display
- `normalizeHeaderMap(headers: Record<string, string>)` - Header normalization
- **All pure**: No side effects

### effects/chrome.ts (Impure - Chrome APIs)
- `effectSendMessage(tabId: number, payload: unknown): void` - Send runtime message
- `effectAttachDebugger(tabId: number): Promise<void>` - Attach debugger
- `effectDetachDebugger(tabId: number): Promise<void>` - Detach debugger
- All functions prefixed with `effect`
- All functions have `@impure` JSDoc
- All check `chrome.runtime.lastError`
- All report errors to central store

### effects/storage.ts (Impure - Storage APIs)
- `effectSaveToStorage(key: string, value: unknown): Promise<void>` - Save to chrome.storage
- `effectLoadFromStorage(key: string): Promise<unknown>` - Load from chrome.storage
- All functions prefixed with `effect`
- All functions have `@impure` JSDoc
- All check `chrome.runtime.lastError`
- All report errors to central store

### errors/errorStore.ts (Central Error Store)
- **Single source of truth** for all errors
- `addError(entry: ErrorEntry): void` - Add error to store
- `clearErrors(): void` - Clear all errors
- `getErrors(): ErrorEntry[]` - Get all errors
- `subscribe(callback): () => void` - Subscribe to error updates
- Reactive - notifies subscribers on changes

### errors/errorReporter.ts (Global Error Catcher)
- `effectInitializeErrorReporter(): void` - Initialize global error handlers
- Catches `window.onerror` → Reports to error store
- Catches `window.onunhandledrejection` → Reports to error store
- `reportError(source, error, context): void` - Manual error reporting
- **Impure**: Side effects (global handlers, error store mutations)

### errors/ErrorMonitor.tsx (UI Component)
- Always visible in side panel footer
- Shows error count badge (🔴 N errors)
- Expandable to show full error list
- Each error shows: timestamp, source, message, stack, context
- Copy individual errors (JSON)
- Copy all errors (JSON array)
- Clear all errors button
- Real-time updates via error store subscription

### sidepanel/App.tsx (Main UI)
- Manages capture state and row data
- Listens for messages from background worker
- Routes captured responses to correct parser based on content-type
- Handles row selection for detail view
- Integrates ErrorMonitor component
- Reports UI errors to central store

### sidepanel/components/Controls.tsx
- Start/Stop/Clear/Export buttons
- Sends messages to background worker
- Handles user interactions
- Max 75 lines

### sidepanel/components/StreamTable.tsx
- Displays list of captured requests
- Row selection handling
- Shows summary (event count, model, etc.)
- Max 75 lines
- Virtualizes if >100 rows

### sidepanel/components/EventDetails.tsx
- Shows detailed view of selected request
- SSE events with parsed data
- JWT token display (masked by default)
- Stack traces for errors
- Max 75 lines

### sidepanel/components/SecretToggle.tsx
- Toggle for showing/hiding secrets
- Checkbox with label
- Updates global secret visibility state
- Max 75 lines

---

## Key Architectural Decisions

### 1. Chrome Debugger Protocol (CDP) for Network Capture
**Why**: Only way in Manifest V3 to reliably capture complete response bodies including SSE streams.

**How**:
- Uses `chrome.debugger` API to attach to active tab
- Listens to `Network.responseReceived` and `Network.loadingFinished` events
- Fetches body via `Network.getResponseBody` command
- Scoped to single tab, requires user permission

**Trade-offs**:
- ✅ Complete access to response bodies
- ✅ Works with streaming responses
- ❌ Requires debugger permission (scary for users)
- ❌ Only one debugger per tab (exclusive access)

### 2. Background Service Worker Pattern
**Why**: Manifest V3 requires service workers, not background pages.

**How**:
- `src/background.ts` handles all CDP communication
- Persists critical state to `chrome.storage.session`
- Handles service worker termination gracefully
- Restores state on startup

**Trade-offs**:
- ✅ MV3 compliant
- ✅ Lightweight (no persistent process)
- ❌ Can terminate anytime (requires state management)
- ❌ No DOM access (can't use window, document)

### 3. Pure Function Isolation
**Why**: Easier testing, better maintainability, functional programming benefits.

**How**:
- All parsers (`sse.ts`, `jsonl.ts`, `jwt.ts`) are pure
- Strict separation: `src/lib/` (pure) vs `src/effects/` (impure)
- Naming convention: `effect` prefix for impure functions
- Documentation: `@impure` JSDoc for impure functions

**Trade-offs**:
- ✅ Testability (pure functions → simple input/output tests)
- ✅ Predictability (deterministic, no hidden state)
- ✅ Composability (easy to combine pure functions)
- ❌ More files (separation requires extra organization)
- ❌ Learning curve (team must understand pure/impure distinction)

### 4. Centralized Error Handling
**Why**: Single source of truth for debugging, better user experience, comprehensive error tracking.

**How**:
- All errors flow to `src/errors/errorStore.ts`
- Global handlers catch unhandled errors
- Manual `reportError()` for explicit errors
- ErrorMonitor component displays all errors
- Errors include source context (background, parser, UI, etc.)

**Trade-offs**:
- ✅ Complete error visibility
- ✅ Easy debugging (all errors in one place)
- ✅ User-friendly (copyable error details)
- ❌ Extra code (error reporting everywhere)
- ❌ Performance overhead (error tracking adds calls)

### 5. Security-First Secrets Handling
**Why**: JWT tokens contain sensitive data that shouldn't be exposed by default.

**How**:
- Tokens masked by default (`abc123...xyz789`)
- Only decoded claims shown (iat, exp, conduit_uuid)
- Full token visible only with explicit "Show secrets" toggle
- No logging of full tokens

**Trade-offs**:
- ✅ Secure by default
- ✅ User controls visibility
- ✅ Prevents accidental exposure
- ❌ Extra UI (toggle component)
- ❌ Extra state management (visibility state)

---

## Error Handling Architecture

### Error Flow Diagram

```
Any Error Source
    ↓
reportError(source, error, context)
    ↓
errorStore.addError(entry)
    ↓
errorStore.notifySubscribers()
    ↓
ErrorMonitor component re-renders
    ↓
User sees error in UI
    ↓
User copies error (JSON)
```

### Error Types

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
```

### Error Sources and Responsibilities

1. **background-worker**: CDP errors, debugger attach failures, network timeouts
2. **parser-sse**: Invalid SSE format, missing data fields, malformed events
3. **parser-jsonl**: Invalid JSON lines, parsing errors
4. **parser-jwt**: Invalid JWT format, decoding failures
5. **ui-component**: React errors, component failures, state issues
6. **chrome-api**: API call failures, permission errors, `chrome.runtime.lastError`
7. **network**: Request failures, timeout errors
8. **storage**: Storage API failures, quota errors
9. **unknown**: Uncaught exceptions, unhandled promise rejections

---

## Message Passing Architecture

### Message Types

```typescript
export type Message =
  | { type: 'startCapture'; tabId: number }
  | { type: 'stopCapture'; tabId: number }
  | { type: 'captureData'; data: RawCapture }
  | { type: 'error'; error: ErrorEntry };
```

### Message Flow

```
Side Panel                Background Worker
    │                          │
    ├─ startCapture ─────────> │
    │                          ├─ Attach debugger
    │                          ├─ Start capture
    │ <───────── ok ─────────── │
    │                          │
    │ <─── captureData ──────── │ (Network event)
    ├─ Parse & display         │
    │                          │
    ├─ stopCapture ─────────>  │
    │                          ├─ Detach debugger
    │ <───────── ok ─────────── │
```

---

## Performance Considerations

### Bundle Size
- Target: <500KB total
- Lazy load components with React.lazy
- Tree-shake unused code
- No large dependencies (lodash, moment, etc.)

### Memory Management
- Limit stored events to 1000 max
- Auto-trim when limit exceeded (keep last 1000)
- Clear data on user action (Clear button)
- Detach debugger when not capturing

### UI Performance
- Virtualize lists with react-window (>100 items)
- Debounce search inputs (300ms)
- Memoize expensive computations
- Avoid re-renders with React.memo

---

## Security Architecture

### Permissions (Minimal)
```json
{
  "permissions": ["debugger", "sidePanel", "storage", "tabs"],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*"
  ]
}
```

### Content Security Policy
Default MV3 CSP (strict):
```
script-src 'self'; object-src 'self'
```

**No exceptions**: No inline scripts, no eval, no unsafe-inline.

### Token Security
- Mask tokens by default
- Show claims only (iat, exp, conduit_uuid)
- Full token requires explicit user toggle
- Never log full tokens to console

---

## Testing Architecture

### Test Structure
```
tests/
├── lib/
│   ├── sse.test.ts        # Pure function tests (simple input → output)
│   ├── jsonl.test.ts
│   └── jwt.test.ts
├── effects/
│   ├── chrome.test.ts     # Mocked Chrome APIs
│   └── storage.test.ts    # Mocked storage APIs
├── errors/
│   ├── errorStore.test.ts # Store logic tests
│   └── errorReporter.test.ts # Global handler tests
└── components/
    ├── Controls.test.tsx   # React Testing Library
    ├── StreamTable.test.tsx
    └── EventDetails.test.tsx
```

### Coverage Requirements
- **100% branches** - All if/else/switch paths
- **100% functions** - Every function tested
- **100% lines** - Every line executed
- **100% statements** - Every statement executed

**Build fails if coverage <100%**

---

**Last Updated**: 2025-10-08
