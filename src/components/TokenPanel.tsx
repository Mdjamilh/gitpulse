import { useState, type FormEvent } from "react";
import { useToken } from "../token";

interface Props {
  /** Called after the token changes so failed requests can be retried. */
  onChange?: () => void;
  defaultOpen?: boolean;
}

export function TokenPanel({ onChange, defaultOpen = false }: Props) {
  const { token, setToken } = useToken();
  const [draft, setDraft] = useState("");

  function save(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setToken(draft);
    setDraft("");
    onChange?.();
  }

  function forget() {
    setToken("");
    onChange?.();
  }

  return (
    <details className="token" open={defaultOpen || undefined}>
      <summary>
        {token ? "Using your access token (5,000 requests per hour)" : "Optional: use a GitHub access token for a higher limit"}
      </summary>
      <div className="token-body">
        <p>
          GitPulse calls the GitHub API straight from your browser. Without a token GitHub allows 60 requests per
          hour; one profile needs 3 to 6. With a token the limit is 5,000.
        </p>
        <ul className="token-facts">
          <li>The token is kept only in this page's memory. It is never saved to storage, cookies or the URL, and it is gone when you reload or close the tab.</li>
          <li>It is sent only to api.github.com, as an Authorization header.</li>
          <li>
            A{" "}
            <a
              href="https://github.com/settings/personal-access-tokens/new"
              target="_blank"
              rel="noreferrer"
            >
              fine-grained token
            </a>{" "}
            with no extra permissions (public repositories, read-only) is enough.
          </li>
        </ul>
        {token ? (
          <button type="button" onClick={forget}>
            Forget token
          </button>
        ) : (
          <form className="token-form" onSubmit={save}>
            <label htmlFor="token-input">Personal access token</label>
            <input
              id="token-input"
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="github_pat_..."
            />
            <button type="submit" disabled={!draft.trim()}>
              Use token
            </button>
          </form>
        )}
      </div>
    </details>
  );
}
