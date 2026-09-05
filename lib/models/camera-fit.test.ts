import assert from "node:assert/strict";
import { test } from "node:test";

import { fitViewDistance, isUsableCanvasSize } from "./camera-fit.ts";

test("rejects a zero-size or tiny canvas so the camera is not sent to infinity", () => {
  assert.equal(isUsableCanvasSize(0, 0), false);
  assert.equal(isUsableCanvasSize(320, 0), false);
  assert.equal(isUsableCanvasSize(0, 200), false);
  assert.equal(isUsableCanvasSize(4, 4), false);
  assert.equal(isUsableCanvasSize(Number.NaN, 240), false);
  assert.equal(isUsableCanvasSize(320, 240), true);
});

test("fit distance stays finite for a normal projectile stage", () => {
  const distance = fitViewDistance({
    extentX: 4,
    extentY: 1.5,
    width: 640,
    height: 400,
    fovDeg: 45,
  });
  assert.ok(Number.isFinite(distance));
  assert.ok(distance >= 2);
});

test("a collapsed canvas does not produce an infinite fit distance", () => {
  const distance = fitViewDistance({
    extentX: 4,
    extentY: 1.5,
    width: 0,
    height: 0,
    fovDeg: 45,
  });
  assert.equal(distance, null);
});
