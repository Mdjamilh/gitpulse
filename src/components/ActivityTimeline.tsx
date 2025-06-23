import { useId } from "react";
import type { GitHubEvent } from "../api/types";
import { dailyCounts, describeEvent, kindSummary } from "../lib/activity";
import { timeAgo } from "../lib/format";

interface Props {
  events: GitHubEvent[];
  days?: number;
  now?: Date;
}

const HEIGHT = 96;
const RECENT = 8;

function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function ActivityTimeline({ events, days = 30, now = new Date() }: Props) {
  const id = useId();
  const series = dailyCounts(events, days, now);
  const inWindow = series.reduce((n, d) => n + d.count, 0);
  const max = Math.max(1, ...series.map((d) => d.count));
  const activeDays = series.filter((d) => d.count > 0).length;
  const slot = 100 / series.length;
  const kinds = kindSummary(events);
  const recent = events.slice(0, RECENT);

  return (
    <section className="card" aria-labelledby={`${id}-h`}>
      <header className="card-head">
        <h2 id={`${id}-h`}>Activity</h2>
        <p className="card-sub">
          Public events from GitHub's events feed (latest 100, at most 90 days back)
        </p>
      </header>

      {events.length === 0 ? (
        <p className="empty">No public activity in the last 90 days.</p>
      ) : (
        <>
          <p className="activity-summary">
            <strong>{inWindow}</strong> event{inWindow === 1 ? "" : "s"} on <strong>{activeDays}</strong> of the
            last {days} days
          </p>
          <svg
            className="timeline"
            width="100%"
            height={HEIGHT}
            role="img"
            aria-labelledby={`${id}-t`}
            aria-describedby={`${id}-d`}
          >
            <title id={`${id}-t`}>Events per day, last {days} days</title>
            <desc id={`${id}-d`}>
              {series
                .filter((d) => d.count > 0)
                .map((d) => `${shortDate(d.date)}: ${d.count}`)
                .join(", ") || "No events in this window"}
            </desc>
            <line x1="0" x2="100%" y1={HEIGHT - 0.5} y2={HEIGHT - 0.5} className="timeline-axis" />
            {series.map((d, i) => {
              const h = d.count === 0 ? 2 : Math.max(4, (d.count / max) * (HEIGHT - 8));
              return (
                <rect
                  key={d.date}
                  data-date={d.date}
                  data-count={d.count}
                  x={`${i * slot + slot * 0.15}%`}
                  width={`${slot * 0.7}%`}
                  y={HEIGHT - h}
                  height={h}
                  rx={2}
                  className={d.count === 0 ? "timeline-empty" : "timeline-bar"}
                >
                  <title>{`${shortDate(d.date)}: ${d.count} event${d.count === 1 ? "" : "s"}`}</title>
                </rect>
              );
            })}
          </svg>
          <div className="timeline-labels" aria-hidden="true">
            <span>{shortDate(series[0].date)}</span>
            <span>Today</span>
          </div>

          <ul className="chips" aria-label="Event types">
            {kinds.map((k) => (
              <li key={k.kind} className="chip">
                {k.kind} <strong>{k.count}</strong>
              </li>
            ))}
          </ul>

          <h3 className="subhead">Most recent</h3>
          <ol className="event-list">
            {recent.map((e) => (
              <li key={e.id}>
                <span className="event-what">
                  {describeEvent(e)}{" "}
                  <span className="muted">in</span>{" "}
                  <a href={`https://github.com/${e.repo.name}`} target="_blank" rel="noreferrer">
                    {e.repo.name}
                  </a>
                </span>
                <time className="event-when" dateTime={e.created_at}>
                  {timeAgo(e.created_at, now)}
                </time>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
