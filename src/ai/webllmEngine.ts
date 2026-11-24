import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";
import type { ChatMessage, LoadProgress, LoadedEngine, StreamOptions } from "./types";

/**
 * This module is loaded with a dynamic import, so the WebLLM runtime is only
 * downloaded after the user picks a model. The first page load stays small.
 */
export async function createWebLLMEngine(
  modelId: string,
  onProgress: (progress: LoadProgress) => void,
): Promise<LoadedEngine> {
  const known = prebuiltAppConfig.model_list.some((model) => model.model_id === modelId);
  if (!known) {
    throw new Error(`Model "${modelId}" is not available in this version of WebLLM.`);
  }

  const worker = new Worker(new URL("./llm.worker.ts", import.meta.url), { type: "module" });

  try {
    const engine = await CreateWebWorkerMLCEngine(worker, modelId, {
      initProgressCallback: (report) => onProgress({ progress: report.progress, text: report.text }),
    });

    return {
      modelId,
      async *stream(messages: ChatMessage[], options: StreamOptions = {}) {
        const chunks = await engine.chat.completions.create({
          messages,
          stream: true,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens ?? 512,
        });
        for await (const chunk of chunks) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) yield delta;
        }
      },
      interrupt() {
        engine.interruptGenerate();
      },
      async unload() {
        try {
          await engine.unload();
        } finally {
          worker.terminate();
        }
      },
    };
  } catch (error) {
    worker.terminate();
    throw error;
  }
}
