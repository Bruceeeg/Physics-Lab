import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_ANGMOM,
  fallTime,
  IAfter,
  IDisk,
  omegaAfter,
  rodHitTime,
  rodImpactSpeed,
  rodInertia,
  sampleAt,
  skaterI2,
  sphereSpeedAfterRod,
} from "./angular-momentum.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("sticking drop conserves Iω and slows the disk", () => {
  const params = DEFAULT_ANGMOM;
  const L0 = IDisk(params) * params.omega0;
  const after = sampleAt(params, fallTime(params) + 0.1);
  assert.equal(after.stuck, true);
  assert.ok(close(after.L, L0));
  assert.ok(close(after.omega, omegaAfter(params)));
  assert.ok(close(IAfter(params) * after.omega, L0));
  assert.ok(after.omega < params.omega0);
});

test("skater pull-in conserves L and raises ω", () => {
  const params = { ...DEFAULT_ANGMOM, IScale: 0.5 };
  const before = sampleAt(params, 0.1, "skater");
  const after = sampleAt(params, 0.8, "skater");
  assert.ok(close(before.L, after.L));
  assert.ok(after.omega > before.omega);
  assert.ok(close(after.I, skaterI2(params)));
});

test("rod hitting a sphere stops and gives the sphere J = Iω / L", () => {
  const params = { ...DEFAULT_ANGMOM, M: 2, R: 0.6, m: 0.5, g: 10 };
  assert.ok(close(rodImpactSpeed(params), Math.sqrt(50)));
  const v = sphereSpeedAfterRod(params);
  const expected = (rodInertia(params) * rodImpactSpeed(params)) / (params.m * params.R);
  assert.ok(close(v, expected));
  const before = sampleAt(params, 0.05, "rod");
  assert.equal(before.stuck, false);
  assert.ok(before.theta > 1);
  const after = sampleAt(params, rodHitTime(params) + 0.1, "rod");
  assert.equal(after.stuck, true);
  assert.ok(after.x < params.R);
});

test("mass falls from rest through height h before it sticks", () => {
  const params = { ...DEFAULT_ANGMOM, h: 0.45, g: 10 };
  assert.ok(close(fallTime(params), Math.sqrt(0.09)));
  const mid = sampleAt(params, fallTime(params) / 2);
  assert.equal(mid.stuck, false);
  assert.ok(mid.y > 0);
  assert.ok(close(mid.omega, params.omega0));
});
