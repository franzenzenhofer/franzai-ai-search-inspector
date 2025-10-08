import { Controls } from "./Controls";
import { SecretToggle } from "./SecretToggle";
import { StreamTable } from "./StreamTable";
import { EventDetails } from "./EventDetails";
import { ErrorMonitor } from "@/errors/ErrorMonitor";
import type { SecretVisibility, UiStreamRow } from "@/types";

interface AppLayoutProps {
  capturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onCopyReport: () => void;
  visibility: SecretVisibility;
  onToggle: () => void;
  rows: UiStreamRow[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  selectedStream: UiStreamRow | null;
}

export function AppLayout(props: AppLayoutProps): JSX.Element {
  return (
    <div className="app-container">
      <div className="toolbar">
        <Controls capturing={props.capturing} onStart={props.onStart} onStop={props.onStop} onClear={props.onClear} onCopyReport={props.onCopyReport} />
        <SecretToggle visibility={props.visibility} onToggle={props.onToggle} />
      </div>
      <StreamTable rows={props.rows} selectedIndex={props.selectedIndex} onSelect={props.onSelect} />
      <EventDetails stream={props.selectedStream} visibility={props.visibility} />
      <ErrorMonitor />
    </div>
  );
}
