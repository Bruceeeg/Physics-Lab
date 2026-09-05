import assert from "node:assert/strict";
import { test } from "node:test";

import {
  acceleration,
  DEFAULT_ATWOOD,
  sampleAt,
  tension,
  timeToStop,
} from "./atwood-machine.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("Atwood acceleration is g Δm / (m1 + m2)", () => {
  const params = { m1: 1, m2: 3, g: 10, travel: 0.5 };
  assert.ok(close(acceleration(params), 5));
  assert.ok(close(tension(params), 15));
});

test("equal masses stay put, heavier mass 2 goes down", () => {
  const equal = sampleAt({ m1: 2, m2: 2, g: 9.81, travel: 0.4 }, 1);
  assert.ok(close(equal.s, 0));
  assert.ok(close(equal.a, 0));
  const moving = sampleAt(DEFAULT_ATWOOD, 0.2);
  assert.ok(moving.y2 < 0);
  assert.ok(moving.y1 > 0);
});

test("modified Atwood is driven only by the hanging weight", () => {
  const params = { m1: 2, m2: 1, g: 10, travel: 0.4, mu: 0 };
  assert.ok(close(acceleration(params, "modified"), 10 / 3));
  assert.ok(close(tension(params, "modified"), 1 * (10 - 10 / 3)));
  const withMu = { ...params, mu: 0.2 };
  assert.ok(close(acceleration(withMu, "modified"), (10 - 4) / 3));
});

test("motion stops after the travel limit", () => {
  const params = DEFAULT_ATWOOD;
  const end = sampleAt(params, timeToStop(params) + 4);
  assert.ok(close(Math.abs(end.s), params.travel, 1e-8));
  assert.ok(close(end.t, timeToStop(params)));
});
