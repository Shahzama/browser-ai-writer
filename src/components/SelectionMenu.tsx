import { BubbleMenu, type Editor } from "@tiptap/react";
import { useState, type FormEvent } from "react";
import { REWRITE_ACTIONS, type RewriteAction } from "../ai/prompts";

interface SelectionMenuProps {
  editor: Editor;
  aiReady: boolean;
  onAction: (action: RewriteAction) => void;
}

export function SelectionMenu({ editor, aiReady, onAction }: SelectionMenuProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [instruction, setInstruction] = useState("");

  const submitCustom = (event: FormEvent) => {
    event.preventDefault();
    const text = instruction.trim();
    if (!text) return;
    onAction({ id: "custom", label: "Custom edit", instruction: text });
    setInstruction("");
    setCustomOpen(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 120, placement: "top-start", onHidden: () => setCustomOpen(false) }}
      shouldShow={({ editor: e, from, to }) => e.isEditable && from !== to}
    >
      <div className="bubble" role="menu" aria-label="AI actions for selected text">
        {!aiReady ? (
          <span className="bubble-hint">Load a model to use AI on this selection</span>
        ) : customOpen ? (
          <form className="bubble-form" onSubmit={submitCustom}>
            <input
              autoFocus
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="e.g. Turn this into bullet points"
              aria-label="Custom instruction"
            />
            <button type="submit" className="primary" disabled={!instruction.trim()}>
              Go
            </button>
          </form>
        ) : (
          <>
            <span className="bubble-label">✦ AI</span>
            {REWRITE_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onAction(action)}
              >
                {action.label}
              </button>
            ))}
            <button type="button" role="menuitem" onClick={() => setCustomOpen(true)}>
              Custom…
            </button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
