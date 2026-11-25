/**
 * WebLLM reports progress as long sentences like
 * "Fetching param cache[3/22]: 48MB fetched. 7% completed, 1 secs elapsed. It can take a while..."
 * This turns them into a short label that fits in the progress bar.
 */
export function formatProgress(progress: number, text: string): string {
  const percent = `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`;
  const mb = text.match(/(\d+(?:\.\d+)?)\s*MB/i);

  if (/loading model from cache/i.test(text)) {
    return `Loading from browser cache · ${percent}`;
  }
  if (/fetch/i.test(text)) {
    return mb ? `Downloading model · ${mb[1]} MB · ${percent}` : `Downloading model · ${percent}`;
  }
  if (/shader|gpu|compil/i.test(text)) {
    return "Preparing your GPU…";
  }
  if (progress >= 1) return "Almost ready…";
  return text ? `Starting · ${percent}` : "Starting…";
}
