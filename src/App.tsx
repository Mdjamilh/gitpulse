import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { clearCache } from "./api/cache";
import { isValidUsername } from "./api/endpoints";
import { Dashboard } from "./components/Dashboard";
import { RateLimitStatus } from "./components/RateLimitStatus";
import { SearchForm } from "./components/SearchForm";
import { ThemeToggle } from "./components/ThemeToggle";
import { TokenPanel } from "./components/TokenPanel";
import "./App.css";

function userFromUrl(): string {
  const name = new URLSearchParams(window.location.search).get("user")?.trim() ?? "";
  return isValidUsername(name) ? name : "";
}

export default function App() {
  const [username, setUsername] = useState(userFromUrl);
  const queryClient = useQueryClient();

  useEffect(() => {
    const onPop = () => setUsername(userFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.title = username ? `@${username} - GitPulse` : "GitPulse - GitHub profile activity at a glance";
  }, [username]);

  const search = useCallback(
    (name: string) => {
      if (name.toLowerCase() !== username.toLowerCase()) {
        const url = new URL(window.location.href);
        url.searchParams.set("user", name);
        window.history.pushState(null, "", url);
      }
      setUsername(name);
    },
    [username],
  );

  // After a token is added or removed, retry anything that failed.
  const retryFailed = useCallback(() => {
    void queryClient.refetchQueries({ predicate: (q) => q.state.status === "error" });
  }, [queryClient]);

  function clearCached() {
    clearCache();
    queryClient.clear();
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="./" aria-label="GitPulse home">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M2 13h4l3-8 4 15 3-9 2 2h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            GitPulse
          </a>
          <div className="topbar-tools">
            <RateLimitStatus />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" className="page">
        <section className="intro">
          <h1>See a GitHub profile at a glance</h1>
          <p>
            Enter a username to see their most starred projects, the languages they use, what they have been doing
            lately, and a checklist of quick wins that make a profile easier to read.
          </p>
          <SearchForm initial={username} onSearch={search} />
          <TokenPanel onChange={retryFailed} />
        </section>

        {username && <Dashboard key={username.toLowerCase()} username={username} />}
      </main>

      <footer className="footer">
        <p>
          Public data from the GitHub REST API, fetched by your browser. Not affiliated with GitHub. Responses are
          cached in this tab for 10 minutes.{" "}
          <button type="button" className="link-button" onClick={clearCached}>
            Clear cached responses
          </button>
        </p>
        <p>
          <a href="https://github.com/Mdjamilh/gitpulse" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </p>
      </footer>
    </>
  );
}
