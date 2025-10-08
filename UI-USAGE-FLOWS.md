# SSE Inspector - UI & Usage Flows

## Extension Goals

1. **Capture Server-Sent Events (SSE)** from ChatGPT and similar streaming services
2. **Parse JSONL (JSON Lines)** streaming responses
3. **Decode and mask JWT tokens** for security
4. **Monitor real-time network traffic** from AI chat applications
5. **Export captured data** to JSON for analysis

---

## UI Layout (Side Panel)

### 1. Toolbar (Top)
**Controls Section:**
- **Start Capture** button (green/primary) - Begins network capture
- **Stop Capture** button (appears when capturing) - Stops network capture
- **Clear** button - Clears all captured streams
- **Export JSON** button - Downloads all streams as JSON file

**Secret Toggle Section:**
- **Show Secrets** / **Hide Secrets** toggle button - Controls JWT token visibility

### 2. Stream Table (Middle)
**Columns:**
- **Type** - Badge showing stream type (SSE/JSONL/OTHER)
- **URL** - Full URL of the captured request
- **Summary** - Stream-specific metadata

**Summary Details:**
- **For SSE streams:**
  - Delta encoding badge (if present)
  - Model slugs badge (e.g., "model: gpt-4")
  - Request IDs count badge (e.g., "reqs: 5")
  - Event count (e.g., "events: 42")

- **For JSONL streams:**
  - Line count (e.g., "lines: 15")

- **For OTHER streams:**
  - Note explaining unknown format

**Empty State:**
- Shows message: "No captured requests yet. Click **Start capture** and use ChatGPT (or reload)."

### 3. Event Details Panel (Bottom)
**SSE View (when SSE stream selected):**
- Heading: "SSE Events"
- URL display
- Resume Tokens section (if JWT tokens present):
  - Masked or visible tokens (based on secret toggle)
  - `iat` (issued at) timestamp badge
- Events table with columns:
  - **event** - Event type (e.g., "message", "done")
  - **data** - JSON data or string payload

**JSONL View (when JSONL stream selected):**
- Heading: "JSON Lines"
- URL display
- Lines table with columns:
  - **#** - Line number
  - **Line** - JSON content

**Other View (when unknown stream selected):**
- Heading: "Other Response"
- URL display
- Note explaining format

**Empty State:**
- Shows: "Select a stream to view details"

### 4. Error Monitor (Footer)
- Badge showing error count (e.g., "0 errors", "🔴 3 errors")
- Expandable to show error list with:
  - Timestamp
  - Source
  - Message
  - Stack trace
  - Context
- Copy button for each error
- Copy all button
- Clear button

---

## Usage Flows

### Flow 1: Basic Capture
```
1. User opens ChatGPT (chatgpt.com or chat.openai.com)
2. User clicks extension icon → Side panel opens
3. User clicks "Start Capture" button
4. Extension attaches Chrome Debugger to tab
5. User types message to ChatGPT
6. As ChatGPT streams response:
   - Background worker captures Network.responseReceived events
   - Fetches response bodies via Network.getResponseBody
   - Sends messages to side panel via chrome.runtime.sendMessage
   - Side panel classifies streams (SSE/JSONL/other)
   - StreamTable updates in real-time showing new streams
7. User clicks stream row in StreamTable
8. EventDetails panel shows parsed events/lines
9. User clicks "Stop Capture" when done
10. Extension detaches debugger
```

### Flow 2: JWT Token Inspection
```
1. User captures SSE stream (see Flow 1)
2. SSE stream contains resume_conversation_token events
3. EventDetails shows "Resume tokens" section
4. By default, tokens are masked (e.g., "eyJ***...***xyz")
5. User clicks "Show Secrets" toggle
6. Full JWT tokens become visible
7. iat (issued at time) badge shows token timestamp
8. User can copy token for analysis
9. User clicks "Hide Secrets" to mask again
```

### Flow 3: Export Data
```
1. User captures multiple streams (SSE/JSONL)
2. StreamTable shows all captured streams with summaries
3. User clicks "Export JSON" button
4. Browser downloads "sse-capture.json" file containing:
   - Array of UiStreamRow objects
   - Full parsed events/lines
   - Metadata and summaries
5. User can analyze data offline or share with team
```

### Flow 4: Error Handling
```
1. During capture, an error occurs (e.g., debugger detached)
2. Background worker calls reportError()
3. Error is added to errorStore
4. Error monitor badge updates (e.g., "🔴 1 error")
5. User clicks error badge to expand
6. Error list shows full details
7. User can copy error as JSON
8. User clicks "Clear" to dismiss errors
```

### Flow 5: Clear Data
```
1. User has multiple captured streams
2. User clicks "Clear" button in toolbar
3. Confirmation (implicit - immediate action)
4. All rows removed from StreamTable
5. EventDetails returns to empty state
6. Ready for new capture session
```

---

## Technical Architecture

### Message Passing Flow
```
Background Worker (handlers.ts)
  ↓ chrome.debugger.onEvent → Network.responseReceived
  ↓ Fetch body via Network.getResponseBody
  ↓ chrome.runtime.sendMessage({ _from: "bg", kind: "capture", data: CapturedStream })
  ↓
Side Panel (useStreamListener hook)
  ↓ chrome.runtime.onMessage.addListener
  ↓ classifyStream(CapturedStream) → UiStreamRow
  ↓ Update state: setRows([newRow, ...prev])
  ↓
React Components
  ↓ StreamTable displays rows with summaries
  ↓ EventDetails shows selected stream details
```

### State Management
- **App.tsx** - Root state container
  - `rows: UiStreamRow[]` - All captured streams
  - `selectedIndex: number | null` - Currently selected row
  - `visibility: "masked" | "visible"` - JWT token visibility
  - `capturing: boolean` - Capture state from useCapture hook

### Type System
- **CapturedStream** - Raw network response with body
- **UiStreamRow** - Discriminated union:
  - `{ kind: "sse", url, events, parsed }`
  - `{ kind: "jsonl", url, parsed }`
  - `{ kind: "other", url, note }`
- **SseEvent** - Single SSE event with event, data, rawBlock
- **ParsedStreamSummary** - Extracted metadata (IDs, models, etc.)

---

## Constraints Met

✅ 75-line file maximum
✅ 15-line function maximum
✅ Pure functions in `src/lib/`
✅ Impure functions in `src/effects/` with `effect` prefix
✅ Centralized error handling via errorStore
✅ 0 TypeScript errors
✅ 0 ESLint warnings
✅ 93.76% test coverage
✅ Side panel opens on extension icon click

---

Last Updated: 2025-10-08
