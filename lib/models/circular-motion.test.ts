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

test("conical motion uses the set tangent speed as its initial condition", () => {
  const params = { ...DEFAULT_CIRCULAR, L: 1.2, thetaDeg: 30, g: 10, v0: 2 };
  const a = sampleAt(params, 0, "conical");
  assert.ok(close(a.speed, 2, 1e-6));
  assert.ok(close(a.omega, 2 / orbitRadius(params), 1e-6));
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

test("vertical circle swings back when it cannot loop and the rope stays taut", () => {
  const params = { ...DEFAULT_CIRCULAR, r: 0.4, v0: 1.5, m: 0.5, g: 10 };
  assert.equal(canLoop(params), false);
  const climb = sampleAt(params, 0.25, "vertical");
  const back = sampleAt(params, 0.9, "vertical");
  assert.equal(climb.phase, "constrained");
  assert.equal(back.phase, "constrained");
  assert.ok(climb.tension >= 0);
  assert.ok(back.tension >= 0);
  assert.ok(climb.phi > 0.2);
  assert.ok(back.phi < climb.phi);
  assert.ok(back.y < climb.y);
});

test("vertical rope detaches at zero tension and continues as a projectile", () => {
  const params = { ...DEFAULT_CIRCULAR, r: 0.55, v0: 4.8, m: 0.4, g: 9.81 };
  const after = sampleAt(params, 0.8, "vertical");

  assert.equal(after.phase, "projectile");
  assert.ok(after.detachment);
  assert.ok(Math.abs(after.detachment.tension) < 0.03);
  assert.equal(after.tension, 0);
  assert.ok(Math.abs(Math.hypot(after.x, after.y) - params.r) > 0.01);

  const before = sampleAt(params, Math.max(0, after.detachment.t - 1e-4), "vertical");
  const boundary = sampleAt(params, after.detachment.t, "vertical");
  const justAfter = sampleAt(params, after.detachment.t + 1e-4, "vertical");
  assert.equal(before.phase, "constrained");
  assert.equal(boundary.phase, "constrained");
  assert.equal(justAfter.phase, "projectile");
  assert.ok(Math.hypot(boundary.x - justAfter.x, boundary.y - justAfter.y) < 0.002);
});

test("vertical rope stays constrained at and above the loop threshold", () => {
  const params = { ...DEFAULT_CIRCULAR, r: 0.55, m: 0.4, g: 9.81 };
  params.v0 = Math.sqrt(5 * params.g * params.r);
  const top = sampleAt(params, Math.PI * params.r / params.v0, "vertical");
  assert.equal(top.phase, "constrained");
  assert.equal(top.detachment, null);
  assert.ok(top.tension >= -1e-6);
});

test("a balanced conical pendulum keeps its polar angle", () => {
  const params = { L: 2, thetaDeg: 60, m: 0.5, g: 9.81, r: 0.55, v0: 3 };
  params.v0 = conicalEquilibriumSpeed(params);
  assert.ok(close(orbitRadius(params), Math.sqrt(3)));
  const a = sampleAt(params, 0);
  const b = sampleAt(params, 0.7);
  assert.ok(close(a.y, b.y));
  assert.ok(close(Math.hypot(b.x, b.z), orbitRadius(params)));
  assert.ok(close(a.tension, tension(params)));
  assert.ok(Math.abs(b.polarVelocity) < 1e-7);
});

test("a fast conical pendulum rises instead of staying at the set angle", () => {
  const params = { ...DEFAULT_CIRCULAR, thetaDeg: 25 };
  params.v0 = conicalEquilibriumSpeed(params) * 1.35;
  const initial = sampleAt(params, 0, "conical");
  const later = sampleAt(params, 0.2, "conical");
  assert.ok(later.polar > initial.polar);
  assert.ok(later.y > initial.y);
  assert.ok(later.polarVelocity > 0);
});

test("spherical pendulum conserves energy and vertical angular momentum", () => {
  const params = { ...DEFAULT_CIRCULAR, thetaDeg: 32 };
  params.v0 = conicalEquilibriumSpeed(params) * 1.22;
  const initial = sampleAt(params, 0, "conical");
  const later = sampleAt(params, 3, "conical");
  const energy = (sample: ReturnType<typeof sampleAt>) =>
    0.5 *
      params.m *
      params.L *
      params.L *
      (sample.polarVelocity * sample.polarVelocity +
        Math.sin(sample.polar) ** 2 * sample.omega * sample.omega) -
    params.m * params.g * params.L * Math.cos(sample.polar);
  const angularMomentum = (sample: ReturnType<typeof sampleAt>) =>
    params.m * params.L * params.L * Math.sin(sample.polar) ** 2 * sample.omega;

  assert.ok(Math.abs(energy(later) - energy(initial)) < 2e-4);
  assert.ok(Math.abs(angularMomentum(later) - angularMomentum(initial)) < 2e-5);
});
