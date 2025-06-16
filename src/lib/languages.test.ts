import { describe, expect, it } from "vitest";
import { makeRepo } from "../test/factories";
import { OTHER_COLOR, languageBreakdown, languageColor } from "./languages";

describe("languageBreakdown", () => {
  it("counts primary languages of original repos", () => {
    const result = languageBreakdown([
      makeRepo({ language: "Go" }),
      makeRepo({ language: "Go" }),
      makeRepo({ language: "Rust" }),
      makeRepo({ language: null }),
      makeRepo({ language: "Python", fork: true }),
    ]);
    expect(result.map((l) => [l.language, l.repos])).toEqual([
      ["Go", 2],
      ["Rust", 1],
    ]);
    expect(result[0].share).toBeCloseTo(2 / 3);
  });

  it("folds the long tail into Other", () => {
    const langs = ["A", "B", "C", "D"];
    const result = languageBreakdown(
      langs.map((language) => makeRepo({ language })),
      2,
    );
    expect(result.map((l) => l.language)).toEqual(["A", "B", "Other"]);
    expect(result[2]).toMatchObject({ repos: 2, share: 0.5, color: OTHER_COLOR });
  });

  it("returns nothing when no repo declares a language", () => {
    expect(languageBreakdown([makeRepo({ language: null })])).toEqual([]);
  });
});

describe("languageColor", () => {
  it("uses known colors and a stable fallback", () => {
    expect(languageColor("TypeScript")).toBe("#3178c6");
    expect(languageColor("Zig")).toBe(languageColor("Zig"));
    expect(languageColor("Zig")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
