interface ControlsProps {
  capturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
  onCopyReport: () => void;
}

function CaptureButton({ capturing, onStart, onStop }: { capturing: boolean; onStart: () => void; onStop: () => void }): JSX.Element {
  if (!capturing) return <button className="btn primary" onClick={onStart} type="button">Enable Capture</button>;
  return <button className="btn success" onClick={onStop} type="button">● Capturing</button>;
}

export function Controls({ capturing, onStart, onStop, onClear, onExport, onCopyReport }: ControlsProps): JSX.Element {
  return (
    <div className="toolbar">
      <CaptureButton capturing={capturing} onStart={onStart} onStop={onStop} />
      <button className="btn" onClick={onClear} type="button">Clear</button>
      <button className="btn" onClick={onCopyReport} type="button">Copy Full Report</button>
      <button className="btn" onClick={onExport} type="button">Export JSON</button>
    </div>
  );
}
