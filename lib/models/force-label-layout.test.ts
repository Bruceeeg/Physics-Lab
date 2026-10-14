import assert from "node:assert/strict";
import { test } from "node:test";

import { placeForceLabel } from "./force-label-layout.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("placeForceLabel normalizes the force direction and applies a world-space offset", () => {
  const placement = placeForceLabel([0, -10, 0], 0.5, [0.3, 0, 0]);
  assert.ok(placement);
  assert.deepEqual(placement.tip, [0, -0.5, 0]);
  assert.ok(close(placement.label[0], 0.3));
  assert.ok(close(placement.label[1], -0.64));
  assert.ok(close(placement.label[2], 0));
});

test("placeForceLabel returns null for a zero-length vector", () => {
  assert.equal(placeForceLabel([0, 0, 0], 0.5, [0.2, 0, 0]), null);
});

test("placeForceLabel leaves a clear leader segment between arrow tip and label", () => {
  const placement = placeForceLabel([3, 4, 0], 1, [0, 0.25, 0]);
  assert.ok(placement);
  assert.ok(Math.hypot(
    placement.label[0] - placement.tip[0],
    placement.label[1] - placement.tip[1],
    placement.label[2] - placement.tip[2],
  ) >= 0.14);
});
