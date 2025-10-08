import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchQueries } from "@/sidepanel/components/SearchQueries";
import type { SearchQuery } from "@/types-search";

describe("SearchQueries empty state", () => {
  it("shows empty message when no queries", () => {
    render(<SearchQueries queries={[]} />);
    expect(screen.getByText("No search queries")).toBeInTheDocument();
  });
});

describe("SearchQueries with data", () => {
  const queries: SearchQuery[] = [
    { query: "test query 1", timestamp: 1704067200 },
    { query: "test query 2", timestamp: undefined },
  ];

  it("renders query text", () => {
    render(<SearchQueries queries={queries} />);
    expect(screen.getByText("test query 1")).toBeInTheDocument();
    expect(screen.getByText("test query 2")).toBeInTheDocument();
  });

  it("formats timestamp when present", () => {
    render(<SearchQueries queries={queries} />);
    const badges = screen.getAllByRole("generic", { hidden: true });
    const hasBadgeWithTime = badges.some((badge) => badge.textContent !== "—" && badge.className.includes("badge"));
    expect(hasBadgeWithTime).toBe(true);
  });

  it("shows dash when timestamp missing", () => {
    render(<SearchQueries queries={queries} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
