import { useCallback, useReducer, useRef } from "react";
import { initialSuggestion, suggestionReducer } from "../ai/suggestionReducer";
import type { AIEngine, ChatMessage, StreamOptions, SuggestionMode, TextRange } from "../ai/types";

export interface SuggestionRequest {
  mode: SuggestionMode;
  label: string;
  original: string;
  range: TextRange;
  messages: ChatMessage[];
  options?: StreamOptions;
}

function toMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `Generation failed: ${message}`;
}

export function useAISuggestion(engine: AIEngine | null) {
  const [state, dispatch] = useReducer(suggestionReducer, initialSuggestion);
  // Every run gets an id. Chunks from an old run (after clear or a new run) are ignored.
  const runIdRef = useRef(0);

  const run = useCallback(
    async (request: SuggestionRequest) => {
      if (!engine) return;
      const runId = ++runIdRef.current;
      dispatch({
        type: "start",
        mode: request.mode,
        label: request.label,
        original: request.original,
        range: request.range,
      });

      try {
        for await (const delta of engine.stream(request.messages, request.options)) {
          if (runId !== runIdRef.current) return;
          dispatch({ type: "chunk", delta });
        }
        if (runId === runIdRef.current) dispatch({ type: "finish" });
      } catch (error) {
        if (runId === runIdRef.current) dispatch({ type: "fail", message: toMessage(error) });
      }
    },
    [engine],
  );

  /** Stop generating but keep what was written so far for review. */
  const stop = useCallback(() => {
    engine?.interrupt();
  }, [engine]);

  /** Throw the suggestion away, even if it is still streaming. */
  const clear = useCallback(() => {
    runIdRef.current++;
    if (state.status === "streaming") engine?.interrupt();
    dispatch({ type: "clear" });
  }, [engine, state.status]);

  const fail = useCallback((message: string) => {
    runIdRef.current++;
    dispatch({ type: "fail", message });
  }, []);

  return { state, run, stop, clear, fail };
}
