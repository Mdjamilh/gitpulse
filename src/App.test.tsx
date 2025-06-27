import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetRateLimit } from "./api/client";
import App from "./App";
import { mockFetch } from "./test/fetch";
import { makeEvent, makeRepo, makeUser } from "./test/factories";
import { renderWithProviders } from "./test/render";

const REPOS = "/users/octocat/repos?per_page=100&type=owner&sort=pushed&page=1";

function octocatRoutes() {
  return {
    "/users/octocat": { body: makeUser() },
    [REPOS]: {
      body: [
        makeRepo({ name: "hello-world", stargazers_count: 2500, language: "JavaScript", topics: ["demo"] }),
        makeRepo({ name: "spoon-knife", stargazers_count: 12000, language: "HTML", description: null }),
        makeRepo({ name: "a-fork", fork: true }),
      ],
    },
    "/users/octocat/events/public?per_page=100": {
      body: [makeEvent({ created_at: new Date().toISOString(), payload: { size: 1, ref: "refs/heads/main" } })],
    },
    "/repos/octocat/octocat/readme": { status: 404 },
  };
}

beforeEach(() => window.history.replaceState(null, "", "/"));
afterEach(() => resetRateLimit());

describe("App", () => {
  it("loads a full profile dashboard after a search", async () => {
    const fetch = mockFetch(octocatRoutes());
    renderWithProviders(<App />);

    await userEvent.type(screen.getByLabelText("GitHub username"), "octocat{Enter}");

    expect(await screen.findByRole("heading", { name: "The Octocat" })).toBeInTheDocument();
    expect(window.location.search).toBe("?user=octocat");
    expect(document.title).toBe("@octocat - GitPulse");

    const repos = await screen.findByRole("region", { name: "Top repositories" });
    const names = within(repos)
      .getAllByRole("link")
      .map((a) => a.textContent);
    expect(names).toEqual(["spoon-knife", "hello-world"]);

    expect(screen.getByRole("img", { name: "Languages by number of repositories" })).toBeInTheDocument();
    expect(await screen.findByText("Pushed 1 commit to main")).toBeInTheDocument();

    const health = await screen.findByRole("region", { name: "Profile health" });
    expect(within(health).getByText("No octocat/octocat README")).toBeInTheDocument();
    expect(within(health).getByText("1 of 2 showcase repos have a description")).toBeInTheDocument();

    expect(screen.getByText("57 of 60")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("reads the username from the URL", async () => {
    mockFetch(octocatRoutes());
    window.history.replaceState(null, "", "/?user=octocat");
    renderWithProviders(<App />);
    expect(await screen.findByRole("heading", { name: "The Octocat" })).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub username")).toHaveValue("octocat");
  });

  it("ignores an invalid username in the URL", () => {
    const fetch = mockFetch({});
    window.history.replaceState(null, "", "/?user=--bad--");
    renderWithProviders(<App />);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows a not found message", async () => {
    mockFetch({});
    renderWithProviders(<App />);
    await userEvent.type(screen.getByLabelText("GitHub username"), "ghost-user-x{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent('No GitHub user called "ghost-user-x"');
  });

  it("shows the reset time when rate limited and recovers with a token", async () => {
    const reset = Math.floor(Date.now() / 1000) + 600;
    let limited = true;
    const routes = octocatRoutes();
    const fetch = mockFetch({
      ...routes,
      "/users/octocat": () =>
        limited
          ? {
              status: 403,
              body: { message: "API rate limit exceeded" },
              headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(reset) },
            }
          : routes["/users/octocat"],
    });
    renderWithProviders(<App />);
    await userEvent.type(screen.getByLabelText("GitHub username"), "octocat{Enter}");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("hourly request limit was reached");
    expect(alert).toHaveTextContent(/in about 10 minutes/);

    limited = false;
    await userEvent.click(screen.getByText(/Optional: use a GitHub access token/));
    await userEvent.type(screen.getByLabelText("Personal access token"), "github_pat_test");
    await userEvent.click(screen.getByRole("button", { name: "Use token" }));

    expect(await screen.findByRole("heading", { name: "The Octocat" })).toBeInTheDocument();
    await waitFor(() => {
      const authed = fetch.mock.calls.filter(
        ([, init]) => (init?.headers as Record<string, string>)?.Authorization === "Bearer github_pat_test",
      );
      expect(authed.length).toBeGreaterThan(0);
    });
  });
});
