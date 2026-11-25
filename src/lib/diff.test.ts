import { describe, expect, it } from "vitest";
import { diffWords, tokenize } from "./diff";

describe("tokenize", () => {
  it("keeps words and whitespace as separate tokens", () => {
    expect(tokenize("hi  there\nyou")).toEqual(["hi", "  ", "there", "\n", "you"]);
  });

  it("returns an empty list for empty text", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("splits punctuation but keeps apostrophes inside words", () => {
    expect(tokenize('"It\'s ok."')).toEqual(['"', "It's", " ", "ok", ".", '"']);
  });
});

describe("diffWords with punctuation", () => {
  it("only marks the quotes as removed, not the whole words", () => {
    expect(diffWords('"It\'s great."', "It's great.")).toEqual([
      { type: "removed", value: '"' },
      { type: "equal", value: "It's great." },
      { type: "removed", value: '"' },
    ]);
  });
});

describe("diffWords", () => {
  it("marks identical text as one equal part", () => {
    expect(diffWords("same text", "same text")).toEqual([{ type: "equal", value: "same text" }]);
  });

  it("finds a replaced word", () => {
    expect(diffWords("the cat sat", "the dog sat")).toEqual([
      { type: "equal", value: "the " },
      { type: "removed", value: "cat" },
      { type: "added", value: "dog" },
      { type: "equal", value: " sat" },
    ]);
  });

  it("finds added words at the end", () => {
    expect(diffWords("hello", "hello world")).toEqual([
      { type: "equal", value: "hello" },
      { type: "added", value: " world" },
    ]);
  });

  it("handles empty inputs", () => {
    expect(diffWords("", "")).toEqual([]);
    expect(diffWords("", "new")).toEqual([{ type: "added", value: "new" }]);
    expect(diffWords("old", "")).toEqual([{ type: "removed", value: "old" }]);
  });

  it("can always rebuild both texts from the parts", () => {
    const before = "Their going to the store tomorow, and they will by milk.";
    const after = "They're going to the store tomorrow, and they will buy milk.";
    const parts = diffWords(before, after);
    const rebuiltBefore = parts.filter((p) => p.type !== "added").map((p) => p.value).join("");
    const rebuiltAfter = parts.filter((p) => p.type !== "removed").map((p) => p.value).join("");
    expect(rebuiltBefore).toBe(before);
    expect(rebuiltAfter).toBe(after);
  });
});
