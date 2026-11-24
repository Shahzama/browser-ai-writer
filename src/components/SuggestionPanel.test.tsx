import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { initialSuggestion, type SuggestionState } from "../ai/suggestionReducer";
import { SuggestionPanel } from "./SuggestionPanel";

const review: SuggestionState = {
  ...initialSuggestion,
  status: "review",
  mode: "replace",
  label: "Fix grammar",
  original: "the cat sat",
  text: "the dog sat",
  range: { from: 1, to: 12 },
};

function setup(state: SuggestionState) {
  const handlers = { onAccept: vi.fn(), onReject: vi.fn(), onStop: vi.fn(), onRetry: vi.fn() };
  render(<SuggestionPanel state={state} {...handlers} />);
  return handlers;
}

describe("SuggestionPanel", () => {
  it("shows tips when idle", () => {
    setup(initialSuggestion);
    expect(screen.getByText("How to use")).toBeInTheDocument();
  });

  it("shows removed and added words in review", () => {
    setup(review);
    expect(screen.getByText("cat").tagName).toBe("DEL");
    expect(screen.getByText("dog").tagName).toBe("INS");
  });

  it("calls accept and reject", async () => {
    const user = userEvent.setup();
    const handlers = setup(review);
    await user.click(screen.getByRole("button", { name: /accept/i }));
    await user.click(screen.getByRole("button", { name: /reject/i }));
    expect(handlers.onAccept).toHaveBeenCalledOnce();
    expect(handlers.onReject).toHaveBeenCalledOnce();
  });

  it("shows a stop button while streaming", async () => {
    const user = userEvent.setup();
    const handlers = setup({ ...review, status: "streaming", text: "the d" });
    await user.click(screen.getByRole("button", { name: /stop/i }));
    expect(handlers.onStop).toHaveBeenCalledOnce();
  });

  it("shows the error message", () => {
    setup({ ...initialSuggestion, status: "error", error: "Model crashed" });
    expect(screen.getByRole("alert")).toHaveTextContent("Model crashed");
  });
});
