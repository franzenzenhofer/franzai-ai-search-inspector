# CLAUDE.md - Chrome SSE Inspector Extension

> **I am Claude Code** (CLI) – Not Claude Desktop
> **Read & Execute** this file on every session start

---

## 🎯 PROJECT MISSION

**Chrome Side Panel Extension** for inspecting SSE/JSONL network responses from ChatGPT and similar streaming services.

**Core Principle**: Only real data. No mocks. No fallbacks. Fail fast, loud, early.

---

## 1. TYPESCRIPT - HARDCORE MODE

### Strict Compilation
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noFallthroughCasesInSwitch": true,
  "noImplicitReturns": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true
}
```

### Zero Tolerance
- **0 TypeScript errors** allowed
- **0 ESLint warnings** allowed
- **0 any types** (except explicit unknown conversion)
- **0 @ts-ignore** comments

### Pre-commit Check
```bash
tsc --noEmit && eslint . --max-warnings=0
```

---

## 2. LINTING - MAXIMUM ENFORCEMENT

### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/strict",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": ["error", {"argsIgnorePattern": "^_"}],
    "max-lines": ["error", {"max": 75}],
    "complexity": ["error", 10],
    "max-depth": ["error", 3]
  }
}
```

### Command
```bash
npm run lint     # Must pass with 0 warnings
```

---

## 3. FILE SIZE LIMIT - STRICT 75 LINES

### Hard Rule
- **Maximum 75 lines** per code file (`.ts`, `.tsx`)
- Includes imports, blank lines, everything
- **Exceptions**: Config files (`tsconfig.json`, `vite.config.ts`)

### Enforcement
- ESLint `max-lines` rule set to error at 75
- Build fails if any file exceeds limit
- Split large files into focused modules

### Strategy
- Small, focused functions (≤15 lines each)
- Single Responsibility Principle
- Extract to modules early and often

---

## 4. TESTING - 100% COVERAGE MANDATORY

### Coverage Requirements
- **100% function coverage** - NO EXCEPTIONS
- **100% branch coverage** - NO EXCEPTIONS
- **100% line coverage** - NO EXCEPTIONS
- **100% statement coverage** - NO EXCEPTIONS

### Test Framework
```json
{
  "test": "vitest run --coverage",
  "test:watch": "vitest --coverage",
  "test:ui": "vitest --ui --coverage"
}
```

### Coverage Enforcement
```json
{
  "coverage": {
    "branches": 100,
    "functions": 100,
    "lines": 100,
    "statements": 100,
    "provider": "v8",
    "reporter": ["text", "json", "html"],
    "exclude": ["**/*.config.ts", "**/dist/**"]
  }
}
```

### Test Requirements
- Every function MUST have tests
- Every branch MUST be tested
- Every error path MUST be tested
- No function without unit test
- Integration tests for user flows
- E2E tests for critical paths

---

## 5. GIT WORKFLOW - ATOMIC COMMITS

### Mandatory Pattern
```bash
# After EVERY file change:
git add <file>
git commit -m "type(scope): description"
git push
```

### Commit Types (Conventional Commits)
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `test:` Add/update tests
- `docs:` Documentation
- `chore:` Build/config changes
- `perf:` Performance improvement

### Rules
- **NO batching** multiple file changes
- **NO accumulating** changes before commit
- **IMMEDIATE push** after every commit
- Atomic = One file, one logical change, one commit

### Examples
```bash
git add src/lib/sse.ts
git commit -m "feat(parser): add SSE event stream parser"
git push

git add tests/sse.test.ts
git commit -m "test(parser): add SSE parser unit tests"
git push
```

---

## 6. CODE QUALITY - CLEAN/DRY/MODULAR

### CLEAN Code Principles
- **C**lear naming (no abbreviations except standard)
- **L**oose coupling (low dependencies)
- **E**asy to understand (self-documenting)
- **A**ppropriate abstractions (no premature optimization)
- **N**o duplication (DRY principle)

### DRY (Don't Repeat Yourself)
- **>10% duplication** fails build
- Extract common logic immediately
- Shared utilities in `/lib`
- Reusable components in `/components`

### MODULAR Architecture
```
src/
├── lib/           # Pure functions, no side effects
├── types/         # Type definitions only
├── components/    # React components (≤75 lines each)
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── background.ts  # Service worker (split if >75 lines)
```

### Function Guidelines
- **Max 15 lines** per function
- **Max 3 parameters** (use object for more)
- **Single responsibility** only
- **Pure functions** preferred
- **Explicit return types** always

---

## 7. BUILD PIPELINE - ZERO FAILURES

### Commands
```bash
npm run build      # Vite build + tsc --noEmit
npm run lint       # ESLint strict mode
npm run test       # Vitest with 100% coverage
npm run typecheck  # tsc --noEmit standalone
```

### Pre-deployment Checklist
```bash
#!/bin/bash
set -e
npm run lint
npm run typecheck
npm run test
npm run build
```

### Pipeline Gates
- TypeScript errors → **BLOCK**
- ESLint warnings → **BLOCK**
- Coverage <100% → **BLOCK**
- Build errors → **BLOCK**

---

## 8. NPM SCRIPTS - STANDARDIZED

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run --coverage",
    "test:watch": "vitest --coverage",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit",
    "predeploy": "npm run lint && npm run typecheck && npm run test && npm run build",
    "validate": "npm run lint && npm run typecheck && npm run test"
  }
}
```

---

## 9. PROJECT INITIALIZATION

### New Project Setup
```bash
git init
gh repo create franzai-ai-search-inspector --public
gh repo set-default franzai-ai-search-inspector
git add .
git commit -m "chore: initial commit"
git push -u origin main
```

---

## 10. DEVELOPMENT WORKFLOW

### Task Management Protocol
1. **Research First** - Understand requirements thoroughly
2. **Create Todo List** - Break down into atomic tasks
3. **Plan & Design** - Architecture and approach
4. **Implement** - Write code (≤75 lines per file)
5. **Write Tests** - 100% coverage for new code
6. **Lint & Type Check** - Fix all errors/warnings
7. **Atomic Commit** - Commit + push immediately
8. **QA Task** - Verify implementation correctness
9. **Reflect** - Review and optimize

### Every Task Must Have
- **Priority** tag (P0/P1/P2/P3)
- **Effort** estimate (XS/S/M/L/XL)
- **Acceptance Criteria** (clear definition of done)
- **QA Step** (verification task)

---

## 11. ERROR HANDLING

### Principles
- **Fail fast, loud, early**
- No silent failures
- No swallowed errors
- Explicit error types
- Detailed error messages

### Pattern
```typescript
// ❌ BAD
try {
  riskyOperation();
} catch {
  // Silent failure
}

// ✅ GOOD
try {
  riskyOperation();
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Operation failed', { error: err, context });
  throw new AppError('User-friendly message', err);
}
```

---

## 12. DEPENDENCIES

### Allowed
- Core: `react`, `react-dom`, `typescript`, `vite`
- Build: `@crxjs/vite-plugin`, `@vitejs/plugin-react`
- Linting: `eslint`, `@typescript-eslint/*`, `prettier`
- Testing: `vitest`, `@testing-library/react`, `jsdom`
- Types: `@types/chrome`, `@types/react`, `@types/react-dom`

### Forbidden
- **No lodash** (use native ES2022)
- **No moment** (use native Date)
- **No jQuery** (use native DOM)
- **No axios** (use native fetch)
- **No mock libraries** (real data only)

---

## 13. BROWSER COMPATIBILITY

### Target
- Chrome/Edge 120+ (Manifest V3)
- ES2022 syntax
- Native Web APIs only
- No polyfills unless critical

---

## 14. SECURITY

### Rules
- Mask tokens by default
- Show secrets only on explicit toggle
- No credentials in code
- No eval or Function constructor
- CSP compliant
- Minimal permissions

---

## 15. DOCUMENTATION

### Required
- JSDoc for all public functions
- Type annotations for all variables
- README.md with setup instructions
- CHANGELOG.md for releases
- Inline comments for complex logic only

### Format
```typescript
/**
 * Parses Server-Sent Events stream into structured events.
 *
 * @param body - Raw SSE response body
 * @returns Array of parsed SSE events with data and metadata
 * @throws {ParseError} When SSE format is invalid
 */
export function parseEventStream(body: string): SseEvent[] {
  // Implementation
}
```

---

## 16. PERFORMANCE

### Guidelines
- Minimize bundle size (<500KB)
- Lazy load when possible
- Debounce user inputs
- Memoize expensive computations
- Profile before optimizing

---

## 17. ACCESSIBILITY

### Standards
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus management
- Screen reader compatible

---

## 18. DEFINITION OF DONE

### Task Complete When:
- ✅ Code written (≤75 lines per file)
- ✅ Tests written (100% coverage)
- ✅ Lint passes (0 warnings)
- ✅ Type check passes (0 errors)
- ✅ Build succeeds
- ✅ Atomic commit made
- ✅ Pushed to GitHub
- ✅ QA verification passed
- ✅ Documentation updated

---

## 19. ROOT CAUSE ANALYSIS

### 5-7 Whys Technique
When bugs occur:
1. Document symptom
2. Ask "Why?" 5-7 times
3. Each answer becomes a todo
4. Fix root cause, not symptom
5. Add regression test
6. Update documentation

---

## 20. ENGINEERING MANTRA

> **Quality is culture, not a gate.**
>
> **Perfect code is:**
> - Type-safe (0 errors)
> - Lint-clean (0 warnings)
> - Fully tested (100% coverage)
> - Properly sized (≤75 lines)
> - Atomically committed
> - Production-ready

---

## 🚫 FORBIDDEN PRACTICES

- ❌ Committing TypeScript errors
- ❌ Committing ESLint warnings
- ❌ Untested code
- ❌ Files >75 lines
- ❌ Batched commits
- ❌ Mock/dummy data
- ❌ Silent error handling
- ❌ `any` types
- ❌ `@ts-ignore` comments
- ❌ Commented-out code

---

## ✅ REQUIRED PRACTICES

- ✔️ Read files before editing
- ✔️ Understand code before changing
- ✔️ Write tests first (TDD preferred)
- ✔️ Commit atomically
- ✔️ Push immediately
- ✔️ Document public APIs
- ✔️ Use explicit types
- ✔️ Handle all errors
- ✔️ Keep files small
- ✔️ Stay DRY

---

**Last Updated**: 2025-10-08
**Project**: franzai-ai-search-inspector
**Type**: Chrome Extension (Manifest V3)
**Stack**: TypeScript + React + Vite + CRXJS
