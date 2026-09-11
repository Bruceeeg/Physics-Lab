import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BOYLE_DURATION,
  DEFAULT_BOYLE,
  gasPressure,
  sampleAt,
  volumeSi,
} from "./boyles-law.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("isothermal PV stays at nRT while the piston moves", () => {
  const params = DEFAULT_BOYLE;
  const nRT = params.n * 8.314 * params.T;
  const start = sampleAt(params, 0, "isothermal");
  const mid = sampleAt(params, BOYLE_DURATION / 2, "isothermal");
  const end = sampleAt(params, BOYLE_DURATION, "isothermal");
  assert.ok(close(start.PV, nRT, 1e-8));
  assert.ok(close(mid.PV, nRT, 1e-8));
  assert.ok(close(end.PV, nRT, 1e-8));
  assert.ok(close(end.V, volumeSi(params.Vf_cm3)));
  assert.ok(end.P > start.P);
});

test("compression work on the gas is nRT ln(V0/Vf)", () => {
  const params = { ...DEFAULT_BOYLE, V0_cm3: 100, Vf_cm3: 50 };
  const expected = params.n * 8.314 * params.T * Math.log(2);
  const end = sampleAt(params, BOYLE_DURATION, "work");
  assert.ok(close(end.W, expected, 1e-8));
  assert.ok(close(end.P, gasPressure(params, volumeSi(params.Vf_cm3))));
});
