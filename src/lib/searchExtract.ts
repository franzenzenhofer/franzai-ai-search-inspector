import type {
  ContentReference,
  SearchQuery,
  ConversationMessage,
} from "@/types-search";
import { extractQueries, extractResults } from "./searchExtractors";

export interface ExtractedData {
  title?: string | undefined;
  conversationId?: string | undefined;
  modelSlug?: string | undefined;
  searchQueries: SearchQuery[];
  searchResults: ReturnType<typeof extractResults>;
  contentRefs: ContentReference[];
  messages: ConversationMessage[];
  createTime?: number | undefined;
  updateTime?: number | undefined;
}

function extractMeta(obj: Record<string, unknown>): Partial<ExtractedData> {
  return {
    title: typeof obj.title === "string" ? obj.title : undefined,
    conversationId:
      typeof obj.conversation_id === "string" ? obj.conversation_id : undefined,
    modelSlug: typeof obj.model_slug === "string" ? obj.model_slug : undefined,
    createTime:
      typeof obj.create_time === "number" ? obj.create_time : undefined,
    updateTime:
      typeof obj.update_time === "number" ? obj.update_time : undefined,
  };
}

const emptyResult = (): ExtractedData => ({
  searchQueries: [],
  searchResults: [],
  contentRefs: [],
  messages: [],
});

export function extractSearchData(data: unknown): ExtractedData {
  if (!data || typeof data !== "object") return emptyResult();
  const obj = data as Record<string, unknown>;
  return {
    ...emptyResult(),
    ...extractMeta(obj),
    searchQueries: extractQueries(obj),
    searchResults: extractResults(obj),
  };
}
