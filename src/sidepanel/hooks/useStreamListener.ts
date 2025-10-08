import { useEffect } from "react";
import { classifyStream } from "../lib/streamClassifier";
import type { CapturedStream, UiStreamRow } from "@/types";

export function useStreamListener(setRows: (updater: (prev: UiStreamRow[]) => UiStreamRow[]) => void): void {
  useEffect(() => {
    const handleMessage = (msg: unknown): void => {
      const message = msg as { _from?: string; kind?: string; data?: CapturedStream };
      if (message?._from === "bg" && message.kind === "capture" && message.data) {
        setRows((prev) => [classifyStream(message.data as CapturedStream), ...prev]);
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return (): void => { chrome.runtime.onMessage.removeListener(handleMessage); };
  }, [setRows]);
}
