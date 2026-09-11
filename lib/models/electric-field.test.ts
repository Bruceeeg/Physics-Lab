import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COULOMB_K,
  DEFAULT_ELECTRIC,
  EPS_0,
  pithSeparation,
  sampleAt,
} from "./electric-field.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("point-charge field and potential follow kQ/r² and kQ/r", () => {
  const params = { ...DEFAULT_ELECTRIC, Q_uC: 2, r0_cm: 20, r1_cm: 20 };
  const r = 0.2;
  const Q = 2e-6;
  const start = sampleAt(params, 0, "point");
  assert.ok(close(start.E, (COULOMB_K * Math.abs(Q)) / (r * r), 1e-6));
  assert.ok(close(start.V, (COULOMB_K * Q) / r, 1e-6));
  assert.ok(close(start.F, start.q * start.E, 1e-12));
});

test("dipole field on the + axis points from +Q toward -Q", () => {
  const params = { ...DEFAULT_ELECTRIC, Q_uC: 2, d_cm: 8, r0_cm: 20, r1_cm: 20 };
  const sample = sampleAt(params, 0, "dipole");
  assert.ok(sample.E > 0);
  assert.ok(sample.Ex < 0);
  const x = 0.2;
  const d = 0.08;
  const Q = 2e-6;
  const plus = (COULOMB_K * Q) / (x + d / 2) ** 2;
  const minus = (COULOMB_K * Q) / (x - d / 2) ** 2;
  assert.ok(close(sample.Ex, plus - minus, 1e-4));
});

test("Gauss conducting sphere has zero field inside and kQ/r² outside", () => {
  const params = { ...DEFAULT_ELECTRIC, Q_uC: 2, R_cm: 10, r0_cm: 5, r1_cm: 5 };
  const inside = sampleAt(params, 0, "gauss");
  assert.ok(close(inside.E, 0, 1e-9));
  assert.ok(close(inside.Qenc, 0));
  const outside = sampleAt({ ...params, r0_cm: 20, r1_cm: 20 }, 0, "gauss");
  const r = 0.2;
  const Q = 2e-6;
  assert.ok(close(outside.E, (COULOMB_K * Q) / (r * r), 1e-6));
  assert.ok(close(outside.flux, Q / EPS_0, 1e-6));
});

test("hanging pith balls satisfy tanθ = F / mg", () => {
  const params = { ...DEFAULT_ELECTRIC, Q_uC: 0.08, pithM: 0.004, pithL_cm: 50, g: 9.81 };
  const r = pithSeparation(params);
  const sample = sampleAt(params, 0, "pith");
  const L = 0.5;
  const theta = Math.asin(r / (2 * L));
  const F = (COULOMB_K * (0.08e-6) ** 2) / (r * r);
  assert.ok(close(sample.r, r, 1e-6));
  assert.ok(close(Math.tan(theta), F / (0.004 * 9.81), 1e-3));
});
