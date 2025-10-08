import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controls } from "@/sidepanel/components/Controls";

const mockHandlers = { onStart: vi.fn(), onStop: vi.fn(), onClear: vi.fn(), onExport: vi.fn(), onCopyReport: vi.fn() };

describe("Controls not capturing", () => {
  it("shows start button when not capturing", () => {
    render(<Controls capturing={false} {...mockHandlers} />);
    expect(screen.getByText("Enable Capture")).toBeInTheDocument();
  });
});

describe("Controls capturing", () => {
  it("shows capturing status when capturing", () => {
    render(<Controls capturing={true} {...mockHandlers} />);
    expect(screen.getByText("● Capturing")).toBeInTheDocument();
  });
});

describe("Controls start interaction", () => {
  it("calls onStart when start clicked", async () => {
    const onStart = vi.fn();
    render(<Controls capturing={false} onStart={onStart} onStop={vi.fn()} onClear={vi.fn()} onExport={vi.fn()} onCopyReport={vi.fn()} />);
    await userEvent.click(screen.getByText("Enable Capture"));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("Controls clear interaction", () => {
  it("calls onClear when clear clicked", async () => {
    const onClear = vi.fn();
    render(<Controls capturing={false} onStart={vi.fn()} onStop={vi.fn()} onClear={onClear} onExport={vi.fn()} onCopyReport={vi.fn()} />);
    await userEvent.click(screen.getByText("Clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("Controls copy interaction", () => {
  it("calls onCopyReport when copy clicked", async () => {
    const onCopyReport = vi.fn();
    render(<Controls capturing={false} onStart={vi.fn()} onStop={vi.fn()} onClear={vi.fn()} onExport={vi.fn()} onCopyReport={onCopyReport} />);
    await userEvent.click(screen.getByText("Copy Full Report"));
    expect(onCopyReport).toHaveBeenCalledTimes(1);
  });
});

describe("Controls export interaction", () => {
  it("calls onExport when export clicked", async () => {
    const onExport = vi.fn();
    render(<Controls capturing={false} onStart={vi.fn()} onStop={vi.fn()} onClear={vi.fn()} onExport={onExport} onCopyReport={vi.fn()} />);
    await userEvent.click(screen.getByText("Export JSON"));
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
