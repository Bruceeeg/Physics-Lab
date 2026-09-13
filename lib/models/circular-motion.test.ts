import assert from "node:assert/strict";
import { test } from "node:test";

import {
  angularSpeed,
  canLoop,
  conicalEquilibriumSpeed,
  DEFAULT_CIRCULAR,
  equilibriumPeriod,
  orbitRadius,
  period,
  sampleAt,
  tension,
} from "./circular-motion.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("conical equilibrium period is 2π √(L cosθ / g)", () => {
  const params = { ...DEFAULT_CIRCULAR, L: 1.2, thetaDeg: 30, g: 10 };
  const theta = Math.PI / 6;
  const expected = 2 * Math.PI * Math.sqrt((params.L * Math.cos(theta)) / params.g);
  assert.ok(close(equilibriumPeriod(params), expected));
  params.v0 = conicalEquilibriumSpeed(params);
  assert.ok(close(period(params), expected, 1e-6));
  assert.ok(close(angularSpeed(params), (2 * Math.PI) / expected, 1e-6));
});

test("conical motion uses the set tangent speed", () => {
  const params = { ...DEFAULT_CIRCULAR, L: 1.2, thetaDeg: 30, g: 10, v0: 2 };
  const r = orbitRadius(params);
  const a = sampleAt(params, 0, "conical");
  const b = sampleAt(params, 0.4, "conical");
  assert.ok(close(a.speed, 2, 1e-6));
  assert.ok(close(b.speed, 2, 1e-6));
  assert.ok(close(period(params, "conical"), (2 * Math.PI * r) / 2, 1e-6));
});

test("horizontal circle keeps speed and uses T = mv²/r", () => {
  const params = { ...DEFAULT_CIRCULAR, r: 0.5, v0: 2, m: 0.4 };
  const a = sampleAt(params, 0, "horizontal");
  const b = sampleAt(params, 0.4, "horizontal");
  assert.ok(close(a.speed, 2));
  assert.ok(close(b.speed, 2));
  assert.ok(close(a.tension, (0.4 * 4) / 0.5));
  assert.ok(close(a.Fc, (0.4 * 4) / 0.5));
  assert.ok(close(Math.hypot(b.x, b.z), 0.5));
});

test("vertical circle loses speed as it climbs and T = mv²/R + mg cosφ", () => {
  const params = { ...DEFAULT_CIRCULAR, r: 0.4, v0: 4, m: 0.5, g: 10 };
  const bottom = sampleAt(params, 0, "vertical");
  assert.ok(close(bottom.speed, 4, 1e-6));
  assert.ok(close(bottom.tension, (0.5 * 16) / 0.4 + 0.5 * 10, 1e-5));
  const later = sampleAt(params, 0.15, "vertical");
  assert.ok(later.y > bottom.y);
  assert.ok(later.speed < bottom.speed);
});

test("vertical circle swings back when it cannot loop", () => {
  const params = { ...DEFAULT_CIRCULAR, r: 0.4, v0: 1.5, m: 0.5, g: 10 };
  assert.equal(canLoop(params), false);
  const climb = sampleAt(params, 0.25, "vertical");
  const back = sampleAt(params, 0.9, "vertical");
  assert.ok(climb.phi > 0.2);
  assert.ok(back.phi < climb.phi);
  assert.ok(back.y < climb.y);
});

test("orbit radius is L sinθ and the bob stays at constant height", () => {
  const params = { L: 2, thetaDeg: 60, m: 0.5, g: 9.81, r: 0.55, v0: 3 };
  assert.ok(close(orbitRadius(params), Math.sqrt(3)));
  const a = sampleAt(params, 0);
  const b = sampleAt(params, 0.7);
  assert.ok(close(a.y, b.y));
  assert.ok(close(Math.hypot(b.x, b.z), orbitRadius(params)));
  assert.ok(close(a.tension, tension(params)));
});
