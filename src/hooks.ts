import { QueryClient, useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { BadTokenError, NotFoundError, RateLimitError, getRateLimit, subscribeRateLimit } from "./api/client";
import { fetchEvents, fetchHasProfileReadme, fetchRepos, fetchUser } from "./api/endpoints";
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

export function useProfileReadme(username: string, enabled = true) {
  const { token } = useToken();
  return useQuery({
    queryKey: ["profile-readme", username.toLowerCase()],
    queryFn: ({ signal }) => fetchHasProfileReadme(username, { token, signal }),
    enabled: enabled && username !== "",
  });
}

export function useRateLimit() {
  return useSyncExternalStore(subscribeRateLimit, getRateLimit, getRateLimit);
}
