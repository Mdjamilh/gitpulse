import { useMemo } from "react";
import { useEvents, useProfileReadme, useRepos, useUser } from "../hooks";
import { profileHealth } from "../lib/health";
import { languageBreakdown } from "../lib/languages";
import { ownRepos, repoTotals, topRepos } from "../lib/repos";
import { ActivityTimeline } from "./ActivityTimeline";
import { ErrorPanel } from "./ErrorPanel";
import { HealthChecklist } from "./HealthChecklist";
import { LanguageChart } from "./LanguageChart";
import { ProfileHeader } from "./ProfileHeader";
import { RepoList } from "./RepoList";

function Loading({ label }: { label: string }) {
  return (
    <div className="card loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Dashboard({ username }: { username: string }) {
  const user = useUser(username);
  const ready = user.isSuccess;
  const repos = useRepos(username, ready);
  const events = useEvents(username, ready);
  const readme = useProfileReadme(username, repos.data);

  const derived = useMemo(() => {
    if (!repos.data) return null;
    return {
      top: topRepos(repos.data),
      own: ownRepos(repos.data).length,
      totals: repoTotals(repos.data),
      languages: languageBreakdown(repos.data),
    };
  }, [repos.data]);

  const checks = useMemo(
    () =>
      user.data && repos.data
        ? profileHealth({ user: user.data, repos: repos.data, hasProfileReadme: readme.data })
        : null,
    [user.data, repos.data, readme.data],
  );

  if (user.isPending) return <Loading label={`Loading @${username}...`} />;
  if (user.isError) return <ErrorPanel error={user.error} username={username} onRetry={() => user.refetch()} />;

  return (
    <div className="dashboard">
      <ProfileHeader user={user.data} totals={derived?.totals} />

      {repos.isError ? (
        <ErrorPanel error={repos.error} username={username} onRetry={() => repos.refetch()} />
      ) : !derived ? (
        <Loading label="Loading repositories..." />
      ) : (
        <div className="grid">
          <RepoList repos={derived.top} totalOwn={derived.own} />
          <LanguageChart languages={derived.languages} />
        </div>
      )}

      <div className="grid">
        {events.isError ? (
          <ErrorPanel error={events.error} username={username} onRetry={() => events.refetch()} />
        ) : events.data ? (
          <ActivityTimeline events={events.data} />
        ) : (
          <Loading label="Loading activity..." />
        )}
        {checks ? <HealthChecklist checks={checks} /> : !repos.isError && <Loading label="Checking profile..." />}
      </div>
    </div>
  );
}
