import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_THERMAL,
  heatCurrent,
  sampleAt,
  THERMAL_DURATION,
} from "./thermal-conductivity.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("steady heat current is kA ΔT / L", () => {
  const params = DEFAULT_THERMAL;
  const A = params.A_cm2 * 1e-4;
  const L = params.L_cm / 100;
  const expected = (params.k * A * (params.Th - params.Tc)) / L;
  assert.ok(close(heatCurrent(params, params.k), expected));
  const end = sampleAt(params, THERMAL_DURATION, "single");
  assert.ok(close(end.H, expected, 1e-8));
  assert.ok(close(end.Tmid, 0.5 * (params.Th + params.Tc), 1e-6));
});

test("compare mode keeps two materials on the same ΔT and area", () => {
  const params = { ...DEFAULT_THERMAL, k: 400, k2: 80 };
  const sample = sampleAt(params, THERMAL_DURATION, "compare");
  assert.ok(close(sample.H / sample.H2, 5, 1e-8));
  assert.ok(sample.H2 > 0);
});
