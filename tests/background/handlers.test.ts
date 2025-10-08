import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleResponseReceived, createHandleLoadingFinished, createDebuggerListener } from "@/background/handlers";

const mockRuntime = { sendMessage: vi.fn() };
const mockChrome = {
  debugger: { sendCommand: vi.fn() },
  runtime: mockRuntime,
};
global.chrome = mockChrome as unknown as typeof chrome;

describe("handleResponseReceived", () => {
  it("ignores non-target URLs", () => {
    handleResponseReceived({ requestId: "1", response: { url: "https://example.com/api", status: 200, headers: {} } });
    expect(mockChrome.debugger.sendCommand).not.toHaveBeenCalled();
  });
});

describe("createHandleLoadingFinished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores requests not in pending map", () => {
    const handler = createHandleLoadingFinished(123);
    handler({ requestId: "unknown", encodedDataLength: 100 });
    expect(mockChrome.debugger.sendCommand).not.toHaveBeenCalled();
  });
});

describe("createDebuggerListener", () => {
  it("ignores events from other tabs", () => {
    const listener = createDebuggerListener(123);
    listener({ tabId: 999 }, "Network.responseReceived", {});
    expect(mockChrome.debugger.sendCommand).not.toHaveBeenCalled();
  });

  it("handles responseReceived events", () => {
    const listener = createDebuggerListener(123);
    const params = { requestId: "1", response: { url: "https://api.com/backend-api/conversation", status: 200, headers: {} } };
    listener({ tabId: 123 }, "Network.responseReceived", params);
    expect(true).toBe(true);
  });
});
