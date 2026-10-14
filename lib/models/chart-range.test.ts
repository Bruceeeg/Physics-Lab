import assert from "node:assert/strict";
import { test } from "node:test";

import { paddedValueRange, sliceTimeWindow } from "./chart-range.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("paddedValueRange follows positive data without forcing zero into view", () => {
  const range = paddedValueRange([8, 10]);
  assert.ok(close(range.min, 7.84));
  assert.ok(close(range.max, 10.16));
  assert.ok(range.min > 0);
});

test("paddedValueRange expands a nonzero constant around its value", () => {
  const range = paddedValueRange([4, 4, 4]);
  assert.ok(range.min < 4);
  assert.ok(range.max > 4);
  assert.ok(range.min > 0);
  assert.ok(close(4 - range.min, range.max - 4));
});

test("paddedValueRange gives an empty or zero series a useful symmetric range", () => {
  assert.deepEqual(paddedValueRange([]), { min: -1, max: 1 });
  assert.deepEqual(paddedValueRange([0, 0]), { min: -1, max: 1 });
});

test("sliceTimeWindow keeps the sample before the visible boundary for continuity", () => {
  const points = Array.from({ length: 21 }, (_, t) => ({ t, value: t * 2 }));
  const window = sliceTimeWindow(points, 20, 10);
  assert.equal(window.start, 10);
  assert.equal(window.end, 20);
  assert.equal(window.points[0].t, 9);
  assert.equal(window.points.at(-1)?.t, 20);
});

test("sliceTimeWindow starts at zero until the first window is full", () => {
  const points = Array.from({ length: 11 }, (_, t) => ({ t }));
  const window = sliceTimeWindow(points, 5, 10);
  assert.equal(window.start, 0);
  assert.equal(window.end, 10);
  assert.deepEqual(window.points.map((point) => point.t), points.map((point) => point.t));
});
