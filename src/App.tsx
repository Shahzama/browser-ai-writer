import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Content, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import { joinContinuation, normalizeInline } from "./ai/cleanOutput";
import { DEFAULT_MODEL_ID, MODEL_OPTIONS, SMALL_MODEL_ID } from "./ai/models";
import {
  buildContinueMessages,
  buildRewriteMessages,
  CONTINUE_CONTEXT_CHARS,
  MAX_SELECTION_CHARS,
  type RewriteAction,
} from "./ai/prompts";
import { ModelPanel } from "./components/ModelPanel";
import { SelectionMenu } from "./components/SelectionMenu";
import { SuggestionPanel } from "./components/SuggestionPanel";
import { Toolbar } from "./components/Toolbar";
import { AIDecorations, getGhostPos, setAIDecorations } from "./editor/aiDecorations";
import { useAIEngine } from "./hooks/useAIEngine";
import { useAISuggestion, type SuggestionRequest } from "./hooks/useAISuggestion";
import { loadDoc, loadModelId, saveDoc } from "./lib/storage";
import { isMac } from "./lib/keys";
import { prefersSmallModel } from "./lib/device";

// Sample text with real mistakes. Kept free of instructions on purpose:
// small models tend to follow instructions found inside the text they edit.
const STARTER_CONTENT = `
<h2>Project update</h2>
<p>Hi Priya,</p>
<p>I has reviewed the new design and their are a few thing we needs to change before friday.</p>
<p>The main issue is the checkout page. It loads slowly on mobile and users</p>
`;

function initialModelId(): string {
  const saved = loadModelId();
  if (saved && MODEL_OPTIONS.some((m) => m.id === saved)) return saved;
  return prefersSmallModel() ? SMALL_MODEL_ID : DEFAULT_MODEL_ID;
}

/** Turn plain model output into editor content without parsing it as HTML. */
function toEditorContent(text: string): Content {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (paragraphs.length <= 1) return { type: "text", text: paragraphs[0] ?? text };
  return paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] }));
}

function countWords(editor: Editor | null): number {
  if (!editor) return 0;
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

export default function App() {
  const ai = useAIEngine();
  const suggestion = useAISuggestion(ai.engine);
  const { state: s } = suggestion;
  const [selectedModel, setSelectedModel] = useState(initialModelId);
  const lastRequestRef = useRef<SuggestionRequest | null>(null);
  const prevCharRef = useRef("");
  const saveTimerRef = useRef<number | undefined>(undefined);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing, or select text to use AI…" }),
      AIDecorations,
    ],
    content: (loadDoc() as Content | null) ?? STARTER_CONTENT,
    editorProps: { attributes: { class: "prose", spellcheck: "true", "aria-label": "Document" } },
    onUpdate: ({ editor: e }) => {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => saveDoc(e.getJSON()), 400);
    },
  });

  const aiReady = ai.status === "ready" && ai.engine !== null;
  const aiBusy = s.status === "streaming" || s.status === "review";

  const start = useCallback(
    (request: SuggestionRequest) => {
      lastRequestRef.current = request;
      void suggestion.run(request);
    },
    [suggestion],
  );

  // ---- Actions ---------------------------------------------------------------

  const rewriteSelection = useCallback(
    (action: RewriteAction) => {
      if (!editor || !aiReady) return;
      const { from, to } = editor.state.selection;
      if (from === to) return;
      const original = editor.state.doc.textBetween(from, to, "\n\n");
      if (original.length > MAX_SELECTION_CHARS) {
        suggestion.fail(
          `That selection is too long (${original.length} characters). Small local models work best on up to ${MAX_SELECTION_CHARS} characters, so select a smaller part.`,
        );
        return;
      }
      start({
        mode: "replace",
        label: action.label,
        original,
        range: { from, to },
        messages: buildRewriteMessages(action.instruction, original),
        options: { temperature: action.id === "grammar" ? 0.1 : 0.5, maxTokens: 1024 },
      });
    },
    [editor, aiReady, start, suggestion],
  );

  const continueWriting = useCallback(() => {
    if (!editor || !aiReady || aiBusy) return;
    const pos = editor.state.selection.to;
    const context = editor.state.doc.textBetween(Math.max(0, pos - CONTINUE_CONTEXT_CHARS), pos, "\n\n");
    if (context.trim().length < 20) {
      suggestion.fail("Write a sentence or two first, so the AI has something to continue from.");
      return;
    }
    prevCharRef.current = pos > 1 ? editor.state.doc.textBetween(pos - 1, pos, "\n") : "";
    start({
      mode: "insert",
      label: "Continue writing",
      original: "",
      range: { from: pos, to: pos },
      messages: buildContinueMessages(context),
      options: { temperature: 0.7, maxTokens: 160 },
    });
  }, [editor, aiReady, aiBusy, start, suggestion]);

  const accept = useCallback(() => {
    if (!editor || s.status !== "review" || !s.range) return;
    editor.setEditable(true);
    if (s.mode === "replace") {
      editor.chain().focus().insertContentAt(s.range, toEditorContent(s.text)).run();
    } else {
      const pos = getGhostPos(editor) ?? s.range.from;
      const text = joinContinuation(prevCharRef.current, s.text);
      setAIDecorations(editor, { ghost: null });
      editor
        .chain()
        .focus()
        .insertContentAt(pos, { type: "text", text })
        .setTextSelection(pos + text.length)
        .run();
    }
    suggestion.clear();
  }, [editor, s, suggestion]);

  const reject = useCallback(() => {
    suggestion.clear();
    editor?.commands.focus();
  }, [editor, suggestion]);

  const retry = useCallback(() => {
    if (lastRequestRef.current) start(lastRequestRef.current);
  }, [start]);

  // ---- Keep the editor in sync with the suggestion ---------------------------

  useEffect(() => {
    if (!editor) return;
    // Lock the document while a suggestion is pending, so the target range cannot move.
    editor.setEditable(!aiBusy);
  }, [editor, aiBusy]);

  useEffect(() => {
    if (!editor) return;
    if ((s.status === "streaming" || s.status === "review") && s.range) {
      if (s.mode === "replace") {
        setAIDecorations(editor, { highlight: s.range, ghost: null });
      } else {
        // Hide a leading quote mark while streaming; cleanOutput removes it at the end anyway.
        const preview = s.status === "review" ? s.text : normalizeInline(s.text).replace(/^\s*["“]+/, "");
        setAIDecorations(editor, {
          highlight: null,
          ghost: { pos: s.range.from, text: joinContinuation(prevCharRef.current, preview) },
        });
      }
    } else {
      setAIDecorations(editor, { highlight: null, ghost: null });
    }
  }, [editor, s]);

  // ---- Keyboard shortcuts ----------------------------------------------------

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = isMac ? event.metaKey : event.ctrlKey;

      if (mod && event.key.toLowerCase() === "j") {
        event.preventDefault();
        continueWriting();
        return;
      }
      if (event.key === "Escape") {
        if (s.status === "streaming") {
          event.preventDefault();
          suggestion.stop();
        } else if (s.status === "review" || s.status === "error") {
          event.preventDefault();
          reject();
        }
        return;
      }
      if (s.status !== "review") return;
      if (s.mode === "insert" && event.key === "Tab") {
        event.preventDefault();
        accept();
      } else if (s.mode === "replace" && mod && event.key === "Enter") {
        event.preventDefault();
        accept();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [s.status, s.mode, continueWriting, suggestion, reject, accept]);

  // ---- Render ------------------------------------------------------------------

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo" aria-hidden="true">✦</span>
          <div>
            <h1>Browser AI Writer</h1>
            <p className="muted small">Private AI writing, running fully in your browser</p>
          </div>
        </div>
        <ModelPanel
          engine={ai}
          selectedId={selectedModel}
          onSelect={setSelectedModel}
          onLoad={() => void ai.load(selectedModel)}
        />
      </header>

      <main className="workspace">
        <section className="editor-shell">
          {editor && (
            <>
              <Toolbar editor={editor} aiReady={aiReady} aiBusy={aiBusy} onContinue={continueWriting} />
              <SelectionMenu editor={editor} aiReady={aiReady} busy={aiBusy} onAction={rewriteSelection} />
            </>
          )}
          <EditorContent editor={editor} className="editor" />
          <footer className="status-bar">
            <span>{countWords(editor)} words</span>
            <span>{aiBusy ? "Document locked while you review the AI suggestion" : "Saved in this browser"}</span>
          </footer>
        </section>

        <aside className={`side-panel${s.status === "idle" ? "" : " active"}`} aria-label="AI suggestion">
          <SuggestionPanel
            state={s}
            onAccept={accept}
            onReject={reject}
            onStop={suggestion.stop}
            onRetry={retry}
          />
        </aside>
      </main>
    </div>
  );
}
