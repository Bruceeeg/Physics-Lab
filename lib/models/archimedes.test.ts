import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_ARCHIMEDES,
  LOWER_DURATION,
  mass,
  sampleAt,
  volume,
} from "./archimedes.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("fully submerged buoyancy is ρVg and infers the fluid density", () => {
  const params = DEFAULT_ARCHIMEDES;
  const end = sampleAt(params, LOWER_DURATION);
  assert.equal(end.fullyIn, true);
  assert.ok(close(end.Fb, params.rhoFluid * volume(params) * params.g, 1e-8));
  assert.ok(close(end.T, mass(params) * params.g - end.Fb, 1e-8));
  assert.ok(close(end.rhoMeas, params.rhoFluid, 1e-6));
});

test("scale reads the true weight before the cube touches the water", () => {
  const params = DEFAULT_ARCHIMEDES;
  const start = sampleAt(params, 0);
  assert.ok(start.s < 0);
  assert.ok(close(start.Fb, 0));
  assert.ok(close(start.T, mass(params) * params.g));
});
