/** True on phones and tablets, where the main input is a finger, not a mouse. */
export function isTouchDevice(): boolean {
  try {
    return typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

/**
 * Phones share a small amount of memory between the CPU and GPU, so they get
 * the smallest model by default. deviceMemory is only reported by Chromium
 * browsers, in GB, and is capped at 8.
 */
export function prefersSmallModel(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return isTouchDevice() || (typeof memory === "number" && memory <= 4);
}
