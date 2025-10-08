import { reportError } from "@/errors/errorReporter";
import type { CapturedStream } from "@/types";

type ResponseHandler = (params: { requestId: string; response: { url: string; status: number; headers: Record<string, string> } }) => void;
type LoadingHandler = (params: { requestId: string; encodedDataLength: number }) => void;
interface DebuggerEvent { method: string; params: unknown }

const targetUrls = ["/backend-api/conversation", "process_upload_stream"];
const isTargetUrl = (url: string): boolean => targetUrls.some((t) => url.includes(t));
const pendingRequests = new Map<string, string>();

export const handleResponseReceived: ResponseHandler = ({ requestId, response }) => {
  try {
    if (!isTargetUrl(response.url)) return;
    pendingRequests.set(requestId, response.url);
  } catch (error) {
    reportError("background-handler", error as Error, { handler: "responseReceived" });
  }
};

export const handleLoadingFinished: LoadingHandler = ({ requestId }) => {
  try {
    const url = pendingRequests.get(requestId);
    if (!url) return;
    pendingRequests.delete(requestId);
    void effectFetchBody(requestId, url);
  } catch (error) {
    reportError("background-handler", error as Error, { handler: "loadingFinished" });
  }
};

async function effectFetchBody(requestId: string, url: string): Promise<void> {
  try {
    const result = await chrome.debugger.sendCommand({ tabId: chrome.devtools.inspectedWindow.tabId }, "Network.getResponseBody", { requestId }) as { body?: string };
    if (!result.body) return;
    const stream: CapturedStream = { timestamp: Date.now(), url, requestId, body: result.body };
    await chrome.storage.session.get(["streams"]).then((data) => {
      const streams = (data.streams as CapturedStream[] | undefined) ?? [];
      streams.push(stream);
      if (streams.length > 1000) streams.splice(0, streams.length - 1000);
      return chrome.storage.session.set({ streams });
    });
  } catch (error) {
    reportError("background-handler", error as Error, { requestId, url });
  }
}

export function createDebuggerListener(tabId: number): (source: chrome.debugger.Debuggee, method: string, params?: object) => void {
  return (_source, method, params) => {
    try {
      if (_source.tabId !== tabId) return;
      const event = { method, params } as DebuggerEvent;
      if (event.method === "Network.responseReceived") handleResponseReceived(event.params as Parameters<ResponseHandler>[0]);
      if (event.method === "Network.loadingFinished") handleLoadingFinished(event.params as Parameters<LoadingHandler>[0]);
    } catch (error) {
      reportError("background-listener", error as Error, { method });
    }
  };
}
