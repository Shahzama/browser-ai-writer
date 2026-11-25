import { MODEL_OPTIONS } from "../ai/models";
import type { EngineState } from "../hooks/useAIEngine";
import { formatProgress } from "../lib/progress";

interface ModelPanelProps {
  engine: EngineState;
  selectedId: string;
  onSelect: (id: string) => void;
  onLoad: () => void;
}

const STATUS_LABEL: Record<EngineState["status"], string> = {
  checking: "Checking GPU…",
  unsupported: "Not supported",
  idle: "No model loaded",
  loading: "Loading…",
  ready: "Ready",
  error: "Error",
};

export function ModelPanel({ engine, selectedId, onSelect, onLoad }: ModelPanelProps) {
  const selected = MODEL_OPTIONS.find((m) => m.id === selectedId) ?? MODEL_OPTIONS[0];
  const busy = engine.status === "loading" || engine.status === "checking";
  const loadedThis = engine.status === "ready" && engine.modelId === selectedId;
  const disabled = busy || engine.status === "unsupported";

  return (
    <section className="model-panel" aria-label="Model settings">
      <div className="model-row">
        <label htmlFor="model-select">Model</label>
        <select
          id="model-select"
          value={selectedId}
          disabled={disabled}
          onChange={(event) => onSelect(event.target.value)}
        >
          {MODEL_OPTIONS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        <button type="button" className="primary" onClick={onLoad} disabled={disabled || loadedThis}>
          {loadedThis ? "Loaded" : engine.status === "ready" ? "Switch model" : "Load model"}
        </button>
        <span className={`status status-${engine.status}`}>
          <span className="dot" aria-hidden="true" />
          {STATUS_LABEL[engine.status]}
        </span>
      </div>

      <p className="muted small">{selected.note}</p>

      {engine.status === "loading" && (
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(engine.progress * 100)}>
          <div className="progress-bar" style={{ width: `${Math.round(engine.progress * 100)}%` }} />
          <span className="progress-text" title={engine.progressText}>
            {formatProgress(engine.progress, engine.progressText)}
          </span>
        </div>
      )}

      {engine.status === "error" && engine.error && (
        <p className="notice" role="alert">
          {engine.error}
        </p>
      )}
    </section>
  );
}
