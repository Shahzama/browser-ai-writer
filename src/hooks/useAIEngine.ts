import { useCallback, useEffect, useRef, useState } from "react";
import { resolveModelId } from "../ai/models";
import type { AIEngine, LoadedEngine } from "../ai/types";
import { checkWebGPU } from "../ai/webgpu";
import { saveModelId } from "../lib/storage";

export type EngineStatus = "checking" | "unsupported" | "idle" | "loading" | "ready" | "error";

export interface EngineState {
  status: EngineStatus;
  progress: number;
  progressText: string;
  modelId: string | null;
  error: string | null;
}

function friendlyLoadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/quota|storage/i.test(message)) {
    return "Not enough browser storage to save the model. Free up disk space or try a smaller model.";
  }
  if (/fetch|network/i.test(message)) {
    return "The model download failed. Check your internet connection and try again.";
  }
  if (/device|adapter|gpu|memory/i.test(message)) {
    return "Your GPU ran out of memory or stopped responding. Try a smaller model.";
  }
  return `Could not load the model: ${message}`;
}

export function useAIEngine() {
  const [state, setState] = useState<EngineState>({
    status: "checking",
    progress: 0,
    progressText: "",
    modelId: null,
    error: null,
  });
  const [engine, setEngine] = useState<AIEngine | null>(null);
  const engineRef = useRef<LoadedEngine | null>(null);
  const supportsF16Ref = useRef(true);
  const loadIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    checkWebGPU().then((check) => {
      if (cancelled) return;
      supportsF16Ref.current = check.supportsF16;
      setState((s) => ({
        ...s,
        status: check.supported ? "idle" : "unsupported",
        error: check.reason,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async (baseModelId: string) => {
    const loadId = ++loadIdRef.current;
    const modelId = resolveModelId(baseModelId, supportsF16Ref.current);

    setEngine(null);
    setState((s) => ({ ...s, status: "loading", progress: 0, progressText: "Starting…", error: null, modelId: baseModelId }));

    const previous = engineRef.current;
    engineRef.current = null;
    if (previous) await previous.unload().catch(() => undefined);

    try {
      // Dynamic import: the WebLLM runtime is only fetched when a model is requested.
      const { createWebLLMEngine } = await import("../ai/webllmEngine");
      const loaded = await createWebLLMEngine(modelId, ({ progress, text }) => {
        if (loadId !== loadIdRef.current) return;
        setState((s) => ({ ...s, progress, progressText: text }));
      });

      if (loadId !== loadIdRef.current) {
        // A newer load started while this one was running. Throw this one away.
        await loaded.unload().catch(() => undefined);
        return;
      }

      engineRef.current = loaded;
      setEngine(loaded);
      setState((s) => ({ ...s, status: "ready", progress: 1, progressText: "Ready" }));
      saveModelId(baseModelId);
    } catch (error) {
      if (loadId !== loadIdRef.current) return;
      setState((s) => ({ ...s, status: "error", error: friendlyLoadError(error) }));
    }
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.unload().catch(() => undefined);
    };
  }, []);

  return { ...state, engine, load };
}
