import assert from "node:assert/strict";
import { test } from "node:test";

import { EPS_0 } from "./electric-field.ts";
import { CAP_DURATION, DEFAULT_CAP, capacitance, sampleAt } from "./capacitance.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("parallel-plate C is κε0 A / d", () => {
  const A = 0.02;
  const d = 0.002;
  assert.ok(close(capacitance(A, d, 1), (EPS_0 * A) / d));
  assert.ok(close(capacitance(A, d, 4), (4 * EPS_0 * A) / d));
});

test("closing the gap raises C and stored energy at fixed V", () => {
  const start = sampleAt(DEFAULT_CAP, 0, "gap");
  const end = sampleAt(DEFAULT_CAP, CAP_DURATION, "gap");
  assert.ok(end.C > start.C);
  assert.ok(end.U > start.U);
  assert.ok(close(end.U, 0.5 * end.C * DEFAULT_CAP.V * DEFAULT_CAP.V, 1e-12));
});

test("inserting a dielectric multiplies C by κ", () => {
  const vacuum = sampleAt(DEFAULT_CAP, 0, "dielectric");
  const filled = sampleAt(DEFAULT_CAP, CAP_DURATION, "dielectric");
  assert.ok(close(vacuum.kappa, 1, 1e-12));
  assert.ok(close(filled.kappa, DEFAULT_CAP.kappa, 1e-12));
  assert.ok(close(filled.C / vacuum.C, DEFAULT_CAP.kappa, 1e-8));
});
