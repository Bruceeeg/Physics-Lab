import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_PHOTON,
  ELEM_CHARGE,
  PLANCK_H,
  SPEED_OF_LIGHT,
  sampleAt,
  thresholdVoltage,
} from "./particle-model-of-light.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("LED threshold satisfies eV = hf = hc/λ", () => {
  const params = { ...DEFAULT_PHOTON, lambda_nm: 620, V: 4 };
  const f = SPEED_OF_LIGHT / 620e-9;
  const Vth = thresholdVoltage(params.lambda_nm);
  assert.ok(close(Vth, (PLANCK_H * f) / ELEM_CHARGE, 1e-12));
  const on = sampleAt(params, 5, "led");
  assert.equal(on.lit, true);
  assert.ok(on.I > 0);
  const off = sampleAt({ ...params, V: 1 }, 5, "led");
  assert.equal(off.lit, false);
  assert.ok(close(off.I, 0));
});

test("photoelectric Kmax = hf − φ and there is no current below threshold", () => {
  const params = { ...DEFAULT_PHOTON, lambda_nm: 400, phi_eV: 2.3, Vstop: 0 };
  const sample = sampleAt(params, 0, "photoelectric");
  const f = SPEED_OF_LIGHT / 400e-9;
  const K = PLANCK_H * f - 2.3 * ELEM_CHARGE;
  assert.ok(close(sample.Kmax, K, 1e-20));
  assert.ok(sample.emits);
  const red = sampleAt({ ...params, lambda_nm: 700 }, 0, "photoelectric");
  assert.equal(red.emits, false);
  assert.ok(close(red.Kmax, 0));
  assert.ok(close(red.I, 0));
});
