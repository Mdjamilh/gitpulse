import { describe, expect, it } from "vitest";
import { makeRepo, makeUser } from "../test/factories";
import { healthScore, profileHealth, type HealthCheck } from "./health";

const now = new Date("2026-10-20T00:00:00Z");
const status = (checks: HealthCheck[], id: string) => checks.find((c) => c.id === id)?.status;

describe("profileHealth", () => {
  it("passes a complete profile", () => {
    const checks = profileHealth({
      user: makeUser(),
      repos: [makeRepo({ topics: ["cli"], pushed_at: "2026-10-01T00:00:00Z" })],
      hasProfileReadme: true,
      now,
    });
    expect(checks.every((c) => c.status === "pass")).toBe(true);
    expect(healthScore(checks)).toBe(100);
  });

  it("flags missing profile fields", () => {
    const checks = profileHealth({
      user: makeUser({ name: null, bio: "  ", blog: "", twitter_username: null }),
      repos: [],
      hasProfileReadme: false,
      now,
    });
    expect(status(checks, "name")).toBe("fail");
    expect(status(checks, "bio")).toBe("fail");
    expect(status(checks, "links")).toBe("fail");
    expect(status(checks, "readme")).toBe("fail");
    expect(status(checks, "descriptions")).toBe("fail");
    expect(checks.find((c) => c.id === "descriptions")?.detail).toBe("No original public repos yet");
  });

  it("gives partial credit when only some showcase repos are complete", () => {
    const checks = profileHealth({
      user: makeUser(),
      repos: [
        makeRepo({ stargazers_count: 5, description: null, license: null }),
        makeRepo({ stargazers_count: 4, topics: ["x"] }),
      ],
      hasProfileReadme: true,
      now,
    });
    expect(status(checks, "descriptions")).toBe("partial");
    expect(status(checks, "topics")).toBe("partial");
    expect(status(checks, "licenses")).toBe("partial");
    expect(checks.find((c) => c.id === "topics")?.detail).toBe("1 of 2 showcase repos have topics");
  });

  it("treats NOASSERTION licenses as unlicensed", () => {
    const checks = profileHealth({
      user: makeUser(),
      repos: [makeRepo({ license: { spdx_id: "NOASSERTION", name: "Other" } })],
      hasProfileReadme: true,
      now,
    });
    expect(status(checks, "licenses")).toBe("fail");
  });

  it("flags stale accounts and an unknown README", () => {
    const checks = profileHealth({
      user: makeUser(),
      repos: [makeRepo({ pushed_at: "2025-01-01T00:00:00Z" })],
      hasProfileReadme: undefined,
      now,
    });
    expect(status(checks, "recent")).toBe("fail");
    expect(status(checks, "readme")).toBe("unknown");
  });
});

describe("healthScore", () => {
  it("weights partial as half and skips unknown", () => {
    const mk = (s: HealthCheck["status"]): HealthCheck => ({ id: s, label: s, status: s, detail: "" });
    expect(healthScore([mk("pass"), mk("partial"), mk("fail"), mk("unknown")])).toBe(50);
    expect(healthScore([mk("unknown")])).toBe(0);
  });
});
