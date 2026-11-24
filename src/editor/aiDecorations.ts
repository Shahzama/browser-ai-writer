import { Extension, type Editor } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { TextRange } from "../ai/types";

export interface AIDecorationState {
  /** Gray preview text shown at the cursor while "Continue writing" runs. */
  ghost: { pos: number; text: string } | null;
  /** The selected range that is being rewritten. */
  highlight: TextRange | null;
}

export const aiDecorationsKey = new PluginKey<AIDecorationState>("aiDecorations");

/**
 * AI output is shown with decorations, not inserted into the document.
 * The document only changes when the user accepts, so undo history stays
 * clean: one accept = one undo step.
 */
export const AIDecorations = Extension.create({
  name: "aiDecorations",

  addProseMirrorPlugins() {
    return [
      new Plugin<AIDecorationState>({
        key: aiDecorationsKey,
        state: {
          init: () => ({ ghost: null, highlight: null }),
          apply(tr, value) {
            let next = value;
            if (tr.docChanged) {
              next = {
                ghost: next.ghost ? { ...next.ghost, pos: tr.mapping.map(next.ghost.pos) } : null,
                highlight: next.highlight
                  ? { from: tr.mapping.map(next.highlight.from), to: tr.mapping.map(next.highlight.to) }
                  : null,
              };
            }
            const patch = tr.getMeta(aiDecorationsKey) as Partial<AIDecorationState> | undefined;
            return patch ? { ...next, ...patch } : next;
          },
        },
        props: {
          decorations(state) {
            const current = aiDecorationsKey.getState(state);
            if (!current) return null;
            const decorations: Decoration[] = [];

            if (current.highlight && current.highlight.from < current.highlight.to) {
              decorations.push(
                Decoration.inline(current.highlight.from, current.highlight.to, { class: "ai-target" }),
              );
            }

            if (current.ghost && current.ghost.text) {
              const text = current.ghost.text;
              decorations.push(
                Decoration.widget(
                  current.ghost.pos,
                  () => {
                    const span = document.createElement("span");
                    span.className = "ai-ghost";
                    span.textContent = text;
                    span.setAttribute("aria-live", "polite");
                    return span;
                  },
                  { side: 1, key: `ghost-${text.length}` },
                ),
              );
            }

            return decorations.length ? DecorationSet.create(state.doc, decorations) : null;
          },
        },
      }),
    ];
  },
});

export function setAIDecorations(editor: Editor, patch: Partial<AIDecorationState>) {
  if (editor.isDestroyed) return;
  editor.view.dispatch(editor.state.tr.setMeta(aiDecorationsKey, patch));
}

export function getGhostPos(editor: Editor): number | null {
  return aiDecorationsKey.getState(editor.state)?.ghost?.pos ?? null;
}
