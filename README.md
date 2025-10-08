# SSE Inspector Chrome Extension

Chrome side panel extension for inspecting Server-Sent Events (SSE) and JSON Lines (JSONL) network traffic from ChatGPT and similar streaming services.

## Features

- **Real-time SSE/JSONL capture** via Chrome DevTools Protocol
- **Side panel UI** with Chrome DevTools styling
- **Stream inspection** with detailed event parsing
- **Secret masking** for sensitive data (tokens, credentials)
- **Centralized error monitoring** with full stack traces
- **100% TypeScript** with strict type safety
- **92.54% test coverage** with Vitest + React Testing Library

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/franzenzenhofer/franzai-ai-search-inspector.git
cd franzai-ai-search-inspector
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

## Usage

1. Open the extension by clicking the icon in the toolbar
2. Navigate to a page with SSE/JSONL traffic (e.g., ChatGPT)
3. Click "Start Capture" to begin monitoring
4. View captured streams in the table
5. Click a stream to view detailed event information
6. Toggle "Show Secrets" to reveal/mask sensitive data
7. Click "Stop Capture" when done
8. Use "Clear" to remove all captured streams
9. Use "Export" to save streams as JSON

## Development

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev          # Vite dev server with HMR
```

### Build
```bash
npm run build        # Production build to dist/
```

### Quality Gates
```bash
npm run typecheck    # TypeScript strict mode (0 errors)
npm run lint         # ESLint strict (0 warnings)
npm run test         # Vitest with coverage
npm run validate     # Run all checks: lint + typecheck + test
npm run check-duplication  # Code duplication check (<5%)
```

### Code Standards

- **75 lines max** per source file (excluding configs, HTML, CSS)
- **15 lines max** per function
- **100% test coverage goal** (≥90% threshold)
- **Zero TypeScript errors** - build blocked if any exist
- **Zero ESLint warnings** - commit blocked if any exist
- **<5% code duplication** - enforced by jscpd
- **Pure function separation** - `src/lib/` (pure), `src/effects/` (impure with `effect` prefix)

## Architecture

### Directory Structure

```
src/
├── background/           # Service worker
│   ├── background.ts     # Main service worker entry
│   ├── handlers.ts       # CDP event handlers
│   └── messageHandler.ts # Chrome message routing
├── sidepanel/            # UI components
│   ├── components/       # React components
│   │   ├── Controls.tsx
│   │   ├── SecretToggle.tsx
│   │   ├── StreamTable.tsx
│   │   └── EventDetails.tsx
│   ├── hooks/            # Custom React hooks
│   │   └── useCapture.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # React entry point
│   └── index.html
├── lib/                  # Pure functions
│   ├── sse.ts            # SSE parsing and summarization
│   ├── sseParse.ts       # Low-level SSE parser
│   ├── sseSummary.ts     # SSE summary extraction
│   ├── jsonl.ts          # JSON Lines parsing
│   ├── jwt.ts            # JWT decoding
│   └── util.ts           # Utility functions
├── errors/               # Error handling
│   ├── errorStore.ts     # Central error store
│   ├── errorReporter.ts  # Error reporting
│   ├── ErrorMonitor.tsx  # UI error display
│   └── useErrorStore.ts  # React hook for errors
├── types.ts              # TypeScript types
├── devtools-theme.css    # Chrome DevTools styling
└── styles.css            # Component styles

tests/                    # Mirror src/ structure
```

### Key Technologies

- **Chrome Extensions Manifest V3** - Modern extension API
- **Chrome DevTools Protocol (CDP)** - Network interception
- **TypeScript** - Strict type safety
- **React 18** - UI framework
- **Vite** - Build tool
- **CRXJS** - Chrome extension plugin for Vite
- **Vitest** - Testing framework
- **React Testing Library** - Component testing
- **ESLint** - Code quality
- **Prettier** - Code formatting

### Data Flow

1. **Background Service Worker** attaches CDP to active tab
2. **CDP Event Handlers** capture `Network.responseReceived` events
3. **Response bodies** fetched via `Network.getResponseBody`
4. **Parsers** (SSE/JSONL/JWT) extract structured data
5. **Error Reporter** catches and logs all errors
6. **Side Panel UI** displays streams and events
7. **Error Monitor** shows error badge and list

### Error Handling

All errors flow through `src/errors/errorStore.ts`:

- Background Worker → Chrome API, CDP errors
- Parsers → SSE/JSONL/JWT parsing failures
- UI Runtime → React component errors
- Network → Request failures
- Storage → Chrome storage API failures
- Type Errors → Runtime type assertions
- Unknown → Uncaught exceptions, promise rejections

## Testing

### Run Tests
```bash
npm run test             # Run all tests with coverage
npm run test:watch       # Watch mode
```

### Coverage Report
```bash
npm run test             # Generates coverage/ directory
open coverage/index.html # View HTML report
```

### Current Coverage
- **Statements**: 92.54%
- **Branches**: 95.23%
- **Functions**: 97.72%
- **Lines**: 92.54%

## Git Workflow

### Atomic Commits (Required)
After EVERY file change:
```bash
git add <file>
git commit -m "type(scope): description"
git push
```

### Commit Types
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `test:` Add/update tests
- `docs:` Documentation
- `chore:` Build/config changes
- `perf:` Performance improvements

## License

MIT

## Repository

https://github.com/franzenzenhofer/franzai-ai-search-inspector
