import assert from "node:assert/strict";
import { test } from "node:test";

import {
  centerOfMass,
  DEFAULT_NONUNIFORM_ROD,
  endInertia,
  period,
  sampleAt,
} from "./nonuniform-rod.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("λ = 2M x / L² has I_end = ML²/2 and x_cm = 2L/3", () => {
  const params = { ...DEFAULT_NONUNIFORM_ROD, M: 2, L: 1 };
  assert.ok(close(endInertia(params, "linear"), 1));
  assert.ok(close(centerOfMass(params, "linear"), 2 / 3));
});

test("λ = 3M x² / L³ has I_end = 3ML²/5 and x_cm = 3L/4", () => {
  const params = { ...DEFAULT_NONUNIFORM_ROD, M: 2, L: 1 };
  assert.ok(close(endInertia(params, "quadratic"), 1.2));
  assert.ok(close(centerOfMass(params, "quadratic"), 0.75));
});

test("three turbine blades use I = N(I_cm + Md²) = N ML²/6", () => {
  const params = { ...DEFAULT_NONUNIFORM_ROD, M: 1, L: 1, bladeCount: 3 };
  assert.ok(close(endInertia(params, "turbine"), 0.5));
  assert.ok(close(centerOfMass(params, "turbine"), 1 / 3));
});

test("physical-pendulum period is 2π √(I / M g d) and energy repeats", () => {
  const params = { ...DEFAULT_NONUNIFORM_ROD, M: 1.2, L: 0.8, g: 10, theta0Deg: 12 };
  const I = endInertia(params, "linear");
  const d = centerOfMass(params, "linear");
  const T = period(params, "linear");
  assert.ok(close(T, 2 * Math.PI * Math.sqrt(I / (params.M * params.g * d))));
  const start = sampleAt(params, 0, "linear");
  const later = sampleAt(params, T, "linear");
  assert.ok(close(start.theta, later.theta, 1e-8));
  assert.ok(close(start.E, later.E, 1e-8));
});
