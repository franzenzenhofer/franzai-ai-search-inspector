import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StreamTable } from "@/sidepanel/components/StreamTable";
import type { CapturedStream } from "@/types";

const mockStreams: CapturedStream[] = [
  { timestamp: 1700000000000, url: "https://example.com/api/conversation", requestId: "req-1", body: "data" },
  { timestamp: 1700000001000, url: "https://example.com/api/upload", requestId: "req-2", body: "data2" }
];

describe("StreamTable empty state", () => {
  it("renders empty table with headers", () => {
    render(<StreamTable streams={[]} onSelect={vi.fn()} selected={null} />);
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Request ID")).toBeInTheDocument();
  });
});

describe("StreamTable with data", () => {
  it("renders stream rows", () => {
    render(<StreamTable streams={mockStreams} onSelect={vi.fn()} selected={null} />);
    expect(screen.getByText("/api/conversation")).toBeInTheDocument();
    expect(screen.getByText("req-1")).toBeInTheDocument();
  });
});

describe("StreamTable selection", () => {
  it("calls onSelect when row clicked", async () => {
    const onSelect = vi.fn();
    render(<StreamTable streams={mockStreams} onSelect={onSelect} selected={null} />);
    await userEvent.click(screen.getByText("req-1"));
    expect(onSelect).toHaveBeenCalledWith(mockStreams[0]);
  });
});

describe("StreamTable selected styling", () => {
  it("applies selected class to selected row", () => {
    const selected = mockStreams[0];
    if (!selected) throw new Error("Test data invalid");
    const { container } = render(<StreamTable streams={mockStreams} onSelect={vi.fn()} selected={selected} />);
    const rows = container.querySelectorAll(".row");
    expect(rows[0]).toHaveClass("selected");
  });
});
