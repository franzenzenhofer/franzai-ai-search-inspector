import { useState } from "react";
import { useErrorStore } from "./useErrorStore";
import type { ErrorEntry } from "./errorTypes";

function ErrorBadge({ count, onClick }: { count: number; onClick: () => void }): JSX.Element {
  if (count === 0) return <div className="error-badge empty">0 errors</div>;
  return (
    <button className="error-badge active" onClick={onClick} type="button">
      {count} {count === 1 ? "error" : "errors"}
    </button>
  );
}

function ErrorHeader({ clear, onClose }: { clear: () => void; onClose: () => void }): JSX.Element {
  return (
    <div className="error-header">
      <span>Errors</span>
      <div className="error-actions">
        <button className="btn" onClick={clear} type="button">Clear</button>
        <button className="btn" onClick={onClose} type="button">Close</button>
      </div>
    </div>
  );
}

function ErrorItems({ errors }: { errors: ErrorEntry[] }): JSX.Element {
  return (
    <div className="error-list">
      {errors.map((error, index) => (
        <div key={index} className="error-item">
          <div className="error-title">{error.source}: {error.message}</div>
          <pre className="error-stack mono">{error.stack}</pre>
        </div>
      ))}
    </div>
  );
}

function ErrorList({ onClose }: { onClose: () => void }): JSX.Element {
  const { errors, clear } = useErrorStore();
  return (
    <div className="error-panel">
      <ErrorHeader clear={clear} onClose={onClose} />
      <ErrorItems errors={errors} />
    </div>
  );
}

export function ErrorMonitor(): JSX.Element {
  const { errors } = useErrorStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="error-monitor">
      <ErrorBadge count={errors.length} onClick={() => setExpanded(!expanded)} />
      {expanded && <ErrorList onClose={() => setExpanded(false)} />}
    </div>
  );
}
