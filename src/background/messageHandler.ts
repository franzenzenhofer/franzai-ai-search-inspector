import { reportError } from "@/errors/errorReporter";

type MessageHandler = (message: { action: string; tabId?: number }, sendResponse: (response: { success: boolean; error?: string }) => void, effectStart: (tabId: number) => void, effectStop: () => void) => void;

export const handleMessage: MessageHandler = (message, sendResponse, effectStart, effectStop) => {
  try {
    if (message.action === "start-capture" && message.tabId) {
      effectStart(message.tabId);
      sendResponse({ success: true });
    }
    if (message.action === "stop-capture") {
      effectStop();
      sendResponse({ success: true });
    }
  } catch (error) {
    reportError("background-worker", error as Error, { action: message.action });
    sendResponse({ success: false, error: (error as Error).message });
  }
};
