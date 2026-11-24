import { useState } from "react";
import type { SuggestionState } from "../ai/suggestionReducer";
import { MOD_LABEL } from "../lib/keys";
import { DiffView } from "./DiffView";

interface SuggestionPanelProps {
  state: SuggestionState;
  onAccept: () => void;
  onReject: () => void;
  onStop: () => void;
  onRetry: () => void;
}

function Tips() {
  return (
    <div className="panel-card tips">
      <h2>How to use</h2>
      <ol>
        <li>Load a model above. The first time it downloads once, then it is cached in your browser.</li>
        <li>Select some text and pick an action, or write your own instruction.</li>
        <li>
          Put the cursor at the end of a sentence and press <kbd>{MOD_LABEL}</kbd>+<kbd>J</kbd> to continue
          writing.
        </li>
        <li>Review the changes, then accept or reject. Accepting is a single undo step.</li>
      </ol>
      <p className="muted">Everything runs on your device. Your text is never sent to a server.</p>
    </div>
  );
}

export function SuggestionPanel({ state, onAccept, onReject, onStop, onRetry }: SuggestionPanelProps) {
  const [view, setView] = useState<"changes" | "result">("changes");

  if (state.status === "idle") return <Tips />;

  if (state.status === "error") {
    return (
      <div className="panel-card error" role="alert">
        <h2>Something went wrong</h2>
        <p>{state.error}</p>
        <button type="button" onClick={onReject}>
          Dismiss
        </button>
      </div>
    );
  }

  const isInsert = state.mode === "insert";
  const acceptKey = isInsert ? "Tab" : `${MOD_LABEL}+Enter`;

  if (state.status === "streaming") {
    return (
      <div className="panel-card" aria-busy="true">
        <header className="panel-header">
          <h2>{state.label}</h2>
          <span className="badge live">Writing…</span>
        </header>
        <p className="stream-text">
          {state.text}
          <span className="caret" aria-hidden="true" />
        </p>
        <div className="actions">
          <button type="button" onClick={onStop}>
            Stop <kbd>Esc</kbd>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <header className="panel-header">
        <h2>{state.label}</h2>
        <span className="badge">Review</span>
      </header>

      {isInsert ? (
        <p className="stream-text">{state.text}</p>
      ) : (
        <>
          <div className="segmented" role="tablist" aria-label="Suggestion view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "changes"}
              className={view === "changes" ? "active" : ""}
              onClick={() => setView("changes")}
            >
              Changes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "result"}
              className={view === "result" ? "active" : ""}
              onClick={() => setView("result")}
            >
              Result
            </button>
          </div>
          {view === "changes" ? (
            <DiffView before={state.original} after={state.text} />
          ) : (
            <p className="stream-text">{state.text}</p>
          )}
        </>
      )}

      <div className="actions">
        <button type="button" className="primary" onClick={onAccept}>
          Accept <kbd>{acceptKey}</kbd>
        </button>
        <button type="button" onClick={onReject}>
          {isInsert ? "Dismiss" : "Reject"} <kbd>Esc</kbd>
        </button>
        <button type="button" className="ghost" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
