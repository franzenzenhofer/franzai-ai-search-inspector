import { useState } from "react";
import { useCapture } from "./hooks/useCapture";
import { useStreamListener } from "./hooks/useStreamListener";
import { exportToJson } from "./lib/streamClassifier";
import { AppLayout } from "./components/AppLayout";
import type { CapturedStream, SecretVisibility, UiStreamRow } from "@/types";

function toRow(row: UiStreamRow, index: number): CapturedStream {
  return { timestamp: Date.now(), url: row.url, requestId: String(index), body: "" };
}

export function App(): JSX.Element {
  const { capturing, start, stop } = useCapture();
  const [rows, setRows] = useState<UiStreamRow[]>([]);
  const [selected, setSelected] = useState<UiStreamRow | null>(null);
  const [visibility, setVisibility] = useState<SecretVisibility>("masked");
  useStreamListener(setRows);

  const clear = (): void => { setRows([]); setSelected(null); };
  const toggle = (): void => setVisibility((v) => v === "masked" ? "visible" : "masked");
  const select = (s: CapturedStream): void => setSelected(rows.find((r) => r.url === s.url) ?? null);

  return <AppLayout capturing={capturing} onStart={() => void start()} onStop={() => void stop()} onClear={clear} onExport={() => exportToJson(rows)} visibility={visibility} onToggle={toggle} streams={rows.map(toRow)} onSelect={select} selected={selected ? toRow(selected, 0) : null} selectedStream={selected} />;
}
