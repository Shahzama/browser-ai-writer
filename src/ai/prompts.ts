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
  "Write one to three sentences.",
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

export function buildContinueMessages(context: string): ChatMessage[] {
  const tail = context.slice(-CONTINUE_CONTEXT_CHARS);
  return [
    { role: "system", content: CONTINUE_SYSTEM },
    { role: "user", content: `Continue this text:\n"""\n${tail}\n"""` },
  ];
}
