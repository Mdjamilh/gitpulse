import { describe, expect, it } from "vitest";
import { makeRepo } from "../test/factories";
import { lastPush, ownRepos, repoTotals, topRepos } from "./repos";

describe("repo helpers", () => {
  const repos = [
    makeRepo({ name: "small", stargazers_count: 1 }),
    makeRepo({ name: "big", stargazers_count: 50, forks_count: 3 }),
    makeRepo({ name: "tie-more-forks", stargazers_count: 1, forks_count: 9 }),
    makeRepo({ name: "forked", fork: true, stargazers_count: 999 }),
    makeRepo({ name: "old", archived: true, stargazers_count: 500 }),
  ];

  it("excludes forks and archived repos", () => {
    expect(ownRepos(repos).map((r) => r.name)).toEqual(["small", "big", "tie-more-forks"]);
  });

  it("ranks by stars, then forks", () => {
    expect(topRepos(repos).map((r) => r.name)).toEqual(["big", "tie-more-forks", "small"]);
    expect(topRepos(repos, 1)).toHaveLength(1);
  });

  it("breaks full ties by most recent push", () => {
    const a = makeRepo({ name: "a", pushed_at: "2026-01-01T00:00:00Z" });
    const b = makeRepo({ name: "b", pushed_at: "2026-06-01T00:00:00Z" });
    expect(topRepos([a, b]).map((r) => r.name)).toEqual(["b", "a"]);
  });

  it("totals stars and forks for own repos only", () => {
    expect(repoTotals(repos)).toEqual({ count: 3, stars: 52, forks: 12 });
  });

  it("finds the latest push", () => {
    expect(
      lastPush([
        makeRepo({ pushed_at: "2026-02-01T00:00:00Z" }),
        makeRepo({ pushed_at: null }),
        makeRepo({ pushed_at: "2026-09-01T00:00:00Z" }),
      ]),
    ).toBe("2026-09-01T00:00:00Z");
    expect(lastPush([])).toBeNull();
  });
});
