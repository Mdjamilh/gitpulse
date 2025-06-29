// Records real GitHub API responses for one user into e2e/fixtures.json so
// the Playwright smoke test runs offline against realistic data.
//
//   node scripts/record-fixtures.mjs [username]
//
// Uses 4 to 6 unauthenticated requests. Set GITHUB_TOKEN to use a token.

import { writeFile } from "node:fs/promises";

const user = process.argv[2] ?? "octocat";
const paths = [
  `/users/${user}`,
  `/users/${user}/repos?per_page=100&type=owner&sort=pushed&page=1`,
  `/users/${user}/events/public?per_page=100`,
  `/repos/${user}/${user}/readme`,
];

const headers = { Accept: "application/vnd.github+json", "User-Agent": "gitpulse-fixture-recorder" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const fixtures = { recordedAt: new Date().toISOString(), user, responses: {} };
for (const path of paths) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 403 || res.status === 429) {
    console.error(`Rate limited on ${path}; try again after ${res.headers.get("x-ratelimit-reset")}`);
    process.exit(1);
  }
  const body = await res.json();
  fixtures.responses[path] = { status: res.status, body };
  console.log(res.status, path);
}

const url = new URL("../e2e/fixtures.json", import.meta.url);
await writeFile(url, JSON.stringify(fixtures, null, 2) + "\n");
console.log(`Wrote ${url.pathname}`);
