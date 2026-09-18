import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contactEnd,
  DEFAULT_VARIABLE_FORCE,
  durationOf,
  impulseFt,
  pulleyComponents,
  rocketHeight,
  rocketLandTime,
  rocketVelocity,
  sampleAt,
  workFromA,
} from "./variable-force.ts";

const close = (a: number, b: number, eps = 1e-8) => Math.abs(a - b) < eps;

test("Hooke F = −kx keeps E = ½kA² and returns after a period", () => {
  const params = { ...DEFAULT_VARIABLE_FORCE, m: 0.5, c: 50, n: 1, A: 0.2 };
  const T = durationOf(params, "fx");
  const start = sampleAt(params, 0, "fx");
  const later = sampleAt(params, T, "fx");
  assert.ok(close(start.E, 0.5 * 50 * 0.04));
  assert.ok(close(start.E, later.E, 1e-6));
  assert.ok(close(start.x, later.x, 1e-6));
  const mid = sampleAt(params, T / 4, "fx");
  assert.ok(close(mid.x, 0, 1e-6));
  assert.ok(close(mid.W, start.U, 1e-6));
});

test("quadratic F(x) work is ∫ c x² dx = c A³ / 3", () => {
  const params = { ...DEFAULT_VARIABLE_FORCE, c: 12, n: 2, A: 0.5 };
  assert.ok(close(workFromA(params, 0), 12 * 0.125 / 3));
});

test("F(t) = 3200 t² − 500 t gives the 2018 impulse at contact end", () => {
  const params = { ...DEFAULT_VARIABLE_FORCE, alpha: 3200, beta: -500, m: 0.5, v0: 3 };
  const tEnd = contactEnd(params);
  assert.ok(close(tEnd, 500 / 3200));
  const J = impulseFt(params, tEnd);
  const expected = (3200 / 3) * tEnd ** 3 + (-500 / 2) * tEnd ** 2;
  assert.ok(close(J, expected));
  const after = sampleAt(params, tEnd + 0.2, "ft");
  assert.ok(close(after.F, 0));
  assert.ok(close(after.v, 3 + J / 0.5));
  assert.ok(close(after.J, J));
});

test("rocket a = K − L t² matches v = Kt − L t³/3 at burnout", () => {
  const params = { ...DEFAULT_VARIABLE_FORCE, K: 9, Lcoeff: 0.25, tBurn: 6, g: 10, m: 0.5 };
  assert.ok(close(rocketVelocity(params, 6), 9 * 6 - 0.25 * 216 / 3));
  assert.ok(close(rocketHeight(params, 6), 9 * 18 - 0.25 * 1296 / 12));
  const burn = sampleAt(params, 6, "rocket");
  assert.ok(close(burn.v, 36));
  assert.ok(close(burn.J, 0.5 * 36));
  const land = rocketLandTime(params);
  const down = sampleAt(params, land, "rocket");
  assert.ok(down.y < 0.02);
});

test("variable-angle tension does positive work as x decreases", () => {
  const params = { ...DEFAULT_VARIABLE_FORCE, T: 8, H: 0.4, x0: 1.2, muK: 0, m: 0.5 };
  const start = sampleAt(params, 0, "pulley");
  const later = sampleAt(params, 0.4, "pulley");
  assert.ok(later.x < start.x);
  assert.ok(later.W > 0);
  const { N } = pulleyComponents(params, start.x);
  assert.ok(N > 0);
  assert.ok(start.Fy > 0);
  assert.ok(start.Fx < 0);
});
