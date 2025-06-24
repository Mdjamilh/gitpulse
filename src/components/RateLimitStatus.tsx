import { useRateLimit } from "../hooks";
import { formatClock } from "../lib/format";

/** Shows how many GitHub API requests are left in the current hour window. */
export function RateLimitStatus() {
  const rate = useRateLimit();
  if (!rate) return null;
  const low = rate.remaining <= Math.max(5, rate.limit * 0.1);
  return (
    <p className={`rate ${low ? "rate-low" : ""}`} aria-live="polite">
      <span className="rate-count">
        {rate.remaining} of {rate.limit}
      </span>{" "}
      API requests left, resets at {formatClock(rate.resetAt)}
    </p>
  );
}
