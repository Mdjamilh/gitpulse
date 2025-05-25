import { readCache, writeCache } from "./cache";

export const API_ROOT = "https://api.github.com";

export class GitHubError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

export class NotFoundError extends GitHubError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends GitHubError {
  readonly resetAt: Date;
  constructor(resetAt: Date, status = 403) {
    super("GitHub API rate limit reached", status);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

export class BadTokenError extends GitHubError {
  constructor() {
    super("GitHub rejected the access token", 401);
    this.name = "BadTokenError";
  }
}

export interface RateLimit {
  limit: number;
  remaining: number;
  resetAt: Date;
}

// ---- Last seen rate limit, readable from React via useSyncExternalStore ----

let lastRateLimit: RateLimit | null = null;
const listeners = new Set<() => void>();

export function getRateLimit(): RateLimit | null {
  return lastRateLimit;
}

export function subscribeRateLimit(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setRateLimit(next: RateLimit | null) {
  lastRateLimit = next;
  listeners.forEach((l) => l());
}

/** Test helper: forget the last seen rate limit. */
export function resetRateLimit() {
  setRateLimit(null);
}

export function parseRateLimit(headers: Headers): RateLimit | null {
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  if (limit === null || remaining === null || reset === null) return null;
  const values = [Number(limit), Number(remaining), Number(reset)];
  if (values.some((v) => !Number.isFinite(v))) return null;
  return { limit: values[0], remaining: values[1], resetAt: new Date(values[2] * 1000) };
}

export interface RequestOptions {
  token?: string;
  signal?: AbortSignal;
  /** Read and write the sessionStorage cache. Defaults to true. */
  cache?: boolean;
}

/**
 * GET a GitHub REST API path such as "/users/octocat" and return parsed JSON.
 * Throws NotFoundError, RateLimitError, BadTokenError or GitHubError.
 */
export async function githubGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, signal, cache = true } = options;
  if (cache) {
    const hit = readCache<T>(path);
    if (hit !== undefined) return hit;
  }

  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_ROOT + path, { headers, signal });
  const rate = parseRateLimit(res.headers);
  if (rate) setRateLimit(rate);

  if (!res.ok) throw await toError(res, rate);

  const data = (await res.json()) as T;
  if (cache) writeCache(path, data);
  return data;
}

async function toError(res: Response, rate: RateLimit | null): Promise<GitHubError> {
  if (res.status === 404) return new NotFoundError();
  if (res.status === 401) return new BadTokenError();
  if (res.status === 403 || res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    if (rate && rate.remaining === 0) return new RateLimitError(rate.resetAt, res.status);
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      return new RateLimitError(new Date(Date.now() + retryAfter * 1000), res.status);
    }
  }
  let message = `GitHub API error (${res.status})`;
  try {
    const body = (await res.json()) as { message?: string };
    if (body?.message) message = body.message;
  } catch {
    /* body was not JSON */
  }
  return new GitHubError(message, res.status);
}
