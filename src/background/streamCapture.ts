import { reportError } from "@/errors/errorReporter";
import type { CapturedStream } from "@/types";

const streamBuffers = new Map<string, string>();

async function fetchBody(tabId: number, requestId: string): Promise<string | undefined> {
  const result = await chrome.debugger.sendCommand(
    { tabId },
    "Network.getResponseBody",
    { requestId }
  ) as { body?: string; base64Encoded?: boolean };
  if (!result.body) return undefined;
  return result.base64Encoded ? atob(result.body) : result.body;
}

function sendCapture(url: string, requestId: string, body: string): void {
  const stream: CapturedStream = { timestamp: Date.now(), url, requestId, body };
  void chrome.runtime.sendMessage({ _from: "bg", kind: "capture", data: stream });
}

export async function capturePartialStream(requestId: string, url: string, tabId: number): Promise<void> {
  try {
    const body = await fetchBody(tabId, requestId);
    if (!body) return;
    const previousBody = streamBuffers.get(requestId) || "";
    if (body === previousBody) return;
    streamBuffers.set(requestId, body);
    sendCapture(url, requestId, body);
  } catch (error) {
    reportError("stream-capture", error as Error, { requestId, url });
  }
}

export async function captureFinalStream(requestId: string, url: string, tabId: number): Promise<void> {
  try {
    const body = await fetchBody(tabId, requestId);
    if (!body) return;
    sendCapture(url, requestId, body);
  } catch (error) {
    reportError("stream-capture", error as Error, { requestId, url });
  }
}

export function clearStreamBuffer(requestId: string): void {
  streamBuffers.delete(requestId);
}
