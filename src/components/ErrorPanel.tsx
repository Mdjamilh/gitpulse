import { useEffect, useState } from "react";
import { BadTokenError, NotFoundError, RateLimitError } from "../api/client";
import { formatClock, minutesUntil } from "../lib/format";

interface Props {
  error: unknown;
  username: string;
  onRetry: () => void;
}

function useNow(intervalMs: number, active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, active]);
  return now;
}

export function ErrorPanel({ error, username, onRetry }: Props) {
  const isRate = error instanceof RateLimitError;
  const now = useNow(15_000, isRate);

  if (error instanceof NotFoundError) {
    return (
      <div className="card notice" role="alert">
        <h2>No GitHub user called "{username}"</h2>
        <p>Check the spelling. Organisation accounts are not supported yet, only personal profiles.</p>
      </div>
    );
  }

  if (isRate) {
    const mins = minutesUntil(error.resetAt, now);
    const ready = mins === 0;
    return (
      <div className="card notice notice-warn" role="alert">
        <h2>GitHub's hourly request limit was reached</h2>
        <p>
          Without a token, GitHub allows 60 API requests per hour from your network. The limit resets at{" "}
          <strong>{formatClock(error.resetAt)}</strong>
          {ready ? ", which has passed." : ` (in about ${mins} minute${mins === 1 ? "" : "s"}).`}
        </p>
        <p>Profiles you already opened in this tab still load from the cache. To keep going now, add a personal access token below.</p>
        <button type="button" onClick={onRetry} disabled={!ready}>
          {ready ? "Try again" : "Waiting for reset"}
        </button>
      </div>
    );
  }

  if (error instanceof BadTokenError) {
    return (
      <div className="card notice notice-warn" role="alert">
        <h2>GitHub did not accept the access token</h2>
        <p>The token may be mistyped, expired or revoked. Remove it to continue with anonymous requests.</p>
      </div>
    );
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <div className="card notice notice-warn" role="alert">
      <h2>Could not load this profile</h2>
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
