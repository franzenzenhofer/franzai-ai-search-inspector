import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCapture } from "@/sidepanel/hooks/useCapture";

const mockChrome = {
  runtime: { sendMessage: vi.fn() },
  tabs: { query: vi.fn() }
};
global.chrome = mockChrome as unknown as typeof chrome;

beforeEach(() => {
  vi.clearAllMocks();
  mockChrome.tabs.query.mockResolvedValue([{ id: 123 }]);
  mockChrome.runtime.sendMessage.mockResolvedValue({});
});

describe("useCapture initial state", () => {
  it("starts with capturing false", () => {
    const { result } = renderHook(() => useCapture());
    expect(result.current.capturing).toBe(false);
  });
});

describe("useCapture start", () => {
  it("sends start-capture message with tab ID", async () => {
    const { result } = renderHook(() => useCapture());
    await act(async () => { await result.current.start(); });
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({ action: "start-capture", tabId: 123 });
    expect(result.current.capturing).toBe(true);
  });
});

describe("useCapture stop", () => {
  it("sends stop-capture message", async () => {
    const { result } = renderHook(() => useCapture());
    await act(async () => { await result.current.start(); });
    await act(async () => { await result.current.stop(); });
    expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({ action: "stop-capture" });
    expect(result.current.capturing).toBe(false);
  });
});

describe("useCapture error handling", () => {
  it("throws error when no active tab", async () => {
    mockChrome.tabs.query.mockResolvedValue([]);
    const { result } = renderHook(() => useCapture());
    await expect(async () => { await act(async () => { await result.current.start(); }); }).rejects.toThrow("No active tab found");
  });
});
