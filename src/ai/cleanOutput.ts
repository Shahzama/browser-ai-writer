import type { SuggestionMode } from "./types";

// Small models often ignore "reply with the text only" and add a line like
// "Here is the rewritten text:". These patterns strip that noise.
// The patterns are strict on purpose (they need words like "text" or
// "version" and a colon) so real sentences such as "Here is the plan." survive.
const PREAMBLE_PATTERNS: RegExp[] = [
  /^(?:sure|certainly|okay|ok|of course)\b[^\n]*?:\s*\n+/i,
  /^here(?:'s| is| are)\b[^\n:]*\b(?:text|version|rewrite|continuation|sentences?|paragraphs?)\b[^\n:]*:\s*/i,
  /^(?:rewritten|revised|corrected|improved|shortened|edited) (?:text|version)\s*:\s*/i,
];

const QUOTE_PAIRS: Array<[string, string]> = [
  ['"""', '"""'],
  ['"', '"'],
  ["“", "”"],
  ["'", "'"],
];

/** Collapse line breaks and repeated spaces so text fits inline in a sentence. */
export function normalizeInline(text: string): string {
  return text.replace(/\s*\n+\s*/g, " ").replace(/[ \t]{2,}/g, " ");
}

export function cleanOutput(raw: string, mode: SuggestionMode): string {
  let text = raw.trim();

  for (const pattern of PREAMBLE_PATTERNS) {
    text = text.replace(pattern, "").trim();
  }

  for (const [open, close] of QUOTE_PAIRS) {
    if (text.length > open.length + close.length && text.startsWith(open) && text.endsWith(close)) {
      const inner = text.slice(open.length, text.length - close.length);
      // Only unwrap if the quote mark is not also used inside the text.
      if (!inner.includes(close)) {
        text = inner.trim();
        break;
      }
    }
  }

  if (mode === "insert") {
    text = normalizeInline(text).trim();
  } else {
    text = text.replace(/\n{3,}/g, "\n\n");
  }

  return text;
}

/**
 * Decide how generated text should join the character before the cursor,
 * so we never get "word.Next" or "word  next".
 */
export function joinContinuation(prevChar: string, text: string): string {
  if (!text) return "";
  if (!prevChar || /\s/.test(prevChar)) return text.trimStart();
  if (/^\s/.test(text)) return " " + text.trimStart();
  if (/^[,.;:!?)\]]/.test(text)) return text;
  return " " + text;
}
