import { describe, expect, it } from "vitest";
import { EMPTY_OUTPUT_ERROR, initialSuggestion, suggestionReducer, type SuggestionState } from "./suggestionReducer";

const started: SuggestionState = suggestionReducer(initialSuggestion, {
  type: "start",
  mode: "replace",
  label: "Improve",
  original: "old text",
  range: { from: 1, to: 9 },
});

describe("suggestionReducer", () => {
  it("starts streaming with an empty result", () => {
    expect(started.status).toBe("streaming");
    expect(started.text).toBe("");
    expect(started.range).toEqual({ from: 1, to: 9 });
  });

  it("adds chunks while streaming", () => {
    const next = suggestionReducer(suggestionReducer(started, { type: "chunk", delta: "New" }), {
      type: "chunk",
      delta: " text",
    });
    expect(next.text).toBe("New text");
  });

  it("ignores chunks when not streaming", () => {
    expect(suggestionReducer(initialSuggestion, { type: "chunk", delta: "late" })).toBe(initialSuggestion);
  });

  it("moves to review and cleans the output on finish", () => {
    const withText = suggestionReducer(started, { type: "chunk", delta: "Here is the rewritten text:\nNew text" });
    const done = suggestionReducer(withText, { type: "finish" });
    expect(done.status).toBe("review");
    expect(done.text).toBe("New text");
  });

  it("shows an error if the model returned nothing", () => {
    const done = suggestionReducer(started, { type: "finish" });
    expect(done.status).toBe("error");
    expect(done.error).toBe(EMPTY_OUTPUT_ERROR);
  });

  it("goes back to idle on clear", () => {
    expect(suggestionReducer(started, { type: "clear" })).toEqual(initialSuggestion);
  });

  it("stores the failure message", () => {
    const failed = suggestionReducer(started, { type: "fail", message: "GPU lost" });
    expect(failed.status).toBe("error");
    expect(failed.error).toBe("GPU lost");
  });
});

describe("suggestionReducer word limit", () => {
  it("trims continue-writing output to the chosen length", () => {
    const long = Array.from({ length: 3 }, () => "one two three four five six seven eight nine ten.").join(" ");
    let state = suggestionReducer(initialSuggestion, {
      type: "start",
      mode: "insert",
      label: "Continue writing",
      original: "",
      range: { from: 5, to: 5 },
      maxWords: 10,
    });
    state = suggestionReducer(state, { type: "chunk", delta: long });
    state = suggestionReducer(state, { type: "finish" });
    expect(state.text).toBe("one two three four five six seven eight nine ten.");
  });
});
