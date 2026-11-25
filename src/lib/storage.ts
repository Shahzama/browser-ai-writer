// Browser storage can be full, disabled or blocked (private mode, iframes),
// so every call is wrapped and failures are ignored on purpose.

const DOC_KEY = "browser-ai-writer:doc:v1";
const MODEL_KEY = "browser-ai-writer:model:v1";

export function loadDoc(): unknown | null {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDoc(doc: unknown): void {
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(doc));
  } catch {
    /* storage unavailable */
  }
}

export function loadModelId(): string | null {
  try {
    return localStorage.getItem(MODEL_KEY);
  } catch {
    return null;
  }
}

export function saveModelId(id: string): void {
  try {
    localStorage.setItem(MODEL_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

const LENGTH_KEY = "browser-ai-writer:continue-length:v1";

export function loadContinueLength(): string | null {
  try {
    return localStorage.getItem(LENGTH_KEY);
  } catch {
    return null;
  }
}

export function saveContinueLength(id: string): void {
  try {
    localStorage.setItem(LENGTH_KEY, id);
  } catch {
    /* storage unavailable */
  }
}
