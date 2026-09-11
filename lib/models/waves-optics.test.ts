import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_WAVES,
  sampleAt,
  standingWave,
} from "./waves-optics.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("standing-wave harmonics satisfy λ = 2L/n and v = fλ", () => {
  const params = { ...DEFAULT_WAVES, L: 0.8, n: 2, tension: 40, mu: 0.01, A: 0.03 };
  const sample = sampleAt(params, 0, "standing");
  const v = Math.sqrt(40 / 0.01);
  assert.ok(close(sample.v, v));
  assert.ok(close(sample.lambda, 0.8));
  assert.ok(close(sample.f, v / 0.8));
  const yMid = standingWave(params, 0.4, 0);
  assert.ok(Math.abs(yMid) < 1e-12);
});

test("double-slit bright fringe spacing is λL/d", () => {
  const params = {
    ...DEFAULT_WAVES,
    lambda_nm: 600,
    d_mm: 0.25,
    screen_m: 1.2,
  };
  const sample = sampleAt(params, 0, "doubleslit");
  const lambda = 600e-9;
  const d = 0.25e-3;
  assert.ok(close(sample.deltaY, (lambda * 1.2) / d, 1e-12));
  assert.ok(close(sample.I, sample.I0));
});
