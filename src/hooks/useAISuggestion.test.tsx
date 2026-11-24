import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AIEngine } from "../ai/types";
import { useAISuggestion, type SuggestionRequest } from "./useAISuggestion";

/** A fake engine that streams fixed chunks and respects interrupt(). */
function createMockEngine(chunks: string[], options: { failAfter?: number } = {}): AIEngine {
  let interrupted = false;
  return {
    interrupt: vi.fn(() => {
      interrupted = true;
    }),
    async *stream() {
      interrupted = false;
      for (let i = 0; i < chunks.length; i++) {
        if (interrupted) return;
        if (options.failAfter === i) throw new Error("GPU device lost");
        await Promise.resolve();
        yield chunks[i];
      }
    },
  };
}

const request: SuggestionRequest = {
  mode: "replace",
  label: "Improve",
  original: "old",
  range: { from: 1, to: 4 },
  messages: [{ role: "user", content: "old" }],
};

describe("useAISuggestion", () => {
  it("streams chunks and ends in review", async () => {
    const engine = createMockEngine(["New", " and", " better"]);
    const { result } = renderHook(() => useAISuggestion(engine));

    await act(async () => {
      await result.current.run(request);
    });

    expect(result.current.state.status).toBe("review");
    expect(result.current.state.text).toBe("New and better");
  });

  it("reports a model failure as an error", async () => {
    const engine = createMockEngine(["a", "b"], { failAfter: 1 });
    const { result } = renderHook(() => useAISuggestion(engine));

    await act(async () => {
      await result.current.run(request);
    });

    expect(result.current.state.status).toBe("error");
    expect(result.current.state.error).toContain("GPU device lost");
  });

  it("does nothing without an engine", async () => {
    const { result } = renderHook(() => useAISuggestion(null));

    await act(async () => {
      await result.current.run(request);
    });

    expect(result.current.state.status).toBe("idle");
  });

  it("clear() throws away the suggestion", async () => {
    const engine = createMockEngine(["done"]);
    const { result } = renderHook(() => useAISuggestion(engine));

    await act(async () => {
      await result.current.run(request);
    });
    act(() => {
      result.current.clear();
    });

    expect(result.current.state.status).toBe("idle");
  });
});
