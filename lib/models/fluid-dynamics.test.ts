import assert from "node:assert/strict";
import { test } from "node:test";

import {
  depth,
  DEFAULT_FLUID,
  exitSpeed,
  flightTime,
  jetAt,
  range,
} from "./fluid-dynamics.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("Torricelli speed is √(2gh) and range is 2√(depth · holeY)", () => {
  const params = { H: 1.2, holeY: 0.3, g: 10 };
  assert.ok(close(depth(params), 0.9));
  assert.ok(close(exitSpeed(params), Math.sqrt(18)));
  assert.ok(close(range(params), 2 * Math.sqrt(0.9 * 0.3)));
});

test("jet lands at y = 0 at the flight time", () => {
  const params = DEFAULT_FLUID;
  const landing = jetAt(params, flightTime(params));
  assert.ok(close(landing.y, 0, 1e-9));
  assert.ok(close(landing.x, range(params)));
});
