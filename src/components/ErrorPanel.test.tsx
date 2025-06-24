import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BadTokenError, GitHubError, NotFoundError, RateLimitError } from "../api/client";
import { ErrorPanel } from "./ErrorPanel";

afterEach(() => vi.useRealTimers());

describe("ErrorPanel", () => {
  it("explains an unknown user", () => {
    render(<ErrorPanel error={new NotFoundError()} username="nobody" onRetry={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent('No GitHub user called "nobody"');
  });

  it("shows the rate limit reset time and enables retry once it passes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const resetAt = new Date(Date.now() + 90_000);
    const onRetry = vi.fn();
    render(<ErrorPanel error={new RateLimitError(resetAt)} username="octocat" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("in about 2 minutes");
    expect(screen.getByRole("button", { name: "Waiting for reset" })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });
    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry).toBeEnabled();
    vi.useRealTimers();
    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalled();
  });

  it("explains a rejected token", () => {
    render(<ErrorPanel error={new BadTokenError()} username="octocat" onRetry={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("did not accept the access token");
  });

  it("falls back to the error message with a retry button", async () => {
    const onRetry = vi.fn();
    render(<ErrorPanel error={new GitHubError("Server error", 502)} username="octocat" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Server error");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
