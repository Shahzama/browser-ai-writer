import { describe, expect, it } from "vitest";
import { cleanOutput, joinContinuation, normalizeInline } from "./cleanOutput";

describe("cleanOutput", () => {
  it("removes a 'Here is the rewritten text:' preamble", () => {
    expect(cleanOutput("Here is the rewritten text:\n\nThe meeting moved to Friday.", "replace")).toBe(
      "The meeting moved to Friday.",
    );
  });

  it("removes a 'Sure! ...:' preamble", () => {
    expect(cleanOutput("Sure! Here you go:\nFixed sentence.", "replace")).toBe("Fixed sentence.");
  });

  it("keeps a real sentence that starts with 'Here is'", () => {
    expect(cleanOutput("Here is the plan for next week.", "replace")).toBe("Here is the plan for next week.");
  });

  it("unwraps text the model put in quotes", () => {
    expect(cleanOutput('"Short and clear."', "replace")).toBe("Short and clear.");
    expect(cleanOutput('"""\nTriple quoted.\n"""', "replace")).toBe("Triple quoted.");
  });

  it("does not unwrap when quotes are also used inside", () => {
    const text = '"Yes," she said, "today."';
    expect(cleanOutput(text, "replace")).toBe(text);
  });

  it("keeps paragraph breaks in replace mode but limits blank lines", () => {
    expect(cleanOutput("One.\n\n\n\nTwo.", "replace")).toBe("One.\n\nTwo.");
  });

  it("puts everything on one line in insert mode", () => {
    expect(cleanOutput("First line.\nSecond line.", "insert")).toBe("First line. Second line.");
  });

  it("returns an empty string for empty output", () => {
    expect(cleanOutput("   \n ", "replace")).toBe("");
  });
});

describe("normalizeInline", () => {
  it("collapses newlines and repeated spaces", () => {
    expect(normalizeInline("a\n\n  b   c")).toBe("a b c");
  });
});

describe("joinContinuation", () => {
  it("adds a space after a word", () => {
    expect(joinContinuation(".", "Next sentence.")).toBe(" Next sentence.");
  });

  it("does not double spaces", () => {
    expect(joinContinuation(" ", "  next")).toBe("next");
    expect(joinContinuation("d", "   next")).toBe(" next");
  });

  it("does not add a space before punctuation", () => {
    expect(joinContinuation("d", ", and more.")).toBe(", and more.");
  });

  it("handles the start of a paragraph", () => {
    expect(joinContinuation("", " Hello")).toBe("Hello");
  });
});
