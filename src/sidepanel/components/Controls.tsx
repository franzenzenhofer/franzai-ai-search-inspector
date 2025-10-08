interface ControlsProps {
  capturing: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
}

function CaptureButton({ capturing, onStart, onStop }: { capturing: boolean; onStart: () => void; onStop: () => void }): JSX.Element {
  if (!capturing) return <button className="btn primary" onClick={onStart} type="button">Start Capture</button>;
  return <button className="btn" onClick={onStop} type="button">Stop Capture</button>;
}

export function Controls({ capturing, onStart, onStop, onClear, onExport }: ControlsProps): JSX.Element {
  return (
    <div className="toolbar">
      <CaptureButton capturing={capturing} onStart={onStart} onStop={onStop} />
      <button className="btn" onClick={onClear} type="button">Clear</button>
      <button className="btn" onClick={onExport} type="button">Export JSON</button>
    </div>
  );
}
