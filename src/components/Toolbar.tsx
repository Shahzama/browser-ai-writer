import type { Editor } from "@tiptap/react";
import { MOD_LABEL } from "../lib/keys";

interface ToolbarProps {
  editor: Editor;
  aiReady: boolean;
  aiBusy: boolean;
  onContinue: () => void;
}

export function Toolbar({ editor, aiReady, aiBusy, onContinue }: ToolbarProps) {
  const editable = editor.isEditable;

  const button = (label: string, title: string, active: boolean, run: () => void, disabled = false) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={active ? "active" : ""}
      disabled={!editable || disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      {button("B", "Bold", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run())}
      {button("I", "Italic", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run())}
      {button("H2", "Heading", editor.isActive("heading", { level: 2 }), () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      )}
      {button("•", "Bullet list", editor.isActive("bulletList"), () =>
        editor.chain().focus().toggleBulletList().run(),
      )}
      {button("❝", "Quote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run())}
      <span className="divider" />
      {button("↶", "Undo", false, () => editor.chain().focus().undo().run(), !editor.can().undo())}
      {button("↷", "Redo", false, () => editor.chain().focus().redo().run(), !editor.can().redo())}
      <span className="spacer" />
      <button
        type="button"
        className="ai-button"
        disabled={!aiReady || aiBusy || !editable}
        title={aiReady ? `Continue writing (${MOD_LABEL}+J)` : "Load a model first"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onContinue}
      >
        ✦ Continue writing <kbd>{MOD_LABEL}+J</kbd>
      </button>
    </div>
  );
}
