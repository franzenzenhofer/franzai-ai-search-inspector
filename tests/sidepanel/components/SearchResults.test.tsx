import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchResults } from "@/sidepanel/components/SearchResults";
import type { SearchResultGroup } from "@/types-search";

describe("SearchResults empty state", () => {
  it("shows empty message when no groups", () => {
    render(<SearchResults groups={[]} />);
    expect(screen.getByText("No search results")).toBeInTheDocument();
  });
});

describe("SearchResults with data", () => {
  const groups: SearchResultGroup[] = [
    {
      domain: "example.com",
      entries: [
        { url: "https://example.com/page1", title: "Example Page 1", snippet: "This is a snippet", authority: 95 },
        { url: "https://example.com/page2", title: "Example Page 2", snippet: "Another snippet" },
      ],
    },
  ];

  it("renders domain heading", () => {
    render(<SearchResults groups={groups} />);
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("renders result titles", () => {
    render(<SearchResults groups={groups} />);
    expect(screen.getByText("Example Page 1")).toBeInTheDocument();
    expect(screen.getByText("Example Page 2")).toBeInTheDocument();
  });

  it("renders result snippets", () => {
    render(<SearchResults groups={groups} />);
    expect(screen.getByText("This is a snippet")).toBeInTheDocument();
    expect(screen.getByText("Another snippet")).toBeInTheDocument();
  });

  it("renders authority badge when present", () => {
    render(<SearchResults groups={groups} />);
    expect(screen.getByText("95")).toBeInTheDocument();
  });
});
