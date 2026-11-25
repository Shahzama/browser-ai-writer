export interface ModelOption {
  /** WebLLM model id for GPUs that support 16-bit shaders. */
  id: string;
  name: string;
  note: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 0.5B",
    note: "Smallest and fastest. Best choice for phones. Weaker at rewrites.",
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    note: "Balanced. A good default for most laptops.",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen 2.5 1.5B",
    note: "Better writing quality, slower first download.",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    note: "Best quality here. Needs a stronger GPU.",
  },
];

export const DEFAULT_MODEL_ID = MODEL_OPTIONS[1].id;
/** Phones get the smallest model, since a bigger one can run out of memory and crash the tab. */
export const SMALL_MODEL_ID = MODEL_OPTIONS[0].id;

/**
 * Some GPUs (often older integrated ones) do not support 16-bit float shaders.
 * WebLLM ships a 32-bit variant of each model for them, so we pick the right one.
 */
export function resolveModelId(baseId: string, supportsF16: boolean): string {
  return supportsF16 ? baseId : baseId.replace("q4f16_1", "q4f32_1");
}
