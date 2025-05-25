import { vi } from "vitest";

export interface MockRoute {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export const RATE_HEADERS = {
  "x-ratelimit-limit": "60",
  "x-ratelimit-remaining": "57",
  "x-ratelimit-reset": "1792000000",
};

/**
 * Replace global fetch with a router keyed by API path (including query
 * string). Unknown paths return 404. Returns the mock for call assertions.
 */
export function mockFetch(routes: Record<string, MockRoute | (() => MockRoute)>) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const key = url.pathname + url.search;
    const entry = routes[key];
    const route = typeof entry === "function" ? entry() : entry;
    if (!route) {
      return new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers: { "content-type": "application/json", ...RATE_HEADERS },
      });
    }
    return new Response(JSON.stringify(route.body ?? {}), {
      status: route.status ?? 200,
      headers: { "content-type": "application/json", ...RATE_HEADERS, ...route.headers },
    });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
