import { QueryClient, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { BadTokenError, NotFoundError, RateLimitError, getRateLimit, subscribeRateLimit } from "./api/client";
import { MAX_REPO_PAGES, fetchEvents, fetchHasProfileReadme, fetchRepos, fetchUser } from "./api/endpoints";
import type { GitHubRepo } from "./api/types";
import { useToken } from "./token";

/** Errors that will not fix themselves by retrying straight away. */
export function isFinalError(err: unknown): boolean {
  return err instanceof NotFoundError || err instanceof RateLimitError || err instanceof BadTokenError;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (count, err) => !isFinalError(err) && count < 1,
      },
    },
  });
}

export function useUser(username: string) {
  const { token } = useToken();
  return useQuery({
    queryKey: ["user", username.toLowerCase()],
    queryFn: ({ signal }) => fetchUser(username, { token, signal }),
    enabled: username !== "",
  });
}

export function useRepos(username: string, enabled = true) {
  const { token } = useToken();
  return useQuery({
    queryKey: ["repos", username.toLowerCase()],
    queryFn: ({ signal }) => fetchRepos(username, { token, signal }),
    enabled: enabled && username !== "",
  });
}

export function useEvents(username: string, enabled = true) {
  const { token } = useToken();
  return useQuery({
    queryKey: ["events", username.toLowerCase()],
    queryFn: ({ signal }) => fetchEvents(username, { token, signal }),
    enabled: enabled && username !== "",
  });
}

/**
 * Whether the user has a profile README. Waits for the repo list: if it is
 * complete and has no username/username repo, the answer is "no" without
 * spending a request (and without a 404 in the console).
 */
export function useProfileReadme(username: string, repos: GitHubRepo[] | undefined) {
  const { token } = useToken();
  return useQuery({
    queryKey: ["profile-readme", username.toLowerCase()],
    queryFn: ({ signal }) => {
      const complete = (repos?.length ?? 0) < MAX_REPO_PAGES * 100;
      const hasRepo = repos?.some((r) => r.name.toLowerCase() === username.toLowerCase());
      if (complete && !hasRepo) return false;
      return fetchHasProfileReadme(username, { token, signal });
    },
    enabled: repos !== undefined && username !== "",
  });
}

export function useRateLimit() {
  return useSyncExternalStore(subscribeRateLimit, getRateLimit, getRateLimit);
}
