import type { GitHubRepo, GitHubUser } from "../api/types";
import { lastPush, topRepos } from "./repos";

export type CheckStatus = "pass" | "partial" | "fail" | "unknown";

export interface HealthCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  /** What to do about it, shown when the check is not passing. */
  tip?: string;
}

export interface HealthInput {
  user: GitHubUser;
  repos: GitHubRepo[];
  /** undefined while unknown (still loading or failed). */
  hasProfileReadme: boolean | undefined;
  now?: Date;
}

const DAY = 24 * 3600 * 1000;

function ratioStatus(n: number, total: number): CheckStatus {
  if (total === 0) return "fail";
  if (n === total) return "pass";
  return n > 0 ? "partial" : "fail";
}

/**
 * A checklist of things that make a GitHub profile easy to understand for a
 * visitor. "Showcase repos" are the top six original repos by stars, which
 * is a rough stand-in for what someone would pin.
 */
export function profileHealth({ user, repos, hasProfileReadme, now = new Date() }: HealthInput): HealthCheck[] {
  const showcase = topRepos(repos, 6);
  const total = showcase.length;
  const described = showcase.filter((r) => r.description?.trim()).length;
  const topical = showcase.filter((r) => (r.topics?.length ?? 0) > 0).length;
  const licensed = showcase.filter((r) => r.license && r.license.spdx_id !== "NOASSERTION").length;
  const pushed = lastPush(repos);
  const recent = pushed ? now.getTime() - Date.parse(pushed) < 90 * DAY : false;

  const of = (n: number) => (total ? `${n} of ${total} showcase repos` : "No original public repos yet");

  return [
    {
      id: "name",
      label: "Display name",
      status: user.name?.trim() ? "pass" : "fail",
      detail: user.name?.trim() ? user.name : "No display name set",
      tip: "Add your real or preferred name in Settings > Public profile.",
    },
    {
      id: "bio",
      label: "Bio",
      status: user.bio?.trim() ? "pass" : "fail",
      detail: user.bio?.trim() ? "Has a bio" : "No bio",
      tip: "One line on what you build and what you are looking for helps visitors.",
    },
    {
      id: "links",
      label: "Website or social link",
      status: user.blog?.trim() || user.twitter_username ? "pass" : "fail",
      detail: user.blog?.trim() || (user.twitter_username ? `@${user.twitter_username}` : "No links"),
      tip: "Link a portfolio, blog or social account so people can find more of your work.",
    },
    {
      id: "readme",
      label: "Profile README",
      status: hasProfileReadme === undefined ? "unknown" : hasProfileReadme ? "pass" : "fail",
      detail:
        hasProfileReadme === undefined
          ? "Could not check"
          : hasProfileReadme
            ? `${user.login}/${user.login} has a README`
            : `No ${user.login}/${user.login} README`,
      tip: `Create a public repo named ${user.login} with a README.md; GitHub shows it on your profile.`,
    },
    {
      id: "descriptions",
      label: "Repo descriptions",
      status: ratioStatus(described, total),
      detail: `${of(described)}${total ? " have a description" : ""}`,
      tip: "A one-sentence description appears in search results and on pinned cards.",
    },
    {
      id: "topics",
      label: "Repo topics",
      status: ratioStatus(topical, total),
      detail: `${of(topical)}${total ? " have topics" : ""}`,
      tip: "Topics make repos discoverable through GitHub topic pages and search.",
    },
    {
      id: "licenses",
      label: "Open source licenses",
      status: ratioStatus(licensed, total),
      detail: `${of(licensed)}${total ? " have a license" : ""}`,
      tip: "Without a license, others cannot legally reuse the code. MIT is a common default.",
    },
    {
      id: "recent",
      label: "Recent activity",
      status: recent ? "pass" : "fail",
      detail: pushed ? `Last push ${new Date(pushed).toLocaleDateString()}` : "No pushes found",
      tip: "Nothing pushed to an owned public repo in the last 90 days.",
    },
  ];
}

/** Score out of 100: pass = 1, partial = 0.5, unknown checks are left out. */
export function healthScore(checks: HealthCheck[]): number {
  const known = checks.filter((c) => c.status !== "unknown");
  if (known.length === 0) return 0;
  const points = known.reduce((n, c) => n + (c.status === "pass" ? 1 : c.status === "partial" ? 0.5 : 0), 0);
  return Math.round((points / known.length) * 100);
}
