import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { githubGet, resetRateLimit } from "../api/client";
import { mockFetch } from "../test/fetch";
import { RateLimitStatus } from "./RateLimitStatus";

afterEach(() => resetRateLimit());

describe("RateLimitStatus", () => {
  it("renders nothing before any request", () => {
    const { container } = render(<RateLimitStatus />);
    expect(container).toBeEmptyDOMElement();
  });

  it("updates after a request and flags a low budget", async () => {
    mockFetch({
      "/users/a": { body: {} },
      "/users/b": { body: {}, headers: { "x-ratelimit-remaining": "3" } },
    });
    render(<RateLimitStatus />);
    await githubGet("/users/a");
    expect(await screen.findByText("57 of 60")).toBeInTheDocument();
    await githubGet("/users/b");
    const status = await screen.findByText("3 of 60");
    expect(status.parentElement).toHaveClass("rate-low");
  });
});
