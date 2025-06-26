import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TokenProvider, useToken } from "../token";
import { TokenPanel } from "./TokenPanel";

function ShowToken() {
  const { token } = useToken();
  return <output data-testid="token">{token}</output>;
}

function setup(onChange = vi.fn()) {
  render(
    <TokenProvider>
      <TokenPanel onChange={onChange} defaultOpen />
      <ShowToken />
    </TokenProvider>,
  );
  return onChange;
}

describe("TokenPanel", () => {
  it("keeps a pasted token in memory only", async () => {
    const onChange = setup();
    const input = screen.getByLabelText("Personal access token");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.type(input, " github_pat_abc ");
    await userEvent.click(screen.getByRole("button", { name: "Use token" }));

    expect(screen.getByTestId("token")).toHaveTextContent("github_pat_abc");
    expect(onChange).toHaveBeenCalledOnce();
    expect(screen.getByText(/Using your access token/)).toBeInTheDocument();

    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie;
    expect(stored).not.toContain("github_pat_abc");
    expect(window.location.href).not.toContain("github_pat_abc");
  });

  it("can forget the token", async () => {
    const onChange = setup();
    await userEvent.type(screen.getByLabelText("Personal access token"), "tok");
    await userEvent.click(screen.getByRole("button", { name: "Use token" }));
    await userEvent.click(screen.getByRole("button", { name: "Forget token" }));
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("does not submit an empty token", () => {
    setup();
    expect(screen.getByRole("button", { name: "Use token" })).toBeDisabled();
  });
});
