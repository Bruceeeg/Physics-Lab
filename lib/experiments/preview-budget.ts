export const PREVIEW_MIN_RATIO = 0.25;
export const PREVIEW_KEEP_RATIO = 0.15;
export const PREVIEW_STICKY_BONUS = 0.2;

export type PreviewCandidate = {
  id: number;
  ratio: number;
  tier: number;
};

export function previewLiveCap(input: {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  viewportWidth?: number;
  viewportHeight?: number;
}) {
  if (input.deviceMemory != null && input.deviceMemory <= 4) {
    return 4;
  }
  if (input.hardwareConcurrency != null && input.hardwareConcurrency <= 4) {
    return 6;
  }
  const width = input.viewportWidth ?? 0;
  const height = input.viewportHeight ?? 0;
  if (width <= 0 || height <= 0) {
    return 8;
  }
  const columns = width >= 1024 ? 4 : width >= 640 ? 2 : 1;
  const rows = Math.max(1, Math.ceil((height * 0.75) / 220));
  return Math.min(16, columns * rows);
}

export function selectLivePreviewIds(
  entries: readonly PreviewCandidate[],
  cap: number,
  previous: ReadonlySet<number> = new Set(),
) {
  if (cap <= 0) {
    return [];
  }
  const ranked = entries.filter((entry) => {
    if (entry.ratio >= PREVIEW_MIN_RATIO) {
      return true;
    }
    return previous.has(entry.id) && entry.ratio >= PREVIEW_KEEP_RATIO;
  });
  ranked.sort((a, b) => {
    if (a.tier !== b.tier) {
      return b.tier - a.tier;
    }
    const scoreA = a.ratio + (previous.has(a.id) ? PREVIEW_STICKY_BONUS : 0);
    const scoreB = b.ratio + (previous.has(b.id) ? PREVIEW_STICKY_BONUS : 0);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return a.id - b.id;
  });
  return ranked.slice(0, cap).map((entry) => entry.id);
}
