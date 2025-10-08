import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SecretToggle } from "@/sidepanel/components/SecretToggle";

describe("SecretToggle masked state", () => {
  it("renders show button when masked", () => {
    render(<SecretToggle visibility="masked" onToggle={vi.fn()} />);
    expect(screen.getByText("Show Secrets")).toBeInTheDocument();
  });
});

describe("SecretToggle visible state", () => {
  it("renders hide button when visible", () => {
    render(<SecretToggle visibility="visible" onToggle={vi.fn()} />);
    expect(screen.getByText("Hide Secrets")).toBeInTheDocument();
  });
});

describe("SecretToggle interaction", () => {
  it("calls onToggle when clicked", async () => {
    const onToggle = vi.fn();
    render(<SecretToggle visibility="masked" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
