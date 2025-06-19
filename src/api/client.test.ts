import { afterEach, describe, expect, it } from "vitest";
import { mockFetch } from "../test/fetch";
import {
  BadTokenError,
  GitHubError,
  NotFoundError,
  RateLimitError,
  getRateLimit,
  githubGet,
  parseRateLimit,
  resetRateLimit,
} from "./client";

afterEach(() => resetRateLimit());

describe("githubGet", () => {
  it("returns JSON and records the rate limit", async () => {
    mockFetch({ "/users/octocat": { body: { login: "octocat" } } });
    await expect(githubGet("/users/octocat")).resolves.toEqual({ login: "octocat" });
    expect(getRateLimit()).toEqual({
      limit: 60,
      remaining: 57,
      resetAt: new Date(1792000000 * 1000),
    });
  });

  it("serves repeat requests from sessionStorage", async () => {
    const fetch = mockFetch({ "/users/octocat": { body: { login: "octocat" } } });
    await githubGet("/users/octocat");
    await githubGet("/users/octocat");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("can bypass the cache", async () => {
    const fetch = mockFetch({ "/users/octocat": { body: { login: "octocat" } } });
    await githubGet("/users/octocat", { cache: false });
    await githubGet("/users/octocat", { cache: false });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sessionStorage.length).toBe(0);
  });

  it("sends the token only as a bearer header", async () => {
    const fetch = mockFetch({ "/users/octocat": { body: {} } });
    await githubGet("/users/octocat", { token: "ghp_example" });
    const init = fetch.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer ghp_example");
    expect(JSON.stringify(sessionStorage)).not.toContain("ghp_example");
  });

  it("maps 404 to NotFoundError", async () => {
    mockFetch({});
    await expect(githubGet("/users/nobody")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("maps an exhausted 403 to RateLimitError with the reset time", async () => {
    mockFetch({
      "/users/octocat": {
        status: 403,
        body: { message: "API rate limit exceeded" },
        headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1792000600" },
      },
    });
    const err = await githubGet("/users/octocat").catch((e: Error) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).resetAt).toEqual(new Date(1792000600 * 1000));
  });

  it("treats retry-after as a secondary rate limit", async () => {
    mockFetch({
      "/users/octocat": { status: 429, headers: { "retry-after": "30" } },
    });
    await expect(githubGet("/users/octocat")).rejects.toBeInstanceOf(RateLimitError);
  });

  it("maps 401 to BadTokenError", async () => {
    mockFetch({ "/users/octocat": { status: 401 } });
    await expect(githubGet("/users/octocat", { token: "bad" })).rejects.toBeInstanceOf(BadTokenError);
  });

  it("uses the API message for other errors", async () => {
    mockFetch({ "/users/octocat": { status: 500, body: { message: "Server exploded" } } });
    const err = (await githubGet("/users/octocat").catch((e: Error) => e)) as Error;
    expect(err).toBeInstanceOf(GitHubError);
    expect(err.message).toBe("Server exploded");
    expect(sessionStorage.length).toBe(0);
  });
});

describe("parseRateLimit", () => {
  it("returns null when headers are missing or malformed", () => {
    expect(parseRateLimit(new Headers())).toBeNull();
    expect(
      parseRateLimit(
        new Headers({ "x-ratelimit-limit": "60", "x-ratelimit-remaining": "x", "x-ratelimit-reset": "1" }),
      ),
    ).toBeNull();
  });
});
