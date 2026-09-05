import assert from "node:assert/strict";
import { test } from "node:test";

import {
  apexHeight,
  flightTime,
  inferV0FromRange,
  range,
  rulerSteps,
  sampleAt,
  trajectory,
  viewExtent,
} from "./projectile.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("horizontal launch falls for sqrt(2h/g) and travels v0 times that", () => {
  const params = { v0: 4, thetaDeg: 0, h: 1.25, g: 10 };
  assert.ok(close(flightTime(params), 0.5));
  assert.ok(close(range(params), 2));
  assert.ok(close(apexHeight(params), 1.25));
});

test("oblique launch lands at y = 0 exactly at the flight time", () => {
  const params = { v0: 6, thetaDeg: 40, h: 0.8, g: 9.81 };
  const tLand = flightTime(params);
  const landing = sampleAt(params, tLand);
  assert.ok(tLand > 0);
  assert.equal(landing.y, 0);
  assert.ok(close(landing.x, range(params)));
  assert.ok(landing.vy < 0);
});

test("apex height adds (v0 sin theta)^2 / 2g above the launch height", () => {
  const params = { v0: 5, thetaDeg: 30, h: 1, g: 10 };
  assert.ok(close(apexHeight(params), 1.3125));
});

test("inferV0FromRange inverts the horizontal range formula", () => {
  const params = { v0: 3.7, thetaDeg: 0, h: 0.9, g: 9.81 };
  assert.ok(close(inferV0FromRange(range(params), params.h, params.g), 3.7));
  assert.ok(Number.isNaN(inferV0FromRange(2, 0, 9.81)));
});

test("sampleAt clamps time into [0, flight time]", () => {
  const params = { v0: 5, thetaDeg: 30, h: 1, g: 9.81 };
  const tLand = flightTime(params);
  assert.equal(sampleAt(params, -1).t, 0);
  assert.ok(close(sampleAt(params, -1).y, 1));
  const late = sampleAt(params, tLand + 5);
  assert.ok(close(late.t, tLand));
  assert.equal(late.y, 0);
});

test("horizontal launch from the ground lands immediately", () => {
  const params = { v0: 5, thetaDeg: 0, h: 0, g: 9.81 };
  assert.equal(flightTime(params), 0);
  assert.equal(range(params), 0);
  assert.deepEqual(sampleAt(params, 1), { t: 0, x: 0, y: 0, vx: 5, vy: 0 });
});

test("trajectory samples span launch to landing", () => {
  const params = { v0: 5, thetaDeg: 45, h: 0.5, g: 9.81 };
  const points = trajectory(params, 40);
  assert.equal(points.length, 41);
  assert.equal(points[0].t, 0);
  assert.ok(close(points[0].y, 0.5));
  assert.ok(close(points[40].t, flightTime(params)));
  assert.equal(points[40].y, 0);
});

test("view extent never collapses below the minimum stage and scales with range", () => {
  const tiny = viewExtent({ v0: 0.5, thetaDeg: 0, h: 0.2, g: 9.81 });
  assert.equal(tiny.extentX, 1.5);
  assert.equal(tiny.extentY, 1);
  assert.equal(tiny.scale, 1);
  const long = viewExtent({ v0: 12, thetaDeg: 45, h: 0, g: 9.81 });
  assert.ok(long.extentX > 14);
  assert.ok(close(long.scale, long.extentX / 4));
});

test("ruler steps coarsen as the stage grows", () => {
  assert.deepEqual(rulerSteps(2), { major: 1, minor: 0.5 });
  assert.deepEqual(rulerSteps(12), { major: 2, minor: 1 });
  assert.deepEqual(rulerSteps(30), { major: 5, minor: 2.5 });
  assert.deepEqual(rulerSteps(80), { major: 10, minor: 5 });
  assert.deepEqual(rulerSteps(150), { major: 20, minor: 10 });
});
