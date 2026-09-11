import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_OPTICS,
  imageDistance,
  sampleAt,
} from "./geometric-optics.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("convex lens obeys 1/f = 1/s + 1/s′ and inverts a real image", () => {
  const params = { ...DEFAULT_OPTICS, f_cm: 20, s_cm: 50, h_cm: 4 };
  const s = 0.5;
  const f = 0.2;
  const sp = sampleAt(params, 0, "convex").sp;
  assert.ok(close(sp, (s * f) / (s - f)));
  assert.ok(close(1 / f, 1 / s + 1 / sp, 1e-10));
  const sample = sampleAt(params, 0, "convex");
  assert.equal(sample.real, true);
  assert.ok(sample.m < 0);
  assert.ok(close(sample.hp, sample.m * 0.04, 1e-12));
});

test("concave lens always forms a virtual upright image", () => {
  const params = { ...DEFAULT_OPTICS, f_cm: 20, s_cm: 40, h_cm: 3 };
  const sample = sampleAt(params, 0, "concave");
  assert.ok(sample.sp < 0);
  assert.equal(sample.real, false);
  assert.ok(sample.m > 0 && sample.m < 1);
  assert.ok(close(imageDistance(-0.2, 0.4), sample.sp));
});
