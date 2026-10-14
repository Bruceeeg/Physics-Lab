import assert from "node:assert/strict";
import { test } from "node:test";

import { previewLiveCap, selectLivePreviewIds } from "./preview-budget.ts";

test("preview live cap follows the viewport and shrinks on small devices", () => {
  assert.equal(previewLiveCap({ deviceMemory: 4, hardwareConcurrency: 8, viewportWidth: 1920, viewportHeight: 1080 }), 4);
  assert.equal(previewLiveCap({ deviceMemory: 2 }), 4);
  assert.equal(previewLiveCap({ hardwareConcurrency: 4, viewportWidth: 1920, viewportHeight: 1400 }), 6);
  assert.equal(previewLiveCap({}), 8);
  assert.equal(previewLiveCap({ deviceMemory: 8, hardwareConcurrency: 8, viewportWidth: 390, viewportHeight: 800 }), 3);
  assert.equal(previewLiveCap({ deviceMemory: 8, hardwareConcurrency: 8, viewportWidth: 1280, viewportHeight: 800 }), 12);
  assert.equal(previewLiveCap({ deviceMemory: 8, hardwareConcurrency: 8, viewportWidth: 1920, viewportHeight: 2160 }), 16);
});

test("selects the highest tier, then the most visible previews, within the cap", () => {
  const ids = selectLivePreviewIds(
    [
      { id: 1, ratio: 1, tier: 1 },
      { id: 2, ratio: 0.4, tier: 2 },
      { id: 3, ratio: 0.9, tier: 1 },
      { id: 4, ratio: 0.2, tier: 1 },
    ],
    2,
  );
  assert.deepEqual(ids, [2, 1]);
});

test("keeps an incumbent until a newcomer is clearly more visible", () => {
  const previous = new Set([1]);
  assert.deepEqual(
    selectLivePreviewIds(
      [
        { id: 1, ratio: 0.6, tier: 1 },
        { id: 2, ratio: 0.75, tier: 1 },
      ],
      1,
      previous,
    ),
    [1],
  );
  assert.deepEqual(
    selectLivePreviewIds(
      [
        { id: 1, ratio: 0.5, tier: 1 },
        { id: 2, ratio: 0.85, tier: 1 },
      ],
      1,
      previous,
    ),
    [2],
  );
});

test("drops previews that have left the viewport", () => {
  const ids = selectLivePreviewIds(
    [
      { id: 1, ratio: 0, tier: 1 },
      { id: 2, ratio: 0.16, tier: 1 },
      { id: 3, ratio: 0.1, tier: 1 },
      { id: 4, ratio: 0.5, tier: 1 },
    ],
    4,
    new Set([1, 2, 3]),
  );
  assert.deepEqual(ids, [4, 2]);
});

test("returns nothing when the cap is empty", () => {
  assert.deepEqual(selectLivePreviewIds([{ id: 1, ratio: 1, tier: 2 }], 0), []);
});
