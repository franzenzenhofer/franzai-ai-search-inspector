import { useState } from "react";
import { useCapture } from "./hooks/useCapture";
import { useStreamListener } from "./hooks/useStreamListener";
import { exportToJson } from "./lib/streamClassifier";
import { AppLayout } from "./components/AppLayout";
import type { SecretVisibility, UiStreamRow } from "@/types";

export function App(): JSX.Element {
  const { capturing, start, stop } = useCapture();
  const [rows, setRows] = useState<UiStreamRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<SecretVisibility>("masked");
  useStreamListener(setRows);

  const clear = (): void => { setRows([]); setSelectedIndex(null); };
  const toggle = (): void => setVisibility((v) => v === "masked" ? "visible" : "masked");
  const selected = selectedIndex !== null ? rows[selectedIndex] ?? null : null;

  return <AppLayout capturing={capturing} onStart={() => void start()} onStop={() => void stop()} onClear={clear} onExport={() => exportToJson(rows)} visibility={visibility} onToggle={toggle} rows={rows} selectedIndex={selectedIndex} onSelect={setSelectedIndex} selectedStream={selected} />;
}
