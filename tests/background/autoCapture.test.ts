import { describe, it, expect, vi } from "vitest";
import { isChatGptUrl, setupAutoCapture } from "@/background/autoCapture";

describe("isChatGptUrl", () => {
  it("returns true for chatgpt.com", () => {
    expect(isChatGptUrl("https://chatgpt.com/c/123")).toBe(true);
  });

  it("returns true for chat.openai.com", () => {
    expect(isChatGptUrl("https://chat.openai.com/c/123")).toBe(true);
  });

  it("returns false for other URLs", () => {
    expect(isChatGptUrl("https://google.com")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isChatGptUrl(undefined)).toBe(false);
  });
});

describe("setupAutoCapture", () => {
  it("sets up listeners without error", () => {
    const mockOnUpdated = vi.fn();
    const mockOnActivated = vi.fn();
    global.chrome = {
      tabs: { onUpdated: { addListener: mockOnUpdated }, onActivated: { addListener: mockOnActivated } },
    } as unknown as typeof chrome;
    const getCurrentTabId = vi.fn(() => null);
    const startCapture = vi.fn();
    expect(() => setupAutoCapture(getCurrentTabId, startCapture)).not.toThrow();
    expect(mockOnUpdated).toHaveBeenCalled();
    expect(mockOnActivated).toHaveBeenCalled();
  });
});
