import { describe, it, expect } from "vitest";
import { extractQueries, extractResults, extractEntry, extractGroup } from "@/lib/searchExtractors";

describe("extractQueries", () => {
  it("returns empty for no queries", () => {
    expect(extractQueries({})).toEqual([]);
  });

  it("extracts query array", () => {
    const obj = {
      search_model_queries: [
        { query: "q1" },
        { query: "q2", timestamp: 456 },
      ],
    };
    const result = extractQueries(obj);
    expect(result).toHaveLength(2);
    expect(result[0]?.query).toBe("q1");
  });

  it("filters non-objects", () => {
    const obj = { search_model_queries: ["invalid", null, { query: "valid" }] };
    const result = extractQueries(obj);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.query)).toContain("invalid");
    expect(result.map((r) => r.query)).toContain("valid");
  });
});

describe("extractResults", () => {
  it("returns empty for no results", () => {
    expect(extractResults({})).toEqual([]);
  });

  it("extracts result groups", () => {
    const obj = {
      search_result_groups: [
        { domain: "test.com", entries: [] },
      ],
    };
    const result = extractResults(obj);
    expect(result).toHaveLength(1);
    expect(result[0]?.domain).toBe("test.com");
  });
});

describe("extractEntry", () => {
  it("extracts entry data", () => {
    const e = { url: "http://t.com", title: "T", snippet: "S" };
    const result = extractEntry(e);
    expect(result.url).toBe("http://t.com");
    expect(result.title).toBe("T");
    expect(result.snippet).toBe("S");
  });

  it("handles missing optional fields", () => {
    const e = { url: "http://t.com", title: "T", snippet: "S" };
    const result = extractEntry(e);
    expect(result.thumbnail).toBeUndefined();
    expect(result.authority).toBeUndefined();
  });

  it("extracts optional fields", () => {
    const e = {
      url: "http://t.com",
      title: "T",
      snippet: "S",
      thumbnail: "thumb.jpg",
      authority: 0.9,
    };
    const result = extractEntry(e);
    expect(result.thumbnail).toBe("thumb.jpg");
    expect(result.authority).toBe(0.9);
  });
});

describe("extractGroup", () => {
  it("extracts group with entries", () => {
    const g = {
      domain: "test.com",
      entries: [{ url: "http://t.com", title: "T", snippet: "S" }],
    };
    const result = extractGroup(g);
    expect(result.domain).toBe("test.com");
    expect(result.entries).toHaveLength(1);
  });
});
