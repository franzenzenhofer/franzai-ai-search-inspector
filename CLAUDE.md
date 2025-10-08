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

---

## Code Organization

### Directory Structure
```
src/
├── background.ts              # MV3 service worker - CDP network capture
├── types.ts                   # Shared TypeScript types
├── lib/                       # Pure parsing functions (no React)
│   ├── sse.ts                 # SSE parser: event/data blocks
│   ├── jsonl.ts               # JSON Lines parser
│   ├── jwt.ts                 # JWT claims decoder (token masking)
│   └── util.ts                # Small helpers (tryParseJson, maskToken, etc.)
├── sidepanel/                 # React UI
│   ├── index.html
│   ├── main.tsx               # React root
│   ├── App.tsx                # Main app component
│   └── components/
│       ├── Controls.tsx       # Start/Stop/Clear/Export buttons
│       ├── StreamTable.tsx    # List of captured requests
│       ├── EventDetails.tsx   # Detailed view of selected request
│       └── SecretToggle.tsx   # Show/hide secrets toggle
└── styles.css                 # Global styles

tests/
├── sse.test.ts                # SSE parser tests
├── jwt.test.ts                # JWT decoder tests
└── jsonl.test.ts              # JSONL parser tests
```

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

## Critical Constraints

### 75-Line File Limit
Every TypeScript/TSX file MUST be ≤75 lines including imports and blank lines.

**Enforcement**: ESLint rule `max-lines: ["error", {"max": 75}]`

**Strategy**:
- Functions ≤15 lines each
- Extract to new module when approaching limit
- Split components into sub-components
- No exceptions for source code files

### 100% Test Coverage
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
- Test all code paths
- Test error handling
- Test edge cases (empty strings, malformed data, etc.)
- Mock chrome APIs in tests where needed

### TypeScript Strict Mode
Zero tolerance policy for type errors.

**Required tsconfig flags**:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitReturns: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

**No `any` types** except when explicitly converting to `unknown` first.

### Zero ESLint Warnings
Build fails if any ESLint warnings exist.

**Key rules**:
- `@typescript-eslint/no-explicit-any: "error"`
- `@typescript-eslint/explicit-function-return-type: "error"`
- `complexity: ["error", 10]` - Max cyclomatic complexity
- `max-depth: ["error", 3]` - Max nesting depth

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

## Data Integrity Principles

### Only Parse What Exists
- Extract fields that are **present** in responses
- No assumptions about missing data
- No enrichment from external sources
- No inference about internal model state

### Fail Loudly
```typescript
// ❌ BAD - Silent failure
try { parse(data); } catch { return null; }

// ✅ GOOD - Explicit error
try {
  return parse(data);
} catch (error) {
  throw new ParseError('Failed to parse SSE', { cause: error });
}
```

### Type Safety Over Runtime Checks
Prefer TypeScript types to catch errors at compile time rather than runtime validation.

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

## Definition of Done

Before committing any file:
- ✅ TypeScript compiles with 0 errors (`npm run typecheck`)
- ✅ ESLint passes with 0 warnings (`npm run lint`)
- ✅ File is ≤75 lines
- ✅ All functions have tests
- ✅ Test coverage is 100%
- ✅ Tests pass (`npm run test`)
- ✅ Code follows CLEAN/DRY/MODULAR principles
- ✅ Public functions have JSDoc comments
- ✅ Atomic commit made with conventional commit message
- ✅ Pushed to GitHub immediately

---

**Last Updated**: 2025-10-08
**Repository**: https://github.com/franzenzenhofer/franzai-ai-search-inspector
