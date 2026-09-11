import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_RL, lcOmega, rlTau, sampleAt } from "./rl-circuits.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("RL current grows as (ε/R)(1 − e^{−t/τ}) with τ = L/R", () => {
  const params = { ...DEFAULT_RL, R: 10, L_mH: 50, emf: 6 };
  const tau = rlTau(params);
  assert.ok(close(tau, 0.005));
  const start = sampleAt(params, 0, "grow");
  const mid = sampleAt(params, tau, "grow");
  const Iinf = 0.6;
  assert.ok(close(start.I, 0, 1e-12));
  assert.ok(close(mid.I, Iinf * (1 - Math.exp(-1)), 1e-8));
});

test("RL decay is exponential and LC oscillates at 1/√(LC)", () => {
  const params = { ...DEFAULT_RL, R: 8, L_mH: 80, C_uF: 50, emf: 10 };
  const tau = rlTau(params);
  const start = sampleAt(params, 0, "decay");
  const later = sampleAt(params, tau, "decay");
  assert.ok(close(start.I, 10 / 8));
  assert.ok(close(later.I, start.I / Math.E, 1e-8));
  const w = lcOmega(params);
  assert.ok(close(w, 1 / Math.sqrt(0.08 * 50e-6)));
  const q0 = sampleAt(params, 0, "lc");
  const half = sampleAt(params, Math.PI / w, "lc");
  assert.ok(close(half.Q, -q0.Q, 1e-8));
});
