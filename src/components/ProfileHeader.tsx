import type { GitHubUser } from "../api/types";
import { formatCount } from "../lib/format";
import type { RepoTotals } from "../lib/repos";

interface Props {
  user: GitHubUser;
  totals?: RepoTotals;
}

function safeUrl(blog: string): string | null {
  const href = /^https?:\/\//i.test(blog) ? blog : `https://${blog}`;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function ProfileHeader({ user, totals }: Props) {
  const blog = user.blog?.trim() ? safeUrl(user.blog.trim()) : null;
  const joined = new Date(user.created_at).getFullYear();

  return (
    <section className="card profile" aria-labelledby="profile-name">
      <img className="avatar" src={user.avatar_url} alt="" width={96} height={96} />
      <div className="profile-main">
        <h2 id="profile-name">{user.name || user.login}</h2>
        <a className="profile-login" href={user.html_url} target="_blank" rel="noreferrer">
          @{user.login}
        </a>
        {user.bio && <p className="profile-bio">{user.bio}</p>}
        <ul className="profile-meta">
          {user.location && <li>{user.location}</li>}
          {user.company && <li>{user.company}</li>}
          {blog && (
            <li>
              <a href={blog} target="_blank" rel="noreferrer nofollow">
                {user.blog}
              </a>
            </li>
          )}
          {!Number.isNaN(joined) && <li>Joined {joined}</li>}
        </ul>
      </div>
      <dl className="stats">
        <div>
          <dt>Public repos</dt>
          <dd>{formatCount(user.public_repos)}</dd>
        </div>
        <div>
          <dt>Followers</dt>
          <dd>{formatCount(user.followers)}</dd>
        </div>
        <div>
          <dt>Stars earned</dt>
          <dd>{totals ? formatCount(totals.stars) : "..."}</dd>
        </div>
        <div>
          <dt>Forks</dt>
          <dd>{totals ? formatCount(totals.forks) : "..."}</dd>
        </div>
      </dl>
    </section>
  );
}
