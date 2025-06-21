import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchForm } from "./SearchForm";

describe("SearchForm", () => {
  it("submits a trimmed username without a leading @", async () => {
    const onSearch = vi.fn();
    render(<SearchForm initial="" onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText("GitHub username"), "  @octocat ");
    await userEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(onSearch).toHaveBeenCalledWith("octocat");
  });

  it("rejects invalid usernames with an accessible message", async () => {
    const onSearch = vi.fn();
    render(<SearchForm initial="" onSearch={onSearch} />);
    const input = screen.getByLabelText("GitHub username");
    await userEvent.type(input, "bad--name{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("not a valid GitHub username");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("asks for a name when empty", async () => {
    render(<SearchForm initial="" onSearch={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Analyze" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a GitHub username.");
  });

  it("offers example users", async () => {
    const onSearch = vi.fn();
    render(<SearchForm initial="" onSearch={onSearch} />);
    await userEvent.click(screen.getByRole("button", { name: "gaearon" }));
    expect(onSearch).toHaveBeenCalledWith("gaearon");
    expect(screen.getByLabelText("GitHub username")).toHaveValue("gaearon");
  });
});
