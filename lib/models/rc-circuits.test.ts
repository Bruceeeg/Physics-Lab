import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_RC, sampleAt, timeConstant } from "./rc-circuits.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("time constant is RC and charging starts as a short, ends as an open", () => {
  const params = { ...DEFAULT_RC, R: 2000, C_uF: 100, emf: 10 };
  const tau = timeConstant(params);
  assert.ok(close(tau, 0.2));
  const start = sampleAt(params, 0, "charge");
  const late = sampleAt(params, 5 * tau, "charge");
  assert.ok(close(start.Vc, 0, 1e-12));
  assert.ok(close(start.I, params.emf / params.R, 1e-12));
  assert.ok(close(late.Vc, params.emf, 1e-6));
  assert.ok(Math.abs(late.I) < 1e-6);
});

test("discharge is exponential with Vc(0)=emf and I = −Vc/R", () => {
  const params = { ...DEFAULT_RC, R: 1000, C_uF: 200, emf: 8 };
  const tau = timeConstant(params);
  const start = sampleAt(params, 0, "discharge");
  const mid = sampleAt(params, tau, "discharge");
  assert.ok(close(start.Vc, params.emf));
  assert.ok(close(start.I, -params.emf / params.R));
  assert.ok(close(mid.Vc, params.emf / Math.E, 1e-8));
});
