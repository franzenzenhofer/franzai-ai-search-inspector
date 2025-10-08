# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Reference Documents**:
- **SYSTEM-ARCHITECTURE.md** - Architecture, data flow, module responsibilities
- **CODE-REQUIREMENTS-BY-EXAMPLE.md** - Code examples, patterns, anti-patterns

---

## Project Overview

**Chrome Side Panel Extension** for inspecting Server-Sent Events (SSE) and JSON Lines (JSONL) network traffic from ChatGPT and similar streaming services.

**Core Philosophy**: Only real data. No mocks, no fallbacks, no dummy data. Fail fast, loud, and early.

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
npm run check-duplication  # Code duplication check (<5%)
```

### Load Extension in Chrome
1. `npm run build` → creates `dist/` folder
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `dist/` folder

---

## ⚠️ IMMEDIATE FIX POLICY - STOP WORK WHEN:

**STOP ALL WORK IMMEDIATELY** when any of these occur:
- ❌ TypeScript error appears → **FIX NOW** before continuing
- ❌ ESLint warning appears → **FIX NOW** before continuing
- ❌ Test fails → **FIX NOW** before continuing
- ❌ Coverage drops below 100% → **FIX NOW** before continuing

**NO EXCEPTIONS. NO DELAYS. NO "I'll fix it later".**

---

## HARDCORE CONSTRAINTS - NON-NEGOTIABLE

### File Size
- **75 lines maximum** per file (including imports, blank lines)
- **15 lines maximum** per function
- **No exceptions** for source code files
- ESLint enforced - build fails if exceeded

### Test Coverage
- **100% coverage** required (branches, functions, lines, statements)
- **Every function must have tests** - no exceptions
- **Every branch must be tested** - all if/else/switch paths
- **Every error path must be tested** - all try/catch/throw scenarios
- Build fails if coverage <100%

### TypeScript
- **Zero errors** allowed - build blocked if any exist
- **Zero `any` types** - use `unknown` with type guards
- **Zero `@ts-ignore`** comments
- **Zero `@ts-expect-error`** comments
- **Zero non-null assertions** (`!`) without guards
- **Explicit return types** on all functions

### ESLint
- **Zero warnings** allowed - commit blocked if any exist
- **Max complexity 10** - refactor if exceeded
- **Max nesting depth 3** - refactor if exceeded
- **Max lines per function 15** - split if exceeded

### Code Duplication
- **<5% duplication** threshold enforced
- ≥3 duplicated lines → Extract to function
- Run `npm run check-duplication` before commit

---

## PURE FUNCTION SEPARATION - STRICT ISOLATION

### Pure Functions (Default - 95% of codebase)
- **Location**: `src/lib/` ONLY
- **Naming**: Normal camelCase
- **Rules**: Same input → Same output, no side effects
- **Forbidden**: No I/O, no mutations, no DOM, no console, no Chrome APIs

### Impure Functions (Exception - <5% of codebase)
- **Location**: `src/effects/` ONLY (separate from pure functions)
- **Naming**: **MUST** prefix with `effect` (e.g., `effectSendMessage`)
- **Documentation**: **MUST** have `@impure` JSDoc explaining side effects
- **Testing**: Requires mocking

### Strict Rules
- ❌ **FORBIDDEN**: Pure and impure functions in same file
- ❌ **FORBIDDEN**: Impure function without `effect` prefix
- ❌ **FORBIDDEN**: Impure function without `@impure` JSDoc
- ❌ **FORBIDDEN**: Side effects in `src/lib/` directory

See **CODE-REQUIREMENTS-BY-EXAMPLE.md** for patterns.

---

## CENTRALIZED ERROR HANDLING - SINGLE SOURCE OF TRUTH

### Principle
**ALL errors from ALL sources → `src/errors/errorStore.ts`**

### Error Sources (all must report)
1. Background Worker → Chrome API, CDP errors
2. Parsers → SSE/JSONL/JWT parsing failures
3. UI Runtime → React component errors
4. Network → Request failures
5. Storage → Chrome storage API failures
6. Type Errors → Runtime type assertions
7. Unknown → Uncaught exceptions, promise rejections

### Error Monitor Requirements
- Always visible in UI (side panel footer)
- Shows error count badge (e.g., "🔴 3 errors")
- Expandable to show full error list
- Each error shows: timestamp, source, message, stack trace, context
- **Copy button** for each error (copies full error as JSON)
- **Copy all button** (copies all errors as JSON array)
- **Clear button** (clears all errors)

### Mandatory Error Handling
- Every function that can error **MUST** wrap in try/catch
- Every error **MUST** call `reportError(source, error, context)`
- Every Chrome API call **MUST** check `chrome.runtime.lastError`
- Every error **MUST** re-throw after reporting (don't swallow)

See **SYSTEM-ARCHITECTURE.md** for architecture details.
See **CODE-REQUIREMENTS-BY-EXAMPLE.md** for implementation patterns.

---

## GIT WORKFLOW - ATOMIC COMMITS

### Mandatory Pattern (After EVERY file change)
```bash
git add <file>
git commit -m "type(scope): description"
git push
```

### Rules
- **NO batching** multiple file changes
- **NO accumulating** changes before commit
- **IMMEDIATE push** after every commit
- **Conventional commits** format required

### Commit Types
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `test:` Add/update tests
- `docs:` Documentation
- `chore:` Build/config changes

---

## DEFINITION OF DONE - ABSOLUTE REQUIREMENTS

### Before EVERY Commit - ALL Must Pass

**Automated Checks**:
1. ✅ `npm run typecheck` → 0 errors
2. ✅ `npm run lint` → 0 warnings
3. ✅ `npm run test` → All pass, 100% coverage
4. ✅ `npm run check-duplication` → <5% duplication
5. ✅ `npm run format:check` → All files formatted

**Manual Verification**:
6. ✅ File ≤75 lines
7. ✅ All functions ≤15 lines
8. ✅ Pure functions in `src/lib/` only
9. ✅ Impure functions in `src/effects/` with `effect` prefix
10. ✅ No `any` types, no `@ts-ignore`
11. ✅ Every function has tests
12. ✅ Public functions have JSDoc

**Git**:
13. ✅ Atomic commit (ONE file changed)
14. ✅ Conventional commit message
15. ✅ Pushed to GitHub immediately

### If ANY Check Fails
**FIX IMMEDIATELY → Re-run all checks → THEN commit**

---

## CHROME EXTENSION REQUIREMENTS

### 1. Manifest V3 Only
- Use service workers (not background pages)
- No code strings in executeScript
- Minimal permissions (specific hosts only)

### 2. Service Worker Lifecycle
- Service workers can terminate anytime
- Persist critical state to `chrome.storage.session`
- Handle `chrome.runtime.onStartup` and `onInstalled`

### 3. Error Handling
- Check `chrome.runtime.lastError` after EVERY Chrome API call
- Report errors to central error store
- Never swallow errors

### 4. Resource Cleanup
- Detach debugger sessions
- Remove event listeners
- Clear timers
- Disconnect message ports

### 5. Performance
- Virtualize long lists
- Lazy load components
- Limit stored data (max 1000 events)
- Auto-trim data when limit exceeded

See **CODE-REQUIREMENTS-BY-EXAMPLE.md** for all Chrome extension patterns.

---

## FORBIDDEN PRACTICES - AUTOMATIC REJECT

**NEVER commit code that has**:
- ❌ TypeScript errors or ESLint warnings
- ❌ Failing tests or <100% coverage
- ❌ Files >75 lines or functions >15 lines
- ❌ `any` types or `@ts-ignore` comments
- ❌ Untested functions
- ❌ >5% code duplication
- ❌ Side effects in `src/lib/`
- ❌ Impure functions without `effect` prefix
- ❌ Batched file changes
- ❌ Commented-out code
- ❌ `console.log` in production
- ❌ TODO or FIXME comments

**Violation = COMMIT BLOCKED = PR REJECTED**

---

## DIRECTORY STRUCTURE

See **SYSTEM-ARCHITECTURE.md** for complete directory structure and module responsibilities.

**Key Directories**:
- `src/lib/` → Pure functions only, no side effects
- `src/effects/` → Impure functions only, all side effects
- `src/errors/` → Centralized error handling
- `src/sidepanel/components/` → React components (≤75 lines each)
- `tests/` → Mirrors src/ structure, 100% coverage

---

## TESTING REQUIREMENTS

- Every function must have unit tests
- Test all branches (if/else/switch)
- Test all error paths (try/catch/throw)
- Test edge cases (empty, null, undefined, extreme values)
- Pure functions: Simple input → output assertions
- Impure functions: Mock Chrome APIs and side effects

See **CODE-REQUIREMENTS-BY-EXAMPLE.md** for test patterns.

---

## ENFORCEMENT MECHANISMS

### Pre-commit Hook (Husky)
Runs `npm run validate` before every commit. Blocks commit if any check fails.

### CI/CD Pipeline
All checks must pass on GitHub Actions before merge.

### Build Process
Build fails if:
- TypeScript errors exist
- ESLint warnings exist
- Any file >75 lines
- Coverage <100%
- Duplication >5%

---

**Last Updated**: 2025-10-08
**Repository**: https://github.com/franzenzenhofer/franzai-ai-search-inspector
**Constraint Level**: MAXIMUM HARDCORE
