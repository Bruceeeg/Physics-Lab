import assert from "node:assert/strict";
import { test } from "node:test";

import {
  appendKinematicSample,
  derive,
  initialState,
  kinematicSample,
  projectKinematics,
  step,
  validatePullParams,
} from "./pull-friction.ts";

const rest = initialState();

test("frictionless horizontal pull gives a = F/m", () => {
  const derived = derive(
    { F: 10, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 9.81 },
    rest,
  );
  assert.equal(derived.mode, "sliding");
  assert.ok(Math.abs(derived.ax - 5) < 1e-9);
  assert.ok(Math.abs(derived.az) < 1e-9);
});

test("force below static threshold stays stuck", () => {
  const params = { F: 4, thetaDeg: 0, m: 2, muS: 0.4, muK: 0.3, g: 10 };
  // muS * N = 0.4 * 20 = 8; Fx = 4 < 8
  const derived = derive(params, rest);
  assert.equal(derived.mode, "static");
  assert.equal(derived.alert, "stuck");
  assert.equal(derived.ax, 0);
});

test("vertical component exceeding weight lifts off", () => {
  const params = { F: 30, thetaDeg: 80, m: 1, muS: 0.2, muK: 0.1, g: 10 };
  const derived = derive(params, rest);
  assert.ok(derived.mode === "liftoff" || derived.mode === "airborne");
  assert.ok(derived.alert === "will-lift" || derived.alert === "airborne");
  assert.equal(derived.forces.N, 0);
  assert.ok(derived.az > 0);
});

test("raising F past the static limit starts sliding", () => {
  const small = { F: 4, thetaDeg: 0, m: 2, muS: 0.4, muK: 0.3, g: 10 };
  assert.equal(derive(small, rest).mode, "static");
  const large = { ...small, F: 12 };
  assert.equal(derive(large, rest).mode, "sliding");
});

test("live param change keeps position", () => {
  const params = { F: 20, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 10 };
  let state = rest;
  for (let i = 0; i < 10; i += 1) {
    state = step(params, state, 0.01);
  }
  const xBefore = state.x;
  const next = derive({ ...params, F: 5 }, state);
  assert.ok(xBefore > 0);
  assert.equal(state.x, xBefore);
  assert.ok(Math.abs(next.ax - 2.5) < 1e-9);
});

test("negative F with theta 180 pulls toward -x with no vertical component", () => {
  const derived = derive(
    { F: -10, thetaDeg: 180, m: 2, muS: 0, muK: 0, g: 10 },
    rest,
  );
  assert.equal(derived.mode, "sliding");
  assert.ok(Math.abs(derived.forces.Fx + 10) < 1e-9);
  assert.ok(Math.abs(derived.forces.Fz) < 1e-9);
  assert.ok(Math.abs(derived.ax + 5) < 1e-9);
  assert.equal(derived.alert, "moving-minus");
});

test("negative F at theta 180 with friction slides in -x", () => {
  const params = { F: -12, thetaDeg: 180, m: 2, muS: 0.4, muK: 0.3, g: 10 };
  const derived = derive(params, rest);
  assert.equal(derived.mode, "sliding");
  assert.ok(derived.forces.Fx < 0);
  assert.ok(derived.ax < 0);
  const moved = step(params, rest, 0.05);
  assert.ok(moved.x < 0);
  assert.ok(moved.vx < 0);
});

test("stuck kinematic sample is zero velocity acceleration and horizontal net force", () => {
  const params = { F: 4, thetaDeg: 0, m: 2, muS: 0.4, muK: 0.3, g: 10 };
  const derived = derive(params, rest);
  const sample = kinematicSample(derived, rest);
  assert.equal(sample.t, 0);
  assert.equal(sample.vx, 0);
  assert.equal(sample.ax, 0);
  assert.ok(Math.abs(sample.fxNet) < 1e-9);
});

test("sliding kinematic sample uses vx ax and Fx plus friction", () => {
  const params = { F: 20, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 10 };
  let state = rest;
  for (let i = 0; i < 40; i += 1) {
    state = step(params, state, 0.02);
  }
  const derived = derive(params, state);
  const sample = kinematicSample(derived, state);
  assert.ok(sample.vx > 0);
  assert.ok(Math.abs(sample.vx - state.vx) < 1e-9);
  assert.ok(Math.abs(sample.ax - derived.ax) < 1e-9);
  assert.ok(Math.abs(sample.fxNet - (derived.forces.Fx + derived.forces.f)) < 1e-9);
});

test("projected kinematics stay flat while stuck", () => {
  const params = { F: 4, thetaDeg: 0, m: 2, muS: 0.4, muK: 0.3, g: 10 };
  const samples = projectKinematics(params, rest, 2, 0.1);
  assert.ok(samples.length >= 2);
  assert.equal(samples[0].t, 0);
  assert.ok(Math.abs(samples[samples.length - 1].t - 2) < 1e-9);
  for (const sample of samples) {
    assert.equal(sample.vx, 0);
    assert.equal(sample.ax, 0);
    assert.ok(Math.abs(sample.fxNet) < 1e-9);
  }
});

test("projected kinematics for frictionless +x pull grow vx at constant ax", () => {
  const params = { F: 10, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 10 };
  const samples = projectKinematics(params, rest, 1, 0.05);
  const last = samples[samples.length - 1];
  assert.ok(Math.abs(last.ax - 5) < 1e-6);
  assert.ok(Math.abs(last.fxNet - 10) < 1e-6);
  assert.ok(Math.abs(last.vx - 5) < 0.15);
});

test("projected kinematics for negative F at theta 180 pull toward -x", () => {
  const params = { F: -10, thetaDeg: 180, m: 2, muS: 0, muK: 0, g: 10 };
  const samples = projectKinematics(params, rest, 1, 0.05);
  const last = samples[samples.length - 1];
  assert.ok(last.vx < 0);
  assert.ok(last.ax < 0);
  assert.ok(last.fxNet < 0);
});

test("append kinematic sample keeps origin and a live endpoint at ~30 Hz", () => {
  const params = { F: 10, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 10 };
  let state = rest;
  let series = [kinematicSample(derive(params, state), state)];
  for (let i = 0; i < 60; i += 1) {
    state = step(params, state, 1 / 60);
    series = appendKinematicSample(series, kinematicSample(derive(params, state), state));
  }
  assert.equal(series[0].t, 0);
  assert.ok(series[series.length - 1].t >= 0.95);
  assert.ok(series.length >= 24);
  assert.ok(series.length <= 35);
});

test("signed F must agree with the geometric theta direction", () => {
  const base = { m: 2, muS: 0.4, muK: 0.3, g: 9.81 };
  assert.equal(validatePullParams({ ...base, F: 20, thetaDeg: 30 }), null);
  assert.equal(validatePullParams({ ...base, F: -20, thetaDeg: 120 }), null);
  assert.equal(validatePullParams({ ...base, F: 0, thetaDeg: 150 }), null);
  assert.ok(validatePullParams({ ...base, F: -20, thetaDeg: 30 }));
  assert.ok(validatePullParams({ ...base, F: 20, thetaDeg: 120 }));
});

test("negative F uses its magnitude and theta as the actual vector direction", () => {
  const derived = derive(
    { F: -20, thetaDeg: 120, m: 2, muS: 0, muK: 0, g: 20 },
    rest,
  );
  assert.ok(Math.abs(derived.forces.Fx + 10) < 1e-9);
  assert.ok(Math.abs(derived.forces.Fz - 10 * Math.sqrt(3)) < 1e-9);
});

test("kinematic samples include displacement from the reset origin", () => {
  const params = { F: 10, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 10 };
  const moved = step(params, rest, 0.5);
  const sample = kinematicSample(derive(params, moved), moved);
  assert.ok(Math.abs(sample.dx - moved.x) < 1e-9);
});

test("cumulative history compaction preserves first and latest samples", () => {
  const derived = derive(
    { F: 0, thetaDeg: 0, m: 2, muS: 0.4, muK: 0.3, g: 10 },
    rest,
  );
  let series = [kinematicSample(derived, rest)];
  for (let index = 1; index <= 2000; index += 1) {
    const state = { ...rest, t: index / 10, x: index / 5 };
    series = appendKinematicSample(series, kinematicSample(derived, state), 0);
  }
  assert.equal(series[0].t, 0);
  assert.equal(series[series.length - 1].t, 200);
  assert.ok(series.length <= 800);
});
