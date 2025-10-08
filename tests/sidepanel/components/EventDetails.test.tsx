import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventDetails } from "@/sidepanel/components/EventDetails";
import type { UiStreamRow } from "@/types";

const mockStream: UiStreamRow = {
  kind: "sse",
  url: "https://example.com/api/conversation",
  events: [{ event: "message", data: { text: "hello" }, rawBlock: 'event: message\ndata: {"text":"hello"}' }],
  parsed: { url: "https://example.com/api/conversation", contentType: "text/event-stream", events: [{ event: "message", data: { text: "hello" }, rawBlock: 'event: message\ndata: {"text":"hello"}' }], summary: { conversationIds: new Set(), requestIds: new Set(), messageIds: new Set(), modelSlugs: new Set() } }
};

describe("EventDetails empty state", () => {
  it("shows empty message when no stream selected", () => {
    render(<EventDetails stream={null} visibility="masked" />);
    expect(screen.getByText("Select a stream to view details")).toBeInTheDocument();
  });
});

describe("EventDetails stream URL", () => {
  it("displays stream URL", () => {
    render(<EventDetails stream={mockStream} visibility="masked" />);
    expect(screen.getByText("https://example.com/api/conversation")).toBeInTheDocument();
  });
});

describe("EventDetails SSE heading", () => {
  it("displays SSE Events heading", () => {
    render(<EventDetails stream={mockStream} visibility="masked" />);
    expect(screen.getByText("SSE Events")).toBeInTheDocument();
  });
});

describe("EventDetails event data", () => {
  it("displays event data", () => {
    render(<EventDetails stream={mockStream} visibility="masked" />);
    expect(screen.getByText(/"text": "hello"/)).toBeInTheDocument();
  });
});
