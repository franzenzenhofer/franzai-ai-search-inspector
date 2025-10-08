import { describe, it, expect } from "vitest";
import { extractSearchData } from "@/lib/searchExtract";

describe("extractSearchData", () => {
  it("returns empty result for null", () => {
    const result = extractSearchData(null);
    expect(result.searchQueries).toEqual([]);
    expect(result.searchResults).toEqual([]);
  });

  it("returns empty for undefined", () => {
    const result = extractSearchData(undefined);
    expect(result.searchQueries).toEqual([]);
  });

  it("extracts title and model slug", () => {
    const data = {
      title: "Test Title",
      model_slug: "gpt-5-instant",
      conversation_id: "abc123",
    };
    const result = extractSearchData(data);
    expect(result.title).toBe("Test Title");
    expect(result.modelSlug).toBe("gpt-5-instant");
    expect(result.conversationId).toBe("abc123");
  });

  it("extracts timestamps", () => {
    const data = { create_time: 1234567, update_time: 7654321 };
    const result = extractSearchData(data);
    expect(result.createTime).toBe(1234567);
    expect(result.updateTime).toBe(7654321);
  });

  it("extracts search queries", () => {
    const data = {
      search_model_queries: [{ query: "test query", timestamp: 123 }],
    };
    const result = extractSearchData(data);
    expect(result.searchQueries).toHaveLength(1);
    expect(result.searchQueries[0]?.query).toBe("test query");
  });

  it("extracts search results", () => {
    const data = {
      search_result_groups: [
        {
          domain: "test.com",
          entries: [{ url: "http://test.com", title: "T", snippet: "S" }],
        },
      ],
    };
    const result = extractSearchData(data);
    expect(result.searchResults).toHaveLength(1);
    expect(result.searchResults[0]?.domain).toBe("test.com");
  });

  it("handles complete data", () => {
    const data = {
      title: "Title",
      conversation_id: "conv1",
      model_slug: "gpt-5",
      create_time: 123,
      update_time: 456,
      search_model_queries: [{ query: "q1" }],
      search_result_groups: [{ domain: "d.com", entries: [] }],
    };
    const result = extractSearchData(data);
    expect(result.title).toBe("Title");
    expect(result.conversationId).toBe("conv1");
    expect(result.modelSlug).toBe("gpt-5");
    expect(result.createTime).toBe(123);
    expect(result.updateTime).toBe(456);
    expect(result.searchQueries).toHaveLength(1);
    expect(result.searchResults).toHaveLength(1);
  });
});
