import type { GitHubRepo } from "../api/types";
import { ownRepos } from "./repos";

export interface LanguageShare {
  language: string;
  repos: number;
  /** 0..1 share of repos that declare a language. */
  share: number;
  color: string;
}

// Colors follow GitHub's linguist palette for familiar languages.
const COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Dart: "#00B4AB",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Lua: "#000080",
};

const FALLBACK = ["#8b5cf6", "#14b8a6", "#f97316", "#64748b", "#ec4899", "#84cc16"];
export const OTHER_COLOR = "#9ca3af";

export function languageColor(language: string): string {
  if (COLORS[language]) return COLORS[language];
  let hash = 0;
  for (const ch of language) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK[hash % FALLBACK.length];
}

/**
 * Count the primary language of each original repo. This uses the single
 * `language` field GitHub reports per repo, which costs no extra requests
 * (the per-repo /languages endpoint would cost one request per repo).
 * Languages beyond `limit` are folded into "Other".
 */
export function languageBreakdown(repos: GitHubRepo[], limit = 7): LanguageShare[] {
  const counts = new Map<string, number>();
  for (const r of ownRepos(repos)) {
    if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const head = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((n, [, c]) => n + c, 0);

  const shares = head.map(([language, n]) => ({
    language,
    repos: n,
    share: n / total,
    color: languageColor(language),
  }));
  if (rest > 0) shares.push({ language: "Other", repos: rest, share: rest / total, color: OTHER_COLOR });
  return shares;
}
