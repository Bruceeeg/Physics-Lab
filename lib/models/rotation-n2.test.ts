import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_ROTATION_N2,
  linearAccel,
  sampleAt,
  theoryI,
  timeToFloor,
} from "./rotation-n2.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("disk I is ½MR² and a = mgr² / (I + mr²)", () => {
  const params = { ...DEFAULT_ROTATION_N2, shape: "disk" as const, M: 2, R: 0.2, m: 0.5, r: 0.05, g: 10 };
  assert.ok(close(theoryI(params), 0.5 * 2 * 0.04));
  const I = theoryI(params);
  const a = (0.5 * 10 * 0.0025) / (I + 0.5 * 0.0025);
  assert.ok(close(linearAccel(params), a));
});

test("measured I from τ/α matches ∫ r² dm", () => {
  const params = DEFAULT_ROTATION_N2;
  const mid = sampleAt(params, timeToFloor(params) * 0.4);
  assert.ok(close(mid.Iexp, mid.I, 1e-8));
  assert.ok(close(mid.tau, mid.I * mid.alpha, 1e-8));
});

test("a hoop has larger I and smaller α than a disk of the same mass and radius", () => {
  const disk = { ...DEFAULT_ROTATION_N2, shape: "disk" as const };
  const hoop = { ...DEFAULT_ROTATION_N2, shape: "hoop" as const };
  assert.ok(theoryI(hoop) > theoryI(disk));
  assert.ok(linearAccel(hoop) < linearAccel(disk));
});
