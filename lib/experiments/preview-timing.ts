export const PREVIEW_PLAY = 5;
export const PREVIEW_HOLD = 1;
export const PREVIEW_CYCLE = PREVIEW_PLAY + PREVIEW_HOLD;
export const FEATURED_GAP_MS = 500;
export const FEATURED_CLIP_MS = PREVIEW_PLAY * 1000 + FEATURED_GAP_MS;
export const PREVIEW_DPR = 1;

export function catalogPreviewDpr(_scrolling?: boolean) {
  return PREVIEW_DPR;
}
