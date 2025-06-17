import { describe, expect, it } from "vitest";
import { makeEvent } from "../test/factories";
import { dailyCounts, describeEvent, eventKind, kindSummary } from "./activity";

describe("dailyCounts", () => {
  const now = new Date(2026, 9, 20, 15, 0); // 20 Oct 2026, local time

  it("fills every day in the window, oldest first", () => {
    const days = dailyCounts([], 7, now);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe("2026-10-14");
    expect(days[6].date).toBe("2026-10-20");
    expect(days.every((d) => d.count === 0)).toBe(true);
  });

  it("buckets events by local day and ignores ones outside the window", () => {
    const at = (d: number, h: number) => new Date(2026, 9, d, h).toISOString();
    const days = dailyCounts(
      [
        makeEvent({ created_at: at(20, 1) }),
        makeEvent({ created_at: at(20, 23) }),
        makeEvent({ created_at: at(18, 9) }),
        makeEvent({ created_at: at(1, 9) }),
      ],
      3,
      now,
    );
    expect(days).toEqual([
      { date: "2026-10-18", count: 1 },
      { date: "2026-10-19", count: 0 },
      { date: "2026-10-20", count: 2 },
    ]);
  });

  it("crosses month boundaries", () => {
    const days = dailyCounts([], 3, new Date(2026, 2, 1, 12));
    expect(days.map((d) => d.date)).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
  });
});

describe("kindSummary", () => {
  it("groups related event types and sorts by count", () => {
    const summary = kindSummary([
      makeEvent({ type: "PushEvent" }),
      makeEvent({ type: "PushEvent" }),
      makeEvent({ type: "IssueCommentEvent" }),
      makeEvent({ type: "CommitCommentEvent" }),
      makeEvent({ type: "GollumEvent" }),
    ]);
    expect(summary).toEqual([
      { kind: "Comments", count: 2 },
      { kind: "Pushes", count: 2 },
      { kind: "Other", count: 1 },
    ]);
    expect(eventKind("WatchEvent")).toBe("Stars");
  });
});

describe("describeEvent", () => {
  it("describes pushes with and without a commit count", () => {
    expect(
      describeEvent(makeEvent({ type: "PushEvent", payload: { size: 3, ref: "refs/heads/main" } })),
    ).toBe("Pushed 3 commits to main");
    expect(
      describeEvent(makeEvent({ type: "PushEvent", payload: { size: 1, ref: "refs/heads/dev" } })),
    ).toBe("Pushed 1 commit to dev");
    expect(describeEvent(makeEvent({ type: "PushEvent", payload: { ref: "refs/heads/main" } }))).toBe(
      "Pushed to main",
    );
  });

  it("describes common event types", () => {
    expect(
      describeEvent(makeEvent({ type: "CreateEvent", payload: { ref_type: "branch", ref: "feat" } })),
    ).toBe("Created branch feat");
    expect(describeEvent(makeEvent({ type: "CreateEvent", payload: { ref_type: "repository", ref: null } }))).toBe(
      "Created repository",
    );
    expect(describeEvent(makeEvent({ type: "PullRequestEvent", payload: { action: "opened" } }))).toBe(
      "Opened a pull request",
    );
    expect(describeEvent(makeEvent({ type: "IssuesEvent", payload: { action: "closed" } }))).toBe(
      "Closed an issue",
    );
    expect(describeEvent(makeEvent({ type: "WatchEvent" }))).toBe("Starred");
    expect(describeEvent(makeEvent({ type: "GollumEvent" }))).toBe("Gollum");
  });
});
