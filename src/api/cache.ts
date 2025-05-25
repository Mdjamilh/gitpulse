// A small sessionStorage cache for GitHub responses. Entries live for the
// browser tab's session and expire after a TTL, so revisiting a profile does
// not spend the 60 requests/hour unauthenticated budget again.

const PREFIX = "gitpulse:v1:";
export const DEFAULT_TTL_MS = 10 * 60 * 1000;

interface Entry<T> {
  savedAt: number;
  data: T;
}

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    // Some privacy modes throw on access.
    return null;
  }
}

export function readCache<T>(key: string, ttlMs = DEFAULT_TTL_MS, now = Date.now()): T | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as Entry<T>;
    if (typeof entry.savedAt !== "number" || now - entry.savedAt > ttlMs) {
      store.removeItem(PREFIX + key);
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

export function writeCache<T>(key: string, data: T, now = Date.now()): void {
  const store = storage();
  if (!store) return;
  const value = JSON.stringify({ savedAt: now, data } satisfies Entry<T>);
  try {
    store.setItem(PREFIX + key, value);
  } catch {
    // Quota exceeded: drop our old entries and try once more, then give up.
    clearCache();
    try {
      store.setItem(PREFIX + key, value);
    } catch {
      /* caching is best effort */
    }
  }
}

export function clearCache(): void {
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => store.removeItem(k));
}
