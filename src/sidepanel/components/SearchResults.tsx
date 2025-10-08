import type { SearchResultGroup, SearchResultEntry as Entry } from "@/types-search";

interface Props {
  groups: SearchResultGroup[];
}

function Metadata({ data }: { data?: Record<string, unknown> | undefined }): JSX.Element | null {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="result-metadata small">
      {Object.entries(data).map(([k, v]) => (
        <span key={k} className="metadata-item">{k}: {JSON.stringify(v)}</span>
      ))}
    </div>
  );
}

function Badges({ authority, rank, score }: { authority?: number | undefined; rank?: number | undefined; score?: number | undefined }): JSX.Element | null {
  const hasAny = authority !== undefined || rank !== undefined || score !== undefined;
  if (!hasAny) return null;
  return (
    <>
      {authority !== undefined && <span className="badge">auth:{authority}</span>}
      {rank !== undefined && <span className="badge">rank:{rank}</span>}
      {score !== undefined && <span className="badge">score:{score}</span>}
    </>
  );
}

function ExtraMeta({ author, published_date, last_updated }: { author?: string | undefined; published_date?: string | undefined; last_updated?: string | undefined }): JSX.Element | null {
  const hasAny = author || published_date || last_updated;
  if (!hasAny) return null;
  return (
    <>
      {author && <div className="result-author small">Author: {author}</div>}
      {published_date && <div className="result-date small">Published: {published_date}</div>}
      {last_updated && <div className="result-date small">Updated: {last_updated}</div>}
    </>
  );
}

function ResultEntry(e: Entry): JSX.Element {
  return (
    <div className="result-entry">
      <div className="result-title">
        <a href={e.url} target="_blank" rel="noopener noreferrer">{e.title}</a>
        <Badges authority={e.authority} rank={e.rank} score={e.score} />
      </div>
      <div className="result-snippet small">{e.snippet}</div>
      <div className="result-url small">{e.url}</div>
      <ExtraMeta author={e.author} published_date={e.published_date} last_updated={e.last_updated} />
      <Metadata data={e.metadata} />
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
