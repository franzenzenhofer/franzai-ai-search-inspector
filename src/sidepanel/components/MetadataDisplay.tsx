import type { ExtractedData } from "@/lib/searchExtract";

interface Props {
  data: ExtractedData;
}

function formatTime(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

function hasAnyMeta(d: ExtractedData): boolean {
  return !!(d.title || d.conversationId || d.modelSlug || d.createTime || d.updateTime);
}

function MetaGrid({ data }: { data: ExtractedData }): JSX.Element {
  return (
    <div className="metadata-grid">
      {data.title && <div className="metadata-item"><span className="metadata-label">Title:</span> {data.title}</div>}
      {data.conversationId && <div className="metadata-item"><span className="metadata-label">ID:</span> <code>{data.conversationId}</code></div>}
      {data.modelSlug && <div className="metadata-item"><span className="metadata-label">Model:</span> <span className="badge">{data.modelSlug}</span></div>}
      {data.createTime && <div className="metadata-item"><span className="metadata-label">Created:</span> {formatTime(data.createTime)}</div>}
      {data.updateTime && <div className="metadata-item"><span className="metadata-label">Updated:</span> {formatTime(data.updateTime)}</div>}
    </div>
  );
}

export function MetadataDisplay({ data }: Props): JSX.Element {
  if (!hasAnyMeta(data)) return <></>;
  return (
    <div className="metadata-section">
      <h4>Metadata</h4>
      <MetaGrid data={data} />
    </div>
  );
}
