import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StreamTable } from "@/sidepanel/components/StreamTable";
import type { UiStreamRow } from "@/types";

const mockRows: UiStreamRow[] = [
  { kind: "sse", url: "https://example.com/api/conversation", events: [{ event: "message", data: { text: "hi" }, rawBlock: "event: message\ndata: {\"text\":\"hi\"}" }], parsed: { url: "https://example.com/api/conversation", contentType: "text/event-stream", events: [{ event: "message", data: { text: "hi" }, rawBlock: "event: message\ndata: {\"text\":\"hi\"}" }], summary: { conversationIds: new Set(), requestIds: new Set(["req-1"]), messageIds: new Set(), modelSlugs: new Set(["gpt-4"]) } } },
  { kind: "jsonl", url: "https://example.com/api/upload", parsed: { url: "https://example.com/api/upload", items: [{ line: "{\"foo\":1}" }, { line: "{\"bar\":2}" }] } }
];

describe("StreamTable empty", () => {
  it("shows empty message", () => {
    render(<StreamTable rows={[]} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/No captured requests yet/)).toBeInTheDocument();
  });
});

describe("StreamTable headers", () => {
  it("renders column headers", () => {
    render(<StreamTable rows={mockRows} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });
});

describe("StreamTable rows", () => {
  it("renders SSE badges and summary", () => {
    render(<StreamTable rows={mockRows} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getByText("SSE")).toBeInTheDocument();
    expect(screen.getByText(/events: 1/)).toBeInTheDocument();
    expect(screen.getByText(/model: gpt-4/)).toBeInTheDocument();
  });

  it("renders JSONL badges and summary", () => {
    render(<StreamTable rows={mockRows} selectedIndex={null} onSelect={vi.fn()} />);
    expect(screen.getByText("JSONL")).toBeInTheDocument();
    expect(screen.getByText(/lines: 2/)).toBeInTheDocument();
  });
});

describe("StreamTable selection", () => {
  it("calls onSelect with index when row clicked", async () => {
    const onSelect = vi.fn();
    render(<StreamTable rows={mockRows} selectedIndex={null} onSelect={onSelect} />);
    const sseRow = screen.getByText("SSE").closest("tr");
    if (!sseRow) throw new Error("SSE row not found");
    await userEvent.click(sseRow);
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});
