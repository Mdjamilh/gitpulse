import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeEvent } from "../test/factories";
import { ActivityTimeline } from "./ActivityTimeline";

const now = new Date(2026, 9, 20, 12);
const at = (day: number) => new Date(2026, 9, day, 10).toISOString();

describe("ActivityTimeline", () => {
  const events = [
    makeEvent({ type: "PushEvent", created_at: at(20), payload: { size: 2, ref: "refs/heads/main" } }),
    makeEvent({ type: "PushEvent", created_at: at(20), repo: { name: "octocat/spoon-knife" } }),
    makeEvent({ type: "WatchEvent", created_at: at(15) }),
    makeEvent({ type: "IssuesEvent", created_at: at(1), payload: { action: "opened" } }),
  ];

  it("draws a bar per day with heights relative to the busiest day", () => {
    const { container } = render(<ActivityTimeline events={events} days={14} now={now} />);
    const bars = container.querySelectorAll("rect[data-date]");
    expect(bars).toHaveLength(14);
    const today = container.querySelector('rect[data-date="2026-10-20"]')!;
    expect(today).toHaveAttribute("data-count", "2");
    expect(today).toHaveClass("timeline-bar");
    expect(container.querySelector('rect[data-date="2026-10-19"]')).toHaveClass("timeline-empty");
    expect(screen.getByRole("img", { name: "Events per day, last 14 days" })).toHaveAccessibleDescription(
      "Oct 15: 1, Oct 20: 2",
    );
  });

  it("summarises the window and event types", () => {
    render(<ActivityTimeline events={events} days={14} now={now} />);
    expect(screen.getByText(/on/, { selector: "p" })).toHaveTextContent("3 events on 2 of the last 14 days");
    const chips = within(screen.getByRole("list", { name: "Event types" }));
    expect(chips.getByText("Pushes")).toHaveTextContent("Pushes 2");
  });

  it("lists recent events with links to the repo", () => {
    render(<ActivityTimeline events={events} now={now} />);
    expect(screen.getByText("Pushed 2 commits to main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "octocat/spoon-knife" })).toHaveAttribute(
      "href",
      "https://github.com/octocat/spoon-knife",
    );
  });

  it("shows an empty state", () => {
    render(<ActivityTimeline events={[]} now={now} />);
    expect(screen.getByText("No public activity in the last 90 days.")).toBeInTheDocument();
  });
});
