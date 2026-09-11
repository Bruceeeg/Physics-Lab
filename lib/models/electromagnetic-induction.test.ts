import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_INDUCTION,
  sampleAt,
} from "./electromagnetic-induction.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("sliding-bar emf is Bℓv and Lenz force opposes the motion", () => {
  const params = { ...DEFAULT_INDUCTION, B: 0.4, ell: 0.2, v: 2, R: 0.5 };
  const sample = sampleAt(params, 0.3, "rail");
  assert.ok(close(sample.emf, 0.16));
  assert.ok(close(sample.I, 0.32));
  assert.ok(close(sample.F, -sample.I * params.ell * params.B, 1e-12));
  assert.ok(sample.F < 0);
});

test("coil flux peaks when the magnet is centered and emf changes sign", () => {
  const params = DEFAULT_INDUCTION;
  const before = sampleAt(params, 0.05, "coil");
  const center = sampleAt(params, params.z0 / params.v, "coil");
  const after = sampleAt(params, params.z0 / params.v + 0.05, "coil");
  assert.ok(Math.abs(center.z) < 1e-8);
  assert.ok(center.flux > before.flux);
  assert.ok(center.flux > after.flux);
  assert.ok(before.emf * after.emf < 0);
});
