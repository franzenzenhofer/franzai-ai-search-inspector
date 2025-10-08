import { reportError } from "@/errors/errorReporter";

export function isChatGptUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("chatgpt.com") || url.includes("chat.openai.com");
}

type StartFn = (tabId: number) => void;
type GetIdFn = () => number | null;

function onTabUpdated(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
  getCurrentTabId: GetIdFn,
  startCapture: StartFn
): void {
  try {
    if (changeInfo.status === "complete" && isChatGptUrl(tab.url)) {
      if (getCurrentTabId() !== tabId) startCapture(tabId);
    }
  } catch (error) {
    reportError("background-worker", error as Error, { action: "auto-capture" });
  }
}

function onTabActivated(
  activeInfo: chrome.tabs.TabActiveInfo,
  getCurrentTabId: GetIdFn,
  startCapture: StartFn
): void {
  try {
    void chrome.tabs.get(activeInfo.tabId).then((tab) => {
      if (isChatGptUrl(tab.url) && getCurrentTabId() !== activeInfo.tabId) {
        startCapture(activeInfo.tabId);
      }
    });
  } catch (error) {
    reportError("background-worker", error as Error, { action: "tab-activated" });
  }
}

export function setupAutoCapture(getCurrentTabId: GetIdFn, startCapture: StartFn): void {
  chrome.tabs.onUpdated.addListener((tid, ci, t) => onTabUpdated(tid, ci, t, getCurrentTabId, startCapture));
  chrome.tabs.onActivated.addListener((ai) => onTabActivated(ai, getCurrentTabId, startCapture));
}
