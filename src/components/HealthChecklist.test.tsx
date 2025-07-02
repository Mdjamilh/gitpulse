import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { HealthCheck } from "../lib/health";
import { HealthChecklist } from "./HealthChecklist";

const checks: HealthCheck[] = [
  { id: "bio", label: "Bio", status: "pass", detail: "Has a bio", tip: "Write a bio" },
  { id: "topics", label: "Repo topics", status: "partial", detail: "1 of 2", tip: "Add topics" },
  { id: "readme", label: "Profile README", status: "fail", detail: "None", tip: "Create one" },
];

describe("HealthChecklist", () => {
  it("shows the score and each check with its status in text", () => {
    render(<HealthChecklist checks={checks} />);
    expect(screen.getByText("Score: 50 out of 100")).toBeInTheDocument();
    expect(screen.getByText("1 of 3 checks done.", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Repo topics/)).toHaveTextContent("Repo topics (Partly done)");
  });

  it("shows tips only for checks that are not passing", () => {
    render(<HealthChecklist checks={checks} />);
    expect(screen.queryByText("Write a bio")).toBeNull();
    expect(screen.getByText("Add topics")).toBeInTheDocument();
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });
});
