import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeUser } from "../test/factories";
import { ProfileHeader } from "./ProfileHeader";

describe("ProfileHeader", () => {
  it("shows identity, bio and stats", () => {
    render(
      <ProfileHeader
        user={makeUser({ followers: 12345 })}
        totals={{ count: 3, stars: 42, forks: 7 }}
      />,
    );
    expect(screen.getByRole("heading", { name: "The Octocat" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "@octocat" })).toHaveAttribute("href", "https://github.com/octocat");
    expect(screen.getByText("Mascot")).toBeInTheDocument();
    const followers = screen.getByText("Followers").parentElement!;
    expect(within(followers).getByText("12.3K")).toBeInTheDocument();
    expect(within(screen.getByText("Stars earned").parentElement!).getByText("42")).toBeInTheDocument();
  });

  it("falls back to the login and adds a scheme to bare blog URLs", () => {
    render(<ProfileHeader user={makeUser({ name: null, blog: "example.com" })} />);
    expect(screen.getByRole("heading", { name: "octocat" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "example.com" })).toHaveAttribute("href", "https://example.com/");
  });

  it("does not link unsafe blog values", () => {
    render(<ProfileHeader user={makeUser({ blog: "javascript:alert(1)" })} />);
    expect(screen.queryByRole("link", { name: /javascript/ })).toBeNull();
  });
});
