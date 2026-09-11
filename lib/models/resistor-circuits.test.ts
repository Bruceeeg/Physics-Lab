import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_RESISTOR, sampleAt } from "./resistor-circuits.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("series current is the same and Kirchhoff loop sums to the emf", () => {
  const params = { ...DEFAULT_RESISTOR, emf: 12, R1: 10, R2: 20, R3: 30 };
  const sample = sampleAt(params, 1, "series");
  assert.ok(close(sample.I, 12 / 60));
  assert.ok(close(sample.I1, sample.I));
  assert.ok(close(sample.I2, sample.I));
  assert.ok(close(sample.V1 + sample.V2 + sample.V3, params.emf, 1e-10));
  assert.ok(close(sample.Req, 60));
});

test("parallel voltages match and junction currents add", () => {
  const params = { ...DEFAULT_RESISTOR, emf: 12, R1: 10, R2: 20, R3: 30 };
  const sample = sampleAt(params, 1, "parallel");
  assert.ok(close(sample.V1, 12));
  assert.ok(close(sample.V2, 12));
  assert.ok(close(sample.I1 + sample.I2 + sample.I3, sample.I, 1e-12));
  assert.ok(close(sample.Req, 1 / (1 / 10 + 1 / 20 + 1 / 30)));
});
