// Extended types for ChatGPT search data extraction

export interface SearchResultEntry {
  url: string;
  title: string;
  snippet: string;
  thumbnail?: string;
  authority?: number;
}

export interface SearchResultGroup {
  domain: string;
  entries: SearchResultEntry[];
}

export interface ContentReference {
  cited_message_idx: number;
  reference_ids: string[];
  matched_text?: string;
  url?: string;
}

export interface SearchQuery {
  query: string;
  timestamp?: number;
}

export interface MessageContent {
  content_type: string;
  parts?: string[];
  text?: string;
}

export interface ConversationMessage {
  id: string;
  author: { role: string };
  content?: MessageContent;
  create_time?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  children?: string[];
  parent?: string;
}
