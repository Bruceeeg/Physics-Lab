import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_DRAG, durationOf, sampleAt, terminalSpeed } from "./drag-force.ts";

const close = (a: number, b: number, eps = 1e-8) => Math.abs(a - b) < eps;

test("linear drag approaches vt = mg/b and a → 0", () => {
  const params = { m: 0.2, g: 10, b: 0.5 };
  assert.ok(close(terminalSpeed(params, "linear"), 4));
  const late = sampleAt(params, 12, "linear");
  assert.ok(close(late.v, 4, 1e-4));
  assert.ok(Math.abs(late.a) < 1e-3);
  assert.ok(close(late.Fd, params.m * params.g, 1e-3));
});

test("linear drag from rest is v = vt (1 − e^{−bt/m})", () => {
  const params = DEFAULT_DRAG;
  const vt = terminalSpeed(params, "linear");
  const t = 0.4;
  const expected = vt * (1 - Math.exp((-params.b * t) / params.m));
  assert.ok(close(sampleAt(params, t, "linear").v, expected, 1e-8));
});

test("quadratic drag approaches vt = √(mg/b) as tanh", () => {
  const params = { m: 0.5, g: 10, b: 0.2 };
  const vt = terminalSpeed(params, "quadratic");
  assert.ok(close(vt, Math.sqrt(25)));
  const late = sampleAt(params, 8, "quadratic");
  assert.ok(close(late.v, vt, 1e-3));
  const early = sampleAt(params, 0.05, "quadratic");
  assert.ok(early.v < 0.6);
  assert.ok(early.a < 10 && early.a > 8);
  assert.ok(durationOf(params, "quadratic") > 1);
});
