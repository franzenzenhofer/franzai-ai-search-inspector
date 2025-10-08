import type { SecretVisibility } from "@/types";

interface SecretToggleProps {
  visibility: SecretVisibility;
  onToggle: () => void;
}

export function SecretToggle({ visibility, onToggle }: SecretToggleProps): JSX.Element {
  return (
    <button
      className="btn"
      onClick={onToggle}
      type="button"
      aria-label={visibility === "masked" ? "Show secrets" : "Hide secrets"}
    >
      {visibility === "masked" ? "Show Secrets" : "Hide Secrets"}
    </button>
  );
}
