import { describe, it, expect, vi } from "vitest";
import { handleMessage } from "@/background/messageHandler";

describe("handleMessage start-capture", () => {
  it("calls effectStart and responds with success", () => {
    const effectStart = vi.fn();
    const effectStop = vi.fn();
    const sendResponse = vi.fn();
    handleMessage({ action: "start-capture", tabId: 123 }, sendResponse, effectStart, effectStop);
    expect(effectStart).toHaveBeenCalledWith(123);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});

describe("handleMessage stop-capture", () => {
  it("calls effectStop and responds with success", () => {
    const effectStart = vi.fn();
    const effectStop = vi.fn();
    const sendResponse = vi.fn();
    handleMessage({ action: "stop-capture" }, sendResponse, effectStart, effectStop);
    expect(effectStop).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});

describe("handleMessage error handling", () => {
  it("reports errors to sendResponse", () => {
    const effectStart = vi.fn().mockImplementation(() => { throw new Error("test error"); });
    const effectStop = vi.fn();
    const sendResponse = vi.fn();
    handleMessage({ action: "start-capture", tabId: 123 }, sendResponse, effectStart, effectStop);
    expect(sendResponse).toHaveBeenCalledWith({ success: false, error: "test error" });
  });
});
