import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CART_HEIGHT,
  RAMP_THICKNESS,
  TRACK_SURFACE_Y,
  attachedLoopPeriod,
  attachedSMax,
  cartOnRampLocal,
  cartPlacement,
  cyclePeriod,
  DEFAULT_ENERGY,
  maxHeight,
  sampleAt,
} from "./conservation-of-energy.ts";

const close = (a: number, b: number, eps = 1e-8) => Math.abs(a - b) < eps;

test("½kA² converts to mgy at the highest point", () => {
  const params = { ...DEFAULT_ENERGY, k: 200, A: 0.15, m: 0.5, g: 10, thetaDeg: 30 };
  const E0 = 0.5 * params.k * params.A * params.A;
  assert.ok(close(maxHeight(params) * params.m * params.g, E0));
  const peak = sampleAt(params, cyclePeriod(params) / 2);
  assert.ok(close(peak.v, 0, 1e-6));
  assert.ok(close(peak.Ug, E0, 1e-6));
  assert.ok(close(peak.E, E0, 1e-6));
});

test("mechanical energy stays at ½kA² around the cycle", () => {
  const params = DEFAULT_ENERGY;
  const E0 = 0.5 * params.k * params.A * params.A;
  const period = cyclePeriod(params);
  for (const frac of [0, 0.1, 0.25, 0.4, 0.5, 0.75, 0.9]) {
    const sample = sampleAt(params, frac * period);
    assert.ok(close(sample.E, E0, 2e-6), `t=${sample.t} E=${sample.E}`);
  }
});

test("the cart sits on the flat track until it reaches the ramp", () => {
  const pose = cartPlacement(-0.1, 25);
  assert.equal(pose.tilt, 0);
  assert.ok(close(pose.position[0], -0.1));
  assert.ok(close(pose.position[1], TRACK_SURFACE_Y + CART_HEIGHT / 2));
});

test("on the ramp the cart is parallel to the slope and its underside rests on the surface", () => {
  const thetaDeg = 25;
  const theta = (thetaDeg * Math.PI) / 180;
  const s = 0.4;
  const pose = cartPlacement(s, thetaDeg);
  assert.ok(close(pose.tilt, theta));
  const nx = -Math.sin(theta);
  const ny = Math.cos(theta);
  const half = CART_HEIGHT / 2;
  const contactX = pose.position[0] - nx * half;
  const contactY = pose.position[1] - ny * half;
  assert.ok(close(contactX, s * Math.cos(theta)));
  assert.ok(close(contactY, TRACK_SURFACE_Y + s * Math.sin(theta)));
});

test("a cart parented to the ramp slab sits on the top face", () => {
  const rampLen = 1.2;
  const s = 0.4;
  const local = cartOnRampLocal(s, rampLen);
  assert.ok(close(local[0], s - rampLen / 2));
  assert.ok(close(local[1] - CART_HEIGHT / 2, RAMP_THICKNESS / 2));
});

test("attached spring keeps Us on the ramp and comes back short of the launch apex", () => {
  const params = { ...DEFAULT_ENERGY, k: 200, A: 0.15, m: 0.5, g: 10, thetaDeg: 30 };
  const E0 = 0.5 * params.k * params.A * params.A;
  const sPeak = attachedSMax(params);
  const delta = (params.m * params.g * Math.sin((params.thetaDeg * Math.PI) / 180)) / params.k;
  const launchS = maxHeight(params) / Math.sin((params.thetaDeg * Math.PI) / 180);
  assert.ok(close(sPeak, Math.hypot(params.A, delta) - delta));
  assert.ok(sPeak > 0);
  assert.ok(sPeak < launchS);
  let sawRamp = false;
  let sawReturn = false;
  for (let step = 0; step <= 80; step += 1) {
    const sample = sampleAt(params, step * 0.02, "attached");
    assert.ok(close(sample.E, E0, 2e-4), `t=${sample.t} E=${sample.E}`);
    if (sample.s > 0.02) {
      sawRamp = true;
      assert.ok(sample.Us > 0);
      assert.equal(sample.connected, true);
    }
    if (sawRamp && sample.s < -0.02) {
      sawReturn = true;
    }
  }
  assert.equal(sawRamp, true);
  assert.equal(sawReturn, true);
});

test("attached loop returns to rest at the compressed start", () => {
  const params = { ...DEFAULT_ENERGY, k: 200, A: 0.15, m: 0.5, g: 10, thetaDeg: 30 };
  const end = sampleAt(params, attachedLoopPeriod(params), "attached");
  assert.ok(close(end.s, -params.A, 2e-4));
  assert.ok(close(end.v, 0, 2e-3));
});

test("launch mode still lets go of the spring on the ramp", () => {
  const peak = sampleAt(DEFAULT_ENERGY, cyclePeriod(DEFAULT_ENERGY) / 2, "launch");
  assert.ok(peak.s > 0);
  assert.equal(peak.connected, false);
  assert.ok(close(peak.Us, 0, 1e-9));
});
