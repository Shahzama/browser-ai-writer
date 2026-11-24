export type DiffType = "equal" | "added" | "removed";

export interface DiffPart {
  type: DiffType;
  value: string;
}

// Above this many token pairs the LCS table gets too big for a quick UI diff,
// so we fall back to showing "old text removed, new text added".
const MAX_CELLS = 4_000_000;

/** Split text into words and the whitespace between them, keeping both. */
export function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

function push(parts: DiffPart[], type: DiffType, value: string) {
  if (!value) return;
  const last = parts[parts.length - 1];
  if (last && last.type === type) {
    last.value += value;
  } else {
    parts.push({ type, value });
  }
}

/** Word-level diff based on the longest common subsequence. */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  const parts: DiffPart[] = [];

  if (n * m > MAX_CELLS) {
    push(parts, "removed", before);
    push(parts, "added", after);
    return parts;
  }

  // lcs[i][j] = length of the LCS of a[i..] and b[j..]
  const lcs: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(parts, "equal", a[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push(parts, "removed", a[i]);
      i++;
    } else {
      push(parts, "added", b[j]);
      j++;
    }
  }
  while (i < n) push(parts, "removed", a[i++]);
  while (j < m) push(parts, "added", b[j++]);

  return parts;
}
