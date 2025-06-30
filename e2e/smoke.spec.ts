import { expect, test, type Page } from "@playwright/test";
import fixtures from "./fixtures.json" with { type: "json" };

type Recorded = { status: number; body: unknown };
const responses = fixtures.responses as Record<string, Recorded>;

const RATE = {
  "x-ratelimit-limit": "60",
  "x-ratelimit-remaining": "55",
  "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600),
  "access-control-allow-origin": "*",
  "access-control-expose-headers": "x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset",
};

const AVATAR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="#888"/></svg>';

/** Serve recorded GitHub responses; anything unrecorded is a 404. */
async function routeGitHub(page: Page) {
  await page.route("https://api.github.com/**", async (route) => {
    const url = new URL(route.request().url());
    const hit = responses[url.pathname + url.search];
    await route.fulfill({
      status: hit?.status ?? 404,
      contentType: "application/json",
      headers: RATE,
      body: JSON.stringify(hit?.body ?? { message: "Not Found" }),
    });
  });
  await page.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/svg+xml", body: AVATAR }),
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    // The 404 for the missing profile README is expected and logged by Chrome.
    if (msg.type() === "error" && !/404/.test(msg.text())) errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test("analyzes octocat from recorded API responses", async ({ page }) => {
  const errors = collectErrors(page);
  await routeGitHub(page);
  await page.goto("/");

  await page.getByLabel("GitHub username").fill("octocat");
  await page.getByRole("button", { name: "Analyze" }).click();

  await expect(page).toHaveURL(/\?user=octocat$/);
  await expect(page.getByRole("heading", { name: "The Octocat" })).toBeVisible();

  const repos = page.getByRole("region", { name: "Top repositories" });
  await expect(repos.getByRole("link").first()).toHaveText("Spoon-Knife");
  await expect(page.getByRole("img", { name: "Languages by number of repositories" })).toBeVisible();

  const health = page.getByRole("region", { name: "Profile health" });
  await expect(health.getByText("No octocat/octocat README")).toBeVisible();
  await expect(page.getByText("55 of 60")).toBeVisible();

  expect(errors).toEqual([]);
});

test("shows when the rate limit resets", async ({ page }) => {
  const reset = Math.floor(Date.now() / 1000) + 30 * 60;
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      headers: { ...RATE, "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(reset) },
      body: JSON.stringify({ message: "API rate limit exceeded" }),
    }),
  );
  await page.goto("/?user=octocat");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("hourly request limit was reached");
  await expect(alert).toContainText(/in about (29|30) minutes/);
  await expect(page.getByRole("button", { name: "Waiting for reset" })).toBeDisabled();
});
