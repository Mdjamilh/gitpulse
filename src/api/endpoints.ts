import { NotFoundError, githubGet, type RequestOptions } from "./client";
import type { GitHubEvent, GitHubRepo, GitHubUser } from "./types";

// GitHub usernames: 1-39 chars, alphanumerics and single hyphens, no
// leading or trailing hyphen.
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(name: string): boolean {
  return USERNAME.test(name);
}

const enc = encodeURIComponent;

export function fetchUser(username: string, opts?: RequestOptions) {
  return githubGet<GitHubUser>(`/users/${enc(username)}`, opts);
}

/** At most this many pages of 100 repos are loaded, to protect the rate limit. */
export const MAX_REPO_PAGES = 3;

export async function fetchRepos(username: string, opts?: RequestOptions): Promise<GitHubRepo[]> {
  const all: GitHubRepo[] = [];
  for (let page = 1; page <= MAX_REPO_PAGES; page++) {
    const batch = await githubGet<GitHubRepo[]>(
      `/users/${enc(username)}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
      opts,
    );
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export function fetchEvents(username: string, opts?: RequestOptions) {
  return githubGet<GitHubEvent[]>(`/users/${enc(username)}/events/public?per_page=100`, opts);
}

/** True when the special username/username repository has a README. */
export async function fetchHasProfileReadme(username: string, opts?: RequestOptions): Promise<boolean> {
  try {
    await githubGet<unknown>(`/repos/${enc(username)}/${enc(username)}/readme`, opts);
    return true;
  } catch (err) {
    if (err instanceof NotFoundError) return false;
    throw err;
  }
}
