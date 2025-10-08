import { useState, useEffect } from "react";
import { useCapture } from "./hooks/useCapture";
import { useStreamListener } from "./hooks/useStreamListener";
import { AppLayout } from "./components/AppLayout";
import type { SecretVisibility, UiStreamRow } from "@/types";

export function App(): JSX.Element {
  const { capturing, start, stop } = useCapture();
  const [rows, setRows] = useState<UiStreamRow[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<SecretVisibility>("visible");
  useStreamListener(setRows);
  useEffect(() => { void start(); }, [start]);

  const selected = selectedIndex !== null ? rows[selectedIndex] ?? null : null;
  return <AppLayout capturing={capturing} onStart={() => void start()} onStop={() => void stop()} onClear={() => { setRows([]); setSelectedIndex(null); }} onToggle={() => setVisibility((v) => v === "masked" ? "visible" : "masked")} onCopyReport={() => void navigator.clipboard.writeText(JSON.stringify(rows, null, 2))} visibility={visibility} rows={rows} selectedIndex={selectedIndex} onSelect={setSelectedIndex} selectedStream={selected} />;
}
