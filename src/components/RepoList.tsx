import type { GitHubRepo } from "../api/types";
import { formatCount, timeAgo } from "../lib/format";
import { languageColor } from "../lib/languages";

interface Props {
  repos: GitHubRepo[];
  totalOwn: number;
}

export function RepoList({ repos, totalOwn }: Props) {
  return (
    <section className="card" aria-labelledby="repos-title">
      <header className="card-head">
        <h2 id="repos-title">Top repositories</h2>
        <p className="card-sub">
          By stars, from {totalOwn} original public repo{totalOwn === 1 ? "" : "s"} (forks and archived repos left out)
        </p>
      </header>
      {repos.length === 0 ? (
        <p className="empty">No original public repositories yet.</p>
      ) : (
        <ol className="repo-list">
          {repos.map((r) => (
            <li key={r.id} className="repo">
              <a className="repo-name" href={r.html_url} target="_blank" rel="noreferrer">
                {r.name}
              </a>
              <p className="repo-desc">{r.description || <span className="muted">No description</span>}</p>
              <ul className="repo-meta">
                {r.language && (
                  <li>
                    <span className="dot" style={{ background: languageColor(r.language) }} aria-hidden="true" />
                    {r.language}
                  </li>
                )}
                <li aria-label={`${r.stargazers_count} stars`}>
                  <StarIcon /> {formatCount(r.stargazers_count)}
                </li>
                <li aria-label={`${r.forks_count} forks`}>
                  <ForkIcon /> {formatCount(r.forks_count)}
                </li>
                <li>Pushed {timeAgo(r.pushed_at)}</li>
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function StarIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"
      />
    </svg>
  );
}
