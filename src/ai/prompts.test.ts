import { describe, expect, it } from "vitest";
import { resolveModelId } from "./models";
import { buildContinueMessages, buildRewriteMessages, CONTINUE_CONTEXT_CHARS } from "./prompts";

describe("buildRewriteMessages", () => {
  it("sends a system rule message and the user text", () => {
    const messages = buildRewriteMessages("Fix grammar.", "me and him goes");
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].content).toContain("Instruction: Fix grammar.");
    expect(messages[1].content).toContain("me and him goes");
  });

  it("rejects an empty instruction", () => {
    expect(() => buildRewriteMessages("   ", "text")).toThrow();
  });
});

describe("buildContinueMessages", () => {
  it("only sends the end of a long document", () => {
    const long = "a".repeat(CONTINUE_CONTEXT_CHARS) + "THE END";
    const content = buildContinueMessages(long)[1].content;
    expect(content).toContain("THE END");
    expect(content.length).toBeLessThan(CONTINUE_CONTEXT_CHARS + 100);
  });
});

describe("resolveModelId", () => {
  it("keeps the f16 model when the GPU supports it", () => {
    expect(resolveModelId("Llama-3.2-1B-Instruct-q4f16_1-MLC", true)).toBe("Llama-3.2-1B-Instruct-q4f16_1-MLC");
  });

  it("switches to the f32 model for older GPUs", () => {
    expect(resolveModelId("Llama-3.2-1B-Instruct-q4f16_1-MLC", false)).toBe("Llama-3.2-1B-Instruct-q4f32_1-MLC");
  });
});
