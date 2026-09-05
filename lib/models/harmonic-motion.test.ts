import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_HARMONIC, period, sampleAt } from "./harmonic-motion.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("small-angle period is 2π √(L/g) and independent of mass and amplitude", () => {
  const a = { ...DEFAULT_HARMONIC, L: 1, g: 9.81, m: 0.2, theta0Deg: 8 };
  const b = { ...a, m: 2, theta0Deg: 18 };
  assert.ok(close(period(a), 2 * Math.PI * Math.sqrt(1 / 9.81)));
  assert.ok(close(period(a), period(b)));
});

test("spring-block period is 2π √(m/k) and energy stays at ½kA²", () => {
  const params = { ...DEFAULT_HARMONIC, m: 0.4, k: 40, A: 0.12 };
  const T = period(params, "spring");
  assert.ok(close(T, 2 * Math.PI * Math.sqrt(params.m / params.k)));
  const E0 = 0.5 * params.k * params.A * params.A;
  const start = sampleAt(params, 0, "spring");
  const mid = sampleAt(params, T / 4, "spring");
  assert.ok(close(start.E, E0));
  assert.ok(close(mid.E, E0, 1e-8));
  assert.ok(close(mid.x, 0, 1e-8));
  assert.ok(mid.Us < 1e-8);
});

test("bob returns after one period and energy stays at the amplitude value", () => {
  const params = DEFAULT_HARMONIC;
  const T = period(params);
  const start = sampleAt(params, 0);
  const later = sampleAt(params, T);
  assert.ok(close(start.theta, later.theta, 1e-9));
  assert.ok(close(start.x, later.x, 1e-9));
  const mid = sampleAt(params, T / 4);
  assert.ok(Math.abs(mid.theta) < 1e-8);
  assert.ok(close(start.E, mid.E, 1e-8));
});
