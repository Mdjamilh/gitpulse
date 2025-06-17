import type { GitHubEvent } from "../api/types";

export interface DayCount {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  count: number;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Events per local day for the `days` days ending today, oldest first.
 * Days with no events are included with a zero count.
 */
export function dailyCounts(events: GitHubEvent[], days = 30, now = new Date()): DayCount[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = dayKey(new Date(e.created_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(d);
    out.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return out;
}

const KIND: Record<string, string> = {
  PushEvent: "Pushes",
  PullRequestEvent: "Pull requests",
  PullRequestReviewEvent: "Reviews",
  PullRequestReviewCommentEvent: "Reviews",
  IssuesEvent: "Issues",
  IssueCommentEvent: "Comments",
  CommitCommentEvent: "Comments",
  CreateEvent: "Created",
  DeleteEvent: "Deleted",
  ReleaseEvent: "Releases",
  WatchEvent: "Stars",
  ForkEvent: "Forks",
};

export function eventKind(type: string): string {
  return KIND[type] ?? "Other";
}

export function kindSummary(events: GitHubEvent[]): { kind: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const k = eventKind(e.type);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));
}

function branch(ref: string | null | undefined): string {
  return ref ? ref.replace(/^refs\/heads\//, "") : "";
}

/** A short human sentence for an event, without the repo name. */
export function describeEvent(e: GitHubEvent): string {
  const p = e.payload ?? {};
  switch (e.type) {
    case "PushEvent": {
      // GitHub stopped including commit counts in some push payloads, so the
      // number is shown only when present.
      const n = typeof p.size === "number" ? p.size : p.commits?.length;
      const commits = n ? `${n} commit${n === 1 ? "" : "s"} ` : "";
      const to = branch(p.ref);
      return `Pushed ${commits}${to ? `to ${to}` : ""}`.trim();
    }
    case "CreateEvent":
      return p.ref ? `Created ${p.ref_type} ${p.ref}` : `Created ${p.ref_type ?? "repository"}`;
    case "DeleteEvent":
      return `Deleted ${p.ref_type ?? ""} ${p.ref ?? ""}`.replace(/\s+/g, " ").trim();
    case "PullRequestEvent":
      return `${capitalize(p.action ?? "updated")} a pull request`;
    case "PullRequestReviewEvent":
      return "Reviewed a pull request";
    case "PullRequestReviewCommentEvent":
      return "Commented on a pull request review";
    case "IssuesEvent":
      return `${capitalize(p.action ?? "updated")} an issue`;
    case "IssueCommentEvent":
      return "Commented on an issue";
    case "CommitCommentEvent":
      return "Commented on a commit";
    case "ReleaseEvent":
      return `${capitalize(p.action ?? "published")} a release`;
    case "WatchEvent":
      return "Starred";
    case "ForkEvent":
      return "Forked";
    case "PublicEvent":
      return "Made the repository public";
    case "MemberEvent":
      return "Added a collaborator";
    default:
      return e.type.replace(/Event$/, "");
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
