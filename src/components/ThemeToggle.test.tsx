import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "./ThemeToggle";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("ThemeToggle", () => {
  it("cycles system, light and dark and remembers the choice", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Theme: system");

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("gitpulse:theme")).toBe("light");

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await userEvent.click(button);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem("gitpulse:theme")).toBeNull();
  });

  it("starts from a saved preference", () => {
    localStorage.setItem("gitpulse:theme", "dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Color theme: dark. Switch to system.");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
