import { Controls } from "./Controls";
import { SecretToggle } from "./SecretToggle";
import { StreamTable } from "./StreamTable";
import { EventDetails } from "./EventDetails";
import { ErrorMonitor } from "@/errors/ErrorMonitor";
import type { CapturedStream, SecretVisibility, UiStreamRow } from "@/types";

interface AppLayoutProps {
  capturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
  visibility: SecretVisibility;
  onToggle: () => void;
  streams: CapturedStream[];
  onSelect: (s: CapturedStream) => void;
  selected: CapturedStream | null;
  selectedStream: UiStreamRow | null;
}

export function AppLayout(props: AppLayoutProps): JSX.Element {
  return (
    <div className="app-container">
      <div className="toolbar">
        <Controls capturing={props.capturing} onStart={props.onStart} onStop={props.onStop} onClear={props.onClear} onExport={props.onExport} />
        <SecretToggle visibility={props.visibility} onToggle={props.onToggle} />
      </div>
      <StreamTable streams={props.streams} onSelect={props.onSelect} selected={props.selected} />
      <EventDetails stream={props.selectedStream} visibility={props.visibility} />
      <ErrorMonitor />
    </div>
  );
}
