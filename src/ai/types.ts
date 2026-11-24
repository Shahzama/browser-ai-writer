export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * The only thing the UI knows about the model.
 * Keeping it this small means the WebLLM engine can be swapped for a mock in
 * tests, or for a hosted API later, without touching any component.
 */
export interface AIEngine {
  stream(messages: ChatMessage[], options?: StreamOptions): AsyncIterable<string>;
  interrupt(): void;
}

export interface LoadedEngine extends AIEngine {
  modelId: string;
  unload(): Promise<void>;
}

export interface LoadProgress {
  progress: number; // 0 to 1
  text: string;
}

export interface TextRange {
  from: number;
  to: number;
}

export type SuggestionMode = "replace" | "insert";
