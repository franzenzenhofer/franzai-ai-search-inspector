import { reportError } from "@/errors/errorReporter";
import { createDebuggerListener } from "@/background/handlers";
import { handleMessage } from "@/background/messageHandler";
import { setupAutoCapture } from "@/background/autoCapture";

let currentTabId: number | null = null;
let currentListener: ((source: chrome.debugger.Debuggee, method: string, params?: object) => void) | null = null;

function effectAttachDebugger(tabId: number): void {
  try {
    chrome.debugger.attach({ tabId }, "1.3", () => {
      if (chrome.runtime.lastError) {
        reportError("background-worker", new Error(chrome.runtime.lastError.message), { action: "attach" });
        return;
      }
      chrome.debugger.sendCommand({ tabId }, "Network.enable", {}, () => {
        if (chrome.runtime.lastError) reportError("background-worker", new Error(chrome.runtime.lastError.message), { action: "enable-network" });
      });
    });
  } catch (error) {
    reportError("background-worker", error as Error, { action: "attach-debugger", tabId });
  }
}

function effectDetachDebugger(tabId: number): void {
  try {
    chrome.debugger.detach({ tabId }, () => {
      if (chrome.runtime.lastError) reportError("background-worker", new Error(chrome.runtime.lastError.message), { action: "detach" });
    });
  } catch (error) {
    reportError("background-worker", error as Error, { action: "detach-debugger", tabId });
  }
}

function effectStartCapture(tabId: number): void {
  if (currentTabId !== null) effectDetachDebugger(currentTabId);
  currentTabId = tabId;
  currentListener = createDebuggerListener(tabId);
  chrome.debugger.onEvent.addListener(currentListener);
  effectAttachDebugger(tabId);
}

function effectStopCapture(): void {
  if (currentTabId === null) return;
  effectDetachDebugger(currentTabId);
  if (currentListener) chrome.debugger.onEvent.removeListener(currentListener);
  currentTabId = null;
  currentListener = null;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message as { action: string; tabId?: number }, sendResponse, effectStartCapture, effectStopCapture);
  return true;
});

chrome.debugger.onDetach.addListener((source, reason) => {
  try {
    if (source.tabId === currentTabId) {
      if (currentListener) chrome.debugger.onEvent.removeListener(currentListener);
      currentTabId = null;
      currentListener = null;
    }
  } catch (error) {
    reportError("background-worker", error as Error, { reason });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) void chrome.sidePanel.open({ windowId: tab.windowId });
});

setupAutoCapture(() => currentTabId, effectStartCapture);
