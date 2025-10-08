import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "@/sidepanel/App";

const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  tabs: { query: vi.fn() }
};
global.chrome = mockChrome as unknown as typeof chrome;

beforeEach(() => {
  vi.clearAllMocks();
  mockChrome.tabs.query.mockResolvedValue([{ id: 123 }]);
  mockChrome.runtime.sendMessage.mockResolvedValue({});
});

describe("App rendering", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText("Start Capture")).toBeInTheDocument();
  });
});

describe("App components", () => {
  it("renders Controls component", () => {
    render(<App />);
    expect(screen.getByText("Start Capture")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
  });
});

describe("App secret toggle", () => {
  it("renders SecretToggle component", () => {
    render(<App />);
    expect(screen.getByText("Show Secrets")).toBeInTheDocument();
  });
});

describe("App empty state", () => {
  it("shows empty table when no streams", () => {
    render(<App />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });
});

describe("App error monitor", () => {
  it("renders ErrorMonitor component", () => {
    render(<App />);
    expect(screen.getByText("0 errors")).toBeInTheDocument();
  });
});
