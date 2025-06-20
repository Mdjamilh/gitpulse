import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { GitHubError, NotFoundError, RateLimitError } from "./api/client";
import { createQueryClient, isFinalError, useUser } from "./hooks";
import { mockFetch } from "./test/fetch";
import { TokenProvider } from "./token";

describe("isFinalError", () => {
  it("does not retry 404, rate limits or bad tokens", () => {
    expect(isFinalError(new NotFoundError())).toBe(true);
    expect(isFinalError(new RateLimitError(new Date()))).toBe(true);
    expect(isFinalError(new GitHubError("boom", 500))).toBe(false);
  });
});

describe("useUser", () => {
  it("loads a user and shares the cache across case variants", async () => {
    const fetch = mockFetch({ "/users/octocat": { body: { login: "octocat" } } });
    const client = createQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <TokenProvider>{children}</TokenProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useUser("octocat"), { wrapper });
    await waitFor(() => expect(result.current.data?.login).toBe("octocat"));
    expect(client.getQueryData(["user", "octocat"])).toEqual({ login: "octocat" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("stays idle without a username", () => {
    const fetch = mockFetch({});
    const client = createQueryClient();
    const { result } = renderHook(() => useUser(""), {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(fetch).not.toHaveBeenCalled();
  });
});
