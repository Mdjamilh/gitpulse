import { describe, expect, it } from "vitest";
import { mockFetch } from "../test/fetch";
import { RateLimitError } from "./client";
import { fetchHasProfileReadme, fetchRepos, isValidUsername } from "./endpoints";

const reposPath = (page: number) => `/users/big/repos?per_page=100&type=owner&sort=pushed&page=${page}`;
const repo = (id: number) => ({ id, name: `r${id}` });

describe("isValidUsername", () => {
  it.each(["octocat", "a", "Mdjamilh", "some-user", "x".repeat(39)])("accepts %s", (name) => {
    expect(isValidUsername(name)).toBe(true);
  });

  it.each(["", "-lead", "trail-", "dou--ble", "has space", "x".repeat(40), "../etc"])(
    "rejects %j",
    (name) => {
      expect(isValidUsername(name)).toBe(false);
    },
  );
});

describe("fetchRepos", () => {
  it("follows full pages and stops at a short one", async () => {
    const fetch = mockFetch({
      [reposPath(1)]: { body: Array.from({ length: 100 }, (_, i) => repo(i)) },
      [reposPath(2)]: { body: [repo(100), repo(101)] },
    });
    const repos = await fetchRepos("big");
    expect(repos).toHaveLength(102);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("caps the number of pages", async () => {
    const full = { body: Array.from({ length: 100 }, (_, i) => repo(i)) };
    const fetch = mockFetch({ [reposPath(1)]: full, [reposPath(2)]: full, [reposPath(3)]: full });
    await fetchRepos("big");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

describe("fetchHasProfileReadme", () => {
  it("is true when the README exists and false on 404", async () => {
    mockFetch({ "/repos/octocat/octocat/readme": { body: { name: "README.md" } } });
    await expect(fetchHasProfileReadme("octocat")).resolves.toBe(true);
    await expect(fetchHasProfileReadme("someone")).resolves.toBe(false);
  });

  it("still surfaces rate limit errors", async () => {
    mockFetch({
      "/repos/octocat/octocat/readme": { status: 403, headers: { "x-ratelimit-remaining": "0" } },
    });
    await expect(fetchHasProfileReadme("octocat")).rejects.toBeInstanceOf(RateLimitError);
  });
});
