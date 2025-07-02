import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LanguageChart } from "./LanguageChart";

const langs = [
  { language: "TypeScript", repos: 6, share: 0.6, color: "#3178c6" },
  { language: "Go", repos: 3, share: 0.3, color: "#00ADD8" },
  { language: "Other", repos: 1, share: 0.1, color: "#9ca3af" },
];

describe("LanguageChart", () => {
  it("draws one bar per language, scaled to the largest", () => {
    const { container } = render(<LanguageChart languages={langs} />);
    const chart = screen.getByRole("img", { name: /Languages by number of repositories/ });
    expect(chart).toHaveAccessibleDescription("TypeScript 60% (6 repos), Go 30% (3 repos), Other 10% (1 repo)");
    const groups = container.querySelectorAll("g[data-language]");
    expect(groups).toHaveLength(3);
    const bar = (lang: string) =>
      container.querySelector(`g[data-language="${lang}"] rect:not(.lang-track)`)!.getAttribute("width");
    expect(bar("TypeScript")).toBe("48%");
    expect(bar("Go")).toBe("24%");
  });

  it("formats small shares with a decimal", () => {
    render(<LanguageChart languages={[{ language: "Lua", repos: 1, share: 0.042, color: "#000080" }]} />);
    expect(screen.getByText("4.2%")).toBeInTheDocument();
  });

  it("explains an empty chart", () => {
    render(<LanguageChart languages={[]} />);
    expect(screen.getByText(/None of the original repos declare a language/)).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
