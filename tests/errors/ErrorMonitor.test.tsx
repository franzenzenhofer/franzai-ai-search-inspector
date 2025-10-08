import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorMonitor } from "@/errors/ErrorMonitor";
import { reportError } from "@/errors/errorReporter";
import { clearErrors } from "@/errors/errorStore";

beforeEach(() => {
  clearErrors();
});

describe("ErrorMonitor empty state", () => {
  it("shows 0 errors when no errors reported", () => {
    render(<ErrorMonitor />);
    expect(screen.getByText("0 errors")).toBeInTheDocument();
  });
});

describe("ErrorMonitor with errors", () => {
  it("shows error count when errors exist", () => {
    reportError("ui-component", new Error("test error"), {});
    render(<ErrorMonitor />);
    expect(screen.getByText("1 error")).toBeInTheDocument();
  });
});

describe("ErrorMonitor badge click", () => {
  it("expands error list when badge clicked", async () => {
    reportError("ui-component", new Error("test error"), {});
    render(<ErrorMonitor />);
    await userEvent.click(screen.getByText("1 error"));
    expect(screen.getByText("Errors")).toBeInTheDocument();
  });
});

describe("ErrorMonitor close button", () => {
  it("collapses error list when close clicked", async () => {
    reportError("ui-component", new Error("test error"), {});
    render(<ErrorMonitor />);
    await userEvent.click(screen.getByText("1 error"));
    await userEvent.click(screen.getByText("Close"));
    expect(screen.queryByText("Errors")).not.toBeInTheDocument();
  });
});

describe("ErrorMonitor clear button", () => {
  it("clears errors when clear clicked", async () => {
    reportError("ui-component", new Error("test error"), {});
    render(<ErrorMonitor />);
    await userEvent.click(screen.getByText("1 error"));
    await userEvent.click(screen.getByText("Clear"));
    expect(screen.getByText("0 errors")).toBeInTheDocument();
  });
});
