import { BubbleMenu, type Editor } from "@tiptap/react";
import { useRef, useState, type FormEvent } from "react";
import { REWRITE_ACTIONS, type RewriteAction } from "../ai/prompts";
import { isTouchDevice } from "../lib/device";

// Phones show their own copy/paste bar above a selection, so our menu goes below it there.
const MENU_PLACEMENT = isTouchDevice() ? "bottom-start" : "top-start";

interface SelectionMenuProps {
  editor: Editor;
  aiReady: boolean;
  /** True while a suggestion is streaming or waiting for review. */
  busy: boolean;
  onAction: (action: RewriteAction) => void;
}

/**
 * The BubbleMenu must stay mounted. Tiptap moves its element elsewhere in the
 * DOM while it is visible, so unmounting it at that moment makes React crash
 * ("removeChild: the node to be removed is not a child of this node").
 * During review we keep it mounted but render nothing inside it.
 */
export function SelectionMenu({ editor, aiReady, busy, onAction }: SelectionMenuProps) {
  const busyRef = useRef(busy);
  busyRef.current = busy;
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
      tippyOptions={{ duration: 120, placement: MENU_PLACEMENT, onHidden: () => setCustomOpen(false) }}
      shouldShow={({ editor: e, from, to }) => !busyRef.current && e.isEditable && from !== to}
    >
      {busy ? null : (
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
      )}
    </BubbleMenu>
  );
}
