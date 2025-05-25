import { describe, expect, it } from "vitest";
import { formatCount, minutesUntil, timeAgo } from "./format";

const NOW = new Date("2026-10-20T12:00:00Z");

describe("formatCount", () => {
  it("keeps small numbers exact", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  it("compacts thousands", () => {
    expect(formatCount(1234)).toBe("1.2K");
    expect(formatCount(2_500_000)).toBe("2.5M");
  });
});

describe("timeAgo", () => {
  it("describes past dates in the largest sensible unit", () => {
    expect(timeAgo("2026-10-17T12:00:00Z", NOW)).toBe("3 days ago");
    expect(timeAgo("2026-10-20T09:00:00Z", NOW)).toBe("3 hours ago");
    expect(timeAgo("2025-10-01T12:00:00Z", NOW)).toBe("last year");
  });

  it("handles missing and invalid input", () => {
    expect(timeAgo(null, NOW)).toBe("never");
    expect(timeAgo("not a date", NOW)).toBe("unknown");
    expect(timeAgo("2026-10-20T11:59:50Z", NOW)).toBe("just now");
  });
});

describe("minutesUntil", () => {
  it("rounds up and never goes negative", () => {
    expect(minutesUntil(new Date("2026-10-20T12:10:30Z"), NOW)).toBe(11);
    expect(minutesUntil(new Date("2026-10-20T11:00:00Z"), NOW)).toBe(0);
  });
});
