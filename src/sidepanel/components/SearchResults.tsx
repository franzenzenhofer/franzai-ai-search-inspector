import type { SearchResultGroup } from "@/types-search";

interface Props {
  groups: SearchResultGroup[];
}

function ResultEntry({ url, title, snippet, authority }: { url: string; title: string; snippet: string; authority?: number | undefined }): JSX.Element {
  return (
    <div className="result-entry">
      <div className="result-title">
        <a href={url} target="_blank" rel="noopener noreferrer">{title}</a>
        {authority !== undefined && <span className="badge">{authority}</span>}
      </div>
      <div className="result-snippet small">{snippet}</div>
      <div className="result-url small">{url}</div>
    </div>
  );
}

function GroupSection({ domain, entries }: SearchResultGroup): JSX.Element {
  return (
    <div className="result-group">
      <h4 className="result-domain">{domain}</h4>
      {entries.map((e, i) => <ResultEntry key={i} {...e} />)}
    </div>
  );
}

export function SearchResults({ groups }: Props): JSX.Element {
  if (groups.length === 0) return <div className="empty small">No search results</div>;
  return <div className="search-results">{groups.map((g, i) => <GroupSection key={i} {...g} />)}</div>;
}
