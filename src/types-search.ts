// Extended types for ChatGPT search data extraction

export interface SearchResultEntry {
  url: string;
  title: string;
  snippet: string;
  thumbnail?: string | undefined;
  authority?: number | undefined;
  favicon?: string | undefined;
  published_date?: string | undefined;
  last_updated?: string | undefined;
  author?: string | undefined;
  domain?: string | undefined;
  rank?: number | undefined;
  score?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface SearchResultGroup {
  domain: string;
  entries: SearchResultEntry[];
}

export interface ContentReference {
  cited_message_idx: number;
  reference_ids: string[];
  matched_text?: string | undefined;
  url?: string | undefined;
}

export interface SearchQuery {
  query: string;
  timestamp?: number | undefined;
}

export interface MessageContent {
  content_type: string;
  parts?: string[] | undefined;
  text?: string | undefined;
}

export interface ConversationMessage {
  id: string;
  author: { role: string };
  content?: MessageContent | undefined;
  create_time?: number | undefined;
  status?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  children?: string[] | undefined;
  parent?: string | undefined;
}
