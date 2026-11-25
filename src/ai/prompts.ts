import type { ChatMessage } from "./types";

export type RewriteActionId = "improve" | "shorten" | "grammar" | "formal" | "friendly" | "custom";

export interface RewriteAction {
  id: RewriteActionId;
  label: string;
  instruction: string;
}

export const REWRITE_ACTIONS: RewriteAction[] = [
  { id: "improve", label: "Improve", instruction: "Make this text clearer and easier to read." },
  { id: "shorten", label: "Shorten", instruction: "Make this text shorter. Keep every key point." },
  {
    id: "grammar",
    label: "Fix grammar",
    instruction: "Fix spelling, grammar and punctuation. Change nothing else.",
  },
  { id: "formal", label: "Formal", instruction: "Rewrite this text in a professional, formal tone." },
  { id: "friendly", label: "Friendly", instruction: "Rewrite this text in a warm, friendly tone." },
];

export const MAX_SELECTION_CHARS = 4000;
export const CONTINUE_CONTEXT_CHARS = 1500;

const REWRITE_SYSTEM = [
  "You are an editing assistant inside a text editor.",
  "Rewrite the text the user gives you, following the instruction.",
  "Rules:",
  "- Reply with the rewritten text only.",
  "- Do not add a title, a preface, quotation marks or any explanation.",
  "- Keep the original language and meaning.",
  "- Keep paragraph breaks.",
].join("\n");

const CONTINUE_SYSTEM = [
  "You are a writing assistant inside a text editor.",
  "Continue the user's text naturally, in the same voice and language.",
  "Reply with the new sentences only. Do not repeat the existing text and do not explain anything.",
].join("\n");

export function buildRewriteMessages(instruction: string, text: string): ChatMessage[] {
  const cleanInstruction = instruction.trim();
  if (!cleanInstruction) throw new Error("The instruction is empty.");
  return [
    { role: "system", content: REWRITE_SYSTEM },
    { role: "user", content: `Instruction: ${cleanInstruction}\n\nText:\n"""\n${text}\n"""` },
  ];
}

export type ContinueLengthId = "short" | "medium" | "long";

export interface ContinueLength {
  id: ContinueLengthId;
  label: string;
  words: number;
  /** Output token limit: roughly 1.5 tokens per word, plus room to finish the sentence. */
  maxTokens: number;
}

export const CONTINUE_LENGTHS: ContinueLength[] = [
  { id: "short", label: "Short (~25 words)", words: 25, maxTokens: 64 },
  { id: "medium", label: "Medium (~50 words)", words: 50, maxTokens: 120 },
  { id: "long", label: "Long (~100 words)", words: 100, maxTokens: 220 },
];

export const DEFAULT_CONTINUE_LENGTH: ContinueLengthId = "medium";

export function getContinueLength(id: string | null | undefined): ContinueLength {
  return CONTINUE_LENGTHS.find((l) => l.id === id) ?? CONTINUE_LENGTHS[1];
}

export function buildContinueMessages(context: string, words: number = 50): ChatMessage[] {
  const tail = context.slice(-CONTINUE_CONTEXT_CHARS);
  return [
    { role: "system", content: `${CONTINUE_SYSTEM}\nWrite about ${words} words.` },
    { role: "user", content: `Continue this text:\n"""\n${tail}\n"""` },
  ];
}
