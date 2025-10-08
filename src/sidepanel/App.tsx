import { useState } from "react";
import { Controls } from "./components/Controls";
import { SecretToggle } from "./components/SecretToggle";
import { StreamTable } from "./components/StreamTable";
import { EventDetails } from "./components/EventDetails";
import { ErrorMonitor } from "@/errors/ErrorMonitor";
import { useCapture } from "./hooks/useCapture";
import type { CapturedStream, SecretVisibility } from "@/types";

interface ToolbarProps {
  capturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
  visibility: SecretVisibility;
  onToggle: () => void;
}

function Toolbar(props: ToolbarProps): JSX.Element {
  return (
    <div className="toolbar">
      <Controls capturing={props.capturing} onStart={props.onStart} onStop={props.onStop} onClear={props.onClear} onExport={props.onExport} />
      <SecretToggle visibility={props.visibility} onToggle={props.onToggle} />
    </div>
  );
}

function useAppState(): {
  streams: CapturedStream[];
  selected: CapturedStream | null;
  setSelected: (stream: CapturedStream | null) => void;
  visibility: SecretVisibility;
  toggleVisibility: () => void;
} {
  const [streams] = useState<CapturedStream[]>([]);
  const [selected, setSelected] = useState<CapturedStream | null>(null);
  const [visibility, setVisibility] = useState<SecretVisibility>("masked");
  const toggleVisibility = (): void => { setVisibility(visibility === "masked" ? "visible" : "masked"); };
  return { streams, selected, setSelected, visibility, toggleVisibility };
}

function createHandlers(start: () => Promise<void>, stop: () => Promise<void>, setSelected: (stream: CapturedStream | null) => void): {
  handleStart: () => void;
  handleStop: () => void;
  handleClear: () => void;
  handleExport: () => void;
} {
  return {
    handleStart: (): void => { void start(); },
    handleStop: (): void => { void stop(); },
    handleClear: (): void => { setSelected(null); },
    handleExport: (): void => { console.log("Export not implemented"); }
  };
}

export function App(): JSX.Element {
  const { capturing, start, stop } = useCapture();
  const { streams, selected, setSelected, visibility, toggleVisibility } = useAppState();
  const { handleStart, handleStop, handleClear, handleExport } = createHandlers(start, stop, setSelected);

  return (
    <div className="app-container">
      <Toolbar capturing={capturing} onStart={handleStart} onStop={handleStop} onClear={handleClear} onExport={handleExport} visibility={visibility} onToggle={toggleVisibility} />
      <StreamTable streams={streams} onSelect={setSelected} selected={selected} />
      <EventDetails stream={selected} visibility={visibility} />
      <ErrorMonitor />
    </div>
  );
}
