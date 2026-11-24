import { cleanOutput } from "./cleanOutput";
import type { SuggestionMode, TextRange } from "./types";

export type SuggestionStatus = "idle" | "streaming" | "review" | "error";

export interface SuggestionState {
  status: SuggestionStatus;
  mode: SuggestionMode;
  label: string;
  original: string;
  text: string;
  range: TextRange | null;
  error: string | null;
}

export type SuggestionAction =
  | { type: "start"; mode: SuggestionMode; label: string; original: string; range: TextRange }
  | { type: "chunk"; delta: string }
  | { type: "finish" }
  | { type: "fail"; message: string }
  | { type: "clear" };

export const initialSuggestion: SuggestionState = {
  status: "idle",
  mode: "replace",
  label: "",
  original: "",
  text: "",
  range: null,
  error: null,
};

export const EMPTY_OUTPUT_ERROR =
  "The model returned an empty answer. Try again, or load a bigger model for better results.";

/**
 * idle -> streaming -> review -> idle (accept or reject)
 *            |            \-> error (empty output)
 *            \-> error (model failure)
 * Keeping this as a pure function makes every transition easy to unit test.
 */
export function suggestionReducer(state: SuggestionState, action: SuggestionAction): SuggestionState {
  switch (action.type) {
    case "start":
      return {
        ...initialSuggestion,
        status: "streaming",
        mode: action.mode,
        label: action.label,
        original: action.original,
        range: action.range,
      };
    case "chunk":
      if (state.status !== "streaming") return state;
      return { ...state, text: state.text + action.delta };
    case "finish": {
      if (state.status !== "streaming") return state;
      const text = cleanOutput(state.text, state.mode);
      if (!text) return { ...initialSuggestion, status: "error", error: EMPTY_OUTPUT_ERROR };
      return { ...state, status: "review", text };
    }
    case "fail":
      return { ...initialSuggestion, status: "error", error: action.message };
    case "clear":
      return initialSuggestion;
    default:
      return state;
  }
}
