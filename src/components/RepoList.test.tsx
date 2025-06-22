import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeRepo } from "../test/factories";
import { RepoList } from "./RepoList";

describe("RepoList", () => {
  it("lists repos with stars, forks and language", () => {
    render(
      <RepoList
        totalOwn={2}
        repos={[
          makeRepo({ name: "alpha", stargazers_count: 1500, forks_count: 3, language: "Go" }),
          makeRepo({ name: "beta", description: null, language: null }),
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem").filter((li) => li.classList.contains("repo"));
    expect(items).toHaveLength(2);
    const alpha = within(items[0]);
    expect(alpha.getByRole("link", { name: "alpha" })).toHaveAttribute("href", "https://github.com/octocat/alpha");
    expect(alpha.getByLabelText("1500 stars")).toHaveTextContent("1.5K");
    expect(alpha.getByText("Go")).toBeInTheDocument();
    expect(within(items[1]).getByText("No description")).toBeInTheDocument();
    expect(screen.getByText(/from 2 original public repos/)).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<RepoList repos={[]} totalOwn={0} />);
    expect(screen.getByText("No original public repositories yet.")).toBeInTheDocument();
  });
});
