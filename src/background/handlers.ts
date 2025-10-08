import { reportError } from "@/errors/errorReporter";
import { capturePartialStream, captureFinalStream, clearStreamBuffer } from "./streamCapture";

type ResponseHandler = (params: { requestId: string; response: { url: string; status: number; headers: Record<string, string> } }) => void;
type LoadingHandler = (params: { requestId: string; encodedDataLength: number }) => void;
type DataHandler = (params: { requestId: string; dataLength: number; encodedDataLength: number }) => void;
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

export function createHandleDataReceived(tabId: number): DataHandler {
  return ({ requestId }) => {
    try {
      const url = pendingRequests.get(requestId);
      if (!url) return;
      void capturePartialStream(requestId, url, tabId);
    } catch (error) {
      reportError("background-handler", error as Error, { handler: "dataReceived" });
    }
  };
}

export function createHandleLoadingFinished(tabId: number): LoadingHandler {
  return ({ requestId }) => {
    try {
      const url = pendingRequests.get(requestId);
      if (!url) return;
      pendingRequests.delete(requestId);
      clearStreamBuffer(requestId);
      void captureFinalStream(requestId, url, tabId);
    } catch (error) {
      reportError("background-handler", error as Error, { handler: "loadingFinished" });
    }
  };
}

export function createDebuggerListener(tabId: number): (source: chrome.debugger.Debuggee, method: string, params?: object) => void {
  const handleData = createHandleDataReceived(tabId);
  const handleLoading = createHandleLoadingFinished(tabId);
  return (_source, method, params) => {
    try {
      if (_source.tabId !== tabId) return;
      const event = { method, params } as DebuggerEvent;
      if (event.method === "Network.responseReceived") handleResponseReceived(event.params as Parameters<ResponseHandler>[0]);
      if (event.method === "Network.dataReceived") handleData(event.params as Parameters<DataHandler>[0]);
      if (event.method === "Network.loadingFinished") handleLoading(event.params as Parameters<LoadingHandler>[0]);
    } catch (error) {
      reportError("background-listener", error as Error, { method });
    }
  };
}
