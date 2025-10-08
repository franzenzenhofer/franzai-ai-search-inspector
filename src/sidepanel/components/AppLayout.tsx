import { Controls } from "./Controls";
import { SecretToggle } from "./SecretToggle";
import { GlobalSearchView } from "./GlobalSearchView";
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

function Inspector(props: { rows: UiStreamRow[]; selectedIndex: number | null; onSelect: (i: number) => void; selectedStream: UiStreamRow | null; visibility: SecretVisibility }): JSX.Element {
  return (
    <details className="json-inspector-section">
      <summary>JSON Inspector ({props.rows.length} {props.rows.length === 1 ? "request" : "requests"})</summary>
      <StreamTable rows={props.rows} selectedIndex={props.selectedIndex} onSelect={props.onSelect} />
      <EventDetails stream={props.selectedStream} visibility={props.visibility} />
    </details>
  );
}

export function AppLayout(props: AppLayoutProps): JSX.Element {
  return (
    <div className="app-container">
      <div className="toolbar">
        <Controls capturing={props.capturing} onStart={props.onStart} onStop={props.onStop} onClear={props.onClear} onCopyReport={props.onCopyReport} />
        <SecretToggle visibility={props.visibility} onToggle={props.onToggle} />
      </div>
      <div className="content-scroll">
        <GlobalSearchView rows={props.rows} />
        <Inspector rows={props.rows} selectedIndex={props.selectedIndex} onSelect={props.onSelect} selectedStream={props.selectedStream} visibility={props.visibility} />
      </div>
      <ErrorMonitor />
    </div>
  );
}
