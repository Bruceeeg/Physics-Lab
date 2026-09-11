import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contactTime,
  DEFAULT_IMPULSE,
  impulseOn2,
  postVelocities,
  explosionVelocities,
  sampleAt,
  ballisticMaxAngle,
  ballisticVelocityAfter,
  hitTime,
} from "./impulse-momentum.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("equal-mass elastic collision exchanges velocities", () => {
  const params = { ...DEFAULT_IMPULSE, m1: 1, m2: 1, v1: 2, v2: 0, e: 1 };
  const { v1f, v2f } = postVelocities(params);
  assert.ok(close(v1f, 0));
  assert.ok(close(v2f, 2));
  assert.ok(close(impulseOn2(params), 2));
});

test("momentum is conserved before, during, and after contact", () => {
  const params = { m1: 1.5, v1: 2.4, m2: 0.8, v2: -0.3, e: 0.6 };
  const p0 = params.m1 * params.v1 + params.m2 * params.v2;
  const tc = contactTime(params);
  for (const t of [0, tc * 0.5, tc, tc + 0.04, tc + 0.2]) {
    const sample = sampleAt(params, t);
    assert.ok(close(sample.pTotal, p0, 1e-8), `t=${t} p=${sample.pTotal}`);
  }
});

test("an explosion from rest keeps zero total momentum", () => {
  const params = { ...DEFAULT_IMPULSE, m1: 1, m2: 2, U: 1.2 };
  const { v1f, v2f } = explosionVelocities(params);
  assert.ok(close(params.m1 * v1f + params.m2 * v2f, 0, 1e-8));
  assert.ok(close(0.5 * params.m1 * v1f * v1f + 0.5 * params.m2 * v2f * v2f, 1.2, 1e-8));
  const after = sampleAt(params, 0.2, "explosion");
  assert.ok(close(after.pTotal, 0, 1e-8));
});

test("impulse on cart 2 equals its change in momentum", () => {
  const params = DEFAULT_IMPULSE;
  const after = sampleAt(params, contactTime(params) + 0.2);
  assert.ok(close(impulseOn2(params), after.p2 - params.m2 * params.v2));
});

test("ballistic pendulum conserves momentum then converts KE to height", () => {
  const params = { ...DEFAULT_IMPULSE, m1: 0.02, v1: 80, m2: 0.5, L: 0.8, g: 10 };
  const V = ballisticVelocityAfter(params);
  assert.ok(close(V, (0.02 * 80) / 0.52));
  const thMax = ballisticMaxAngle(params);
  const h = params.L * (1 - Math.cos(thMax));
  assert.ok(close(0.5 * V * V, 10 * h, 1e-8));
  const before = sampleAt(params, 0, "ballistic");
  assert.ok(before.x1 < 0);
  const after = sampleAt(params, hitTime(params) + 0.001, "ballistic");
  assert.ok(after.theta > 0);
});
