import assert from "node:assert/strict";
import { test } from "node:test";

import {
  B_EARTH,
  DEFAULT_MAGNETISM,
  MU_0,
  sampleAt,
  solenoidTurnsPerMeter,
} from "./magnetism.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("long-wire field is μ0 I / (2πr)", () => {
  const params = { ...DEFAULT_MAGNETISM, I: 5, r0_cm: 4, r1_cm: 4 };
  const r = 0.04;
  const sample = sampleAt(params, 0, "wire");
  assert.ok(close(sample.B, (MU_0 * 5) / (2 * Math.PI * r), 1e-12));
});

test("compass deflection satisfies tanθ = B / B_earth on the magnet axis", () => {
  const params = { ...DEFAULT_MAGNETISM, m: 0.8, r0_cm: 12, r1_cm: 12 };
  const sample = sampleAt(params, 0, "magnet");
  const x = 0.12;
  const B = ((MU_0 / (4 * Math.PI)) * (2 * params.m)) / x ** 3;
  assert.ok(close(sample.B, B, 1e-12));
  assert.ok(close(Math.tan(sample.theta), sample.B / B_EARTH, 1e-8));
});

test("solenoid field is μ0 n I and independent of the probe radius", () => {
  const params = { ...DEFAULT_MAGNETISM, I: 2, n: 1000, r0_cm: 3, r1_cm: 12 };
  const a = sampleAt(params, 0, "solenoid");
  const b = sampleAt(params, 4, "solenoid");
  assert.ok(close(a.B, MU_0 * 1000 * 2, 1e-12));
  assert.ok(close(a.B, b.B, 1e-12));
  assert.ok(close(a.nI, solenoidTurnsPerMeter(params) * params.I));
});
