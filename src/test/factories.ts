import type { GitHubEvent, GitHubRepo, GitHubUser } from "../api/types";

let nextId = 1;

export function makeRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  const id = nextId++;
  const name = overrides.name ?? `repo-${id}`;
  return {
    id,
    name,
    full_name: `octocat/${name}`,
    html_url: `https://github.com/octocat/${name}`,
    description: "A repository",
    fork: false,
    archived: false,
    language: "TypeScript",
    stargazers_count: 0,
    forks_count: 0,
    topics: [],
    license: { spdx_id: "MIT", name: "MIT License" },
    pushed_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

export function makeUser(overrides: Partial<GitHubUser> = {}): GitHubUser {
  return {
    login: "octocat",
    name: "The Octocat",
    avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
    html_url: "https://github.com/octocat",
    bio: "Mascot",
    company: "@github",
    blog: "https://github.blog",
    location: "San Francisco",
    twitter_username: null,
    public_repos: 8,
    followers: 100,
    following: 9,
    created_at: "2011-01-25T18:44:36Z",
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<GitHubEvent> = {}): GitHubEvent {
  return {
    id: String(nextId++),
    type: "PushEvent",
    created_at: "2026-10-01T10:00:00Z",
    repo: { name: "octocat/hello-world" },
    payload: {},
    ...overrides,
  };
}
