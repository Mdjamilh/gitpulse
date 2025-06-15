import type { GitHubRepo } from "../api/types";

/** Repos the user authored: forks and archived repos are left out. */
export function ownRepos(repos: GitHubRepo[]): GitHubRepo[] {
  return repos.filter((r) => !r.fork && !r.archived);
}

/** Most starred first, then most forked, then most recently pushed. */
export function topRepos(repos: GitHubRepo[], limit = 6): GitHubRepo[] {
  return [...ownRepos(repos)]
    .sort(
      (a, b) =>
        b.stargazers_count - a.stargazers_count ||
        b.forks_count - a.forks_count ||
        Date.parse(b.pushed_at ?? "0") - Date.parse(a.pushed_at ?? "0"),
    )
    .slice(0, limit);
}

export interface RepoTotals {
  stars: number;
  forks: number;
  count: number;
}

export function repoTotals(repos: GitHubRepo[]): RepoTotals {
  const own = ownRepos(repos);
  return {
    count: own.length,
    stars: own.reduce((n, r) => n + r.stargazers_count, 0),
    forks: own.reduce((n, r) => n + r.forks_count, 0),
  };
}

/** The most recent push across all repos, or null. */
export function lastPush(repos: GitHubRepo[]): string | null {
  let best: string | null = null;
  for (const r of repos) {
    if (r.pushed_at && (!best || Date.parse(r.pushed_at) > Date.parse(best))) best = r.pushed_at;
  }
  return best;
}
