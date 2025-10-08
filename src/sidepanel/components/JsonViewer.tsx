interface Props {
  data: unknown;
  title?: string;
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: null/g, ': <span class="json-null">null</span>');
}

export function JsonViewer({ data, title = "Raw JSON" }: Props): JSX.Element {
  const json = JSON.stringify(data, null, 2);
  const highlighted = syntaxHighlight(json);
  return (
    <details className="json-viewer">
      <summary>{title} ({json.length.toLocaleString()} chars)</summary>
      <pre dangerouslySetInnerHTML={{ __html: highlighted }} />
    </details>
  );
}
