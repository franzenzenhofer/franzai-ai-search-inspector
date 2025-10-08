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
└── effects/
    ├── chrome.test.ts         # Chrome effects tests (mocked)
    └── storage.test.ts        # Storage effects tests (mocked)
```

**Directory Rules**:
- `src/lib/` → **ONLY pure functions** → No Chrome APIs, no DOM, no I/O
- `src/effects/` → **ONLY impure functions** → All side effects go here
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
