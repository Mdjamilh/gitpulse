import { describe, expect, it, vi } from "vitest";
import { clearCache, readCache, writeCache } from "./cache";

describe("response cache", () => {
  it("round-trips data within the TTL", () => {
    writeCache("/users/octocat", { login: "octocat" }, 1_000);
    expect(readCache("/users/octocat", 60_000, 5_000)).toEqual({ login: "octocat" });
  });

  it("expires and removes stale entries", () => {
    writeCache("/users/octocat", { login: "octocat" }, 1_000);
    expect(readCache("/users/octocat", 60_000, 100_000)).toBeUndefined();
    expect(sessionStorage.length).toBe(0);
  });

  it("ignores corrupt entries", () => {
    sessionStorage.setItem("gitpulse:v1:/bad", "{not json");
    expect(readCache("/bad")).toBeUndefined();
  });

  it("clears only its own keys", () => {
    sessionStorage.setItem("other-app", "keep");
    writeCache("/a", 1);
    writeCache("/b", 2);
    clearCache();
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem("other-app")).toBe("keep");
  });

  it("survives a full storage quota", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
    expect(() => writeCache("/big", "x")).not.toThrow();
    expect(setItem).toHaveBeenCalledTimes(2);
  });
});
