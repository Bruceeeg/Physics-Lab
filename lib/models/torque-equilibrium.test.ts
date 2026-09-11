import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_TORQUE,
  inertiaAboutFulcrum,
  netTorque,
  sampleAt,
  timeToTip,
} from "./torque-equilibrium.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("a uniform stick balances when M(L/2 − f) + m(x − f) = 0", () => {
  const params = { L: 1, M: 0.2, f: 0.7, m: 0.16, x: 0.95, g: 10 };
  assert.ok(close(netTorque(params), 0));
  const rest = sampleAt(params, 1);
  assert.ok(close(rest.theta, 0));
  assert.equal(rest.balanced, true);
  assert.equal(Number.isFinite(timeToTip(params)), false);
});

test("extra mass on the long side makes clockwise torque and tips right-side down", () => {
  const params = { L: 1, M: 0.2, f: 0.7, m: 0.28, x: 0.95, g: 10 };
  const tau = netTorque(params);
  assert.ok(tau < 0);
  const I = inertiaAboutFulcrum(params);
  const alpha = tau / I;
  const limit = timeToTip(params);
  const mid = sampleAt(params, limit / 2);
  const end = sampleAt(params, limit + 1);
  assert.ok(mid.theta < 0);
  assert.ok(close(mid.alpha, alpha));
  assert.ok(end.tipped);
  assert.ok(close(end.theta, -Math.abs(end.theta)));
});

test("default meter stick is balanced within 1e-6 N·m", () => {
  assert.ok(Math.abs(netTorque(DEFAULT_TORQUE)) < 1e-6);
});
