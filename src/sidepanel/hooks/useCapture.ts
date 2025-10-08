import { useState, useCallback } from "react";
import { reportError } from "@/errors/errorReporter";

interface UseCaptureResult {
  capturing: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

async function sendMessage(action: string, tabId?: number): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ action, tabId });
  } catch (error) {
    reportError("ui-component", error as Error, { action });
    throw error;
  }
}

async function getCurrentTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");
  return tab.id;
}

function createStartHandler(setCapturing: (value: boolean) => void): () => Promise<void> {
  return async () => {
    const tabId = await getCurrentTabId();
    await sendMessage("start-capture", tabId);
    setCapturing(true);
  };
}

function createStopHandler(setCapturing: (value: boolean) => void): () => Promise<void> {
  return async () => {
    await sendMessage("stop-capture");
    setCapturing(false);
  };
}

export function useCapture(): UseCaptureResult {
  const [capturing, setCapturing] = useState(false);
  const start = useCallback(createStartHandler(setCapturing), []);
  const stop = useCallback(createStopHandler(setCapturing), []);
  return { capturing, start, stop };
}
