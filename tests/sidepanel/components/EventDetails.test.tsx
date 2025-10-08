import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventDetails } from "@/sidepanel/components/EventDetails";
import type { CapturedStream } from "@/types";

const mockStream: CapturedStream = {
  timestamp: 1700000000000,
  url: "https://example.com/api/conversation",
  requestId: "req-1",
  body: 'event: message\ndata: {"text":"hello"}\n\n'
};

describe("EventDetails empty state", () => {
  it("shows empty message when no stream selected", () => {
    render(<EventDetails stream={null} visibility="masked" />);
    expect(screen.getByText("Select a stream to view details")).toBeInTheDocument();
  });
});

describe("EventDetails with stream", () => {
  it("displays stream URL", () => {
    render(<EventDetails stream={mockStream} visibility="masked" />);
    expect(screen.getByText(/https:\/\/example\.com\/api\/conversation/)).toBeInTheDocument();
  });
});

describe("EventDetails request ID", () => {
  it("displays request ID", () => {
    render(<EventDetails stream={mockStream} visibility="masked" />);
    expect(screen.getByText(/req-1/)).toBeInTheDocument();
  });
});

describe("EventDetails timestamp", () => {
  it("displays ISO timestamp", () => {
    render(<EventDetails stream={mockStream} visibility="masked" />);
    expect(screen.getByText(/2023-11-14T22:13:20\.000Z/)).toBeInTheDocument();
  });
});

describe("EventDetails visibility", () => {
  it("masks long values when visibility is masked", () => {
    const longStream = { ...mockStream, requestId: "a".repeat(100) };
    const { container } = render(<EventDetails stream={longStream} visibility="masked" />);
    const value = container.querySelector(".detail-value");
    expect(value?.textContent).not.toContain("a".repeat(100));
  });
});
