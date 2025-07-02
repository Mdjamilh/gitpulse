import { useId } from "react";
import { healthScore, type CheckStatus, type HealthCheck } from "../lib/health";

interface Props {
  checks: HealthCheck[];
}

const STATUS_TEXT: Record<CheckStatus, string> = {
  pass: "Done",
  partial: "Partly done",
  fail: "Missing",
  unknown: "Not checked",
};

function StatusIcon({ status }: { status: CheckStatus }) {
  const paths: Record<CheckStatus, string> = {
    pass: "M4 8.5l2.5 2.5L12 5.5",
    partial: "M4.5 8h7",
    fail: "M5 5l6 6M11 5l-6 6",
    unknown: "M6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.4M8 11.6v.1",
  };
  return (
    <svg className={`status-icon status-${status}`} viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
      <circle cx="8" cy="8" r="7.25" />
      <path d={paths[status]} />
    </svg>
  );
}

export function HealthChecklist({ checks }: Props) {
  const id = useId();
  const score = healthScore(checks);
  const done = checks.filter((c) => c.status === "pass").length;

  return (
    <section className="card" aria-labelledby={`${id}-h`}>
      <header className="card-head health-head">
        <div>
          <h2 id={`${id}-h`}>Profile health</h2>
          <p className="card-sub">
            {done} of {checks.length} checks done. Showcase repos are the top 6 original repos by stars.
          </p>
        </div>
        <p className="score">
          <span className="visually-hidden">Score: {score} out of 100</span>
          <span className="score-value" aria-hidden="true">{score}</span>
          <span className="score-max" aria-hidden="true">/100</span>
        </p>
      </header>
      <ul className="checklist">
        {checks.map((c) => (
          <li key={c.id} className={`check check-${c.status}`}>
            <StatusIcon status={c.status} />
            <div>
              <p className="check-label">
                {c.label} <span className="visually-hidden">({STATUS_TEXT[c.status]})</span>
              </p>
              <p className="check-detail">{c.detail}</p>
              {c.status !== "pass" && c.tip && <p className="check-tip">{c.tip}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
