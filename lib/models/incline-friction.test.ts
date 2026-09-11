import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BLOCK_HEIGHT,
  BLOCK_SIZE,
  SURFACE_Y,
  acceleration,
  blockPlacement,
  DEFAULT_INCLINE,
  planeAccel,
  planeStopDistance,
  sampleAt,
  speedAtBottom,
  stuck,
  surfaceAt,
  timeToBottom,
  timeToLimit,
} from "./incline-friction.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("the block stays put when tanθ ≤ μs", () => {
  const params = { m: 1, thetaDeg: 20, muS: 0.5, muK: 0.3, g: 10, travel: 0.8, plane: 0.6 };
  assert.equal(stuck(params), true);
  assert.ok(close(acceleration(params), 0));
  const later = sampleAt(params, 2);
  assert.ok(close(later.s, 0));
  assert.ok(close(later.v, 0));
  assert.equal(later.onPlane, false);
  const pose = blockPlacement(params, later);
  const theta = (20 * Math.PI) / 180;
  const sVis = BLOCK_SIZE[0] / 2;
  const surface = surfaceAt(params, sVis);
  const half = BLOCK_HEIGHT / 2;
  assert.ok(close(pose.tilt, -theta));
  assert.ok(close(pose.position[0] - Math.sin(theta) * half, surface[0]));
  assert.ok(close(pose.position[1] - Math.cos(theta) * half, surface[1]));
});

test("once sliding, a = g(sinθ − μk cosθ) on the ramp", () => {
  const params = { m: 2, thetaDeg: 30, muS: 0.4, muK: 0.3, g: 10, travel: 0.8, plane: 1 };
  assert.equal(stuck(params), false);
  const theta = Math.PI / 6;
  const expected = 10 * (Math.sin(theta) - 0.3 * Math.cos(theta));
  assert.ok(close(acceleration(params), expected));
  const mid = sampleAt(params, timeToBottom(params) * 0.4);
  assert.equal(mid.onPlane, false);
  assert.ok(close(mid.a, expected));
  assert.ok(mid.s < params.travel);
});

test("the block leaves the ramp at v = sqrt(2 a s) and then a = −μk g", () => {
  const params = { m: 2, thetaDeg: 30, muS: 0.4, muK: 0.3, g: 10, travel: 0.8, plane: 1.2 };
  const vFoot = speedAtBottom(params);
  assert.ok(close(vFoot, Math.sqrt(2 * acceleration(params) * params.travel)));
  assert.ok(close(planeAccel(params), -3));
  const justFlat = sampleAt(params, timeToBottom(params) + 1e-4);
  assert.equal(justFlat.onPlane, true);
  assert.ok(close(justFlat.a, -3, 1e-6));
  assert.ok(close(justFlat.N, params.m * params.g, 1e-6));
});

test("it stops on the plane at v² / (2 μk g) when the table is long enough", () => {
  const params = { m: 2, thetaDeg: 30, muS: 0.4, muK: 0.3, g: 10, travel: 0.8, plane: 1.5 };
  const dStop = planeStopDistance(params);
  assert.ok(dStop < params.plane);
  const end = sampleAt(params, timeToLimit(params) + 1);
  assert.ok(end.landed);
  assert.equal(end.onPlane, true);
  assert.ok(close(end.v, 0, 1e-6));
  assert.ok(close(end.sPlane, dStop, 1e-6));
  assert.ok(close(end.s, params.travel + dStop, 1e-6));
  const pose = blockPlacement(params, end);
  assert.ok(close(pose.tilt, 0));
  assert.ok(close(pose.position[1], SURFACE_Y + BLOCK_HEIGHT / 2));
});

test("a short table stops the block at the adjustable plane distance", () => {
  const params = { m: 2, thetaDeg: 30, muS: 0.4, muK: 0.3, g: 10, travel: 0.8, plane: 0.15 };
  assert.ok(planeStopDistance(params) > params.plane);
  const end = sampleAt(params, timeToLimit(params) + 1);
  assert.ok(end.landed);
  assert.ok(close(end.sPlane, params.plane, 1e-6));
  assert.ok(close(end.v, 0, 1e-6));
});

test("kinetic friction is clamped so μk cannot exceed μs", () => {
  const params = { m: 1, thetaDeg: 40, muS: 0.2, muK: 0.9, g: 10, travel: 0.8, plane: 0.6 };
  assert.equal(stuck(params), false);
  const theta = (40 * Math.PI) / 180;
  const expected = 10 * (Math.sin(theta) - 0.2 * Math.cos(theta));
  assert.ok(close(acceleration(params), expected));
  assert.ok(close(planeAccel(params), -2));
});

test("stuck samples report static friction and zero lab-frame acceleration", () => {
  const params = { m: 1, thetaDeg: 20, muS: 0.5, muK: 0.3, g: 10, travel: 0.8, plane: 0.6 };
  const sample = sampleAt(params, 1);
  assert.equal(sample.frictionKind, "static");
  assert.ok(close(sample.ax, 0));
  assert.ok(close(sample.ay, 0));
});

test("sliding on the ramp splits acceleration into horizontal and vertical", () => {
  const params = { m: 2, thetaDeg: 30, muS: 0.4, muK: 0.3, g: 10, travel: 0.8, plane: 1 };
  const mid = sampleAt(params, timeToBottom(params) * 0.4);
  const theta = Math.PI / 6;
  assert.equal(mid.frictionKind, "kinetic");
  assert.ok(close(mid.ax, mid.a * Math.cos(theta)));
  assert.ok(close(mid.ay, -mid.a * Math.sin(theta)));
});

test("after stopping on the plane friction returns to the static branch", () => {
  const params = { m: 2, thetaDeg: 30, muS: 0.4, muK: 0.3, g: 10, travel: 0.8, plane: 1.5 };
  const end = sampleAt(params, timeToLimit(params) + 1);
  assert.equal(end.landed, true);
  assert.equal(end.frictionKind, "static");
  assert.ok(close(end.f, 0));
  assert.ok(close(end.ax, 0));
});

test("on the ramp the cube underside rests on the slope", () => {
  const params = DEFAULT_INCLINE;
  const sample = sampleAt(params, 0.05);
  const pose = blockPlacement(params, sample);
  const theta = (params.thetaDeg * Math.PI) / 180;
  const half = BLOCK_HEIGHT / 2;
  const contactX = pose.position[0] - Math.sin(theta) * half;
  const contactY = pose.position[1] - Math.cos(theta) * half;
  const surface = surfaceAt(params, Math.max(sample.s, BLOCK_SIZE[0] / 2));
  assert.ok(close(pose.tilt, -theta));
  assert.ok(close(contactX, surface[0], 1e-8));
  assert.ok(close(contactY, surface[1], 1e-8));
});
