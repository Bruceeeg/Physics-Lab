import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clampTime,
  elapsedTrail,
  motionSample,
  predictedSamples,
  TIME_MAX,
  TIME_MIN,
} from "./linear-motion.ts";

const kinematics = { x0: 0, v0: 4, a: 2, duration: 5, stepCount: 80 };

test("elapsed trail markers keep their positions as time advances", () => {
  const predicted = predictedSamples(
    kinematics.x0,
    kinematics.v0,
    kinematics.a,
    kinematics.duration,
    kinematics.stepCount,
  );
  const early = elapsedTrail(predicted, motionSample(0, 4, 2, 1));
  const later = elapsedTrail(predicted, motionSample(0, 4, 2, 1.25));

  assert.ok(early.markers.length > 0);
  for (const marker of early.markers) {
    const stillThere = later.markers.find((item) => item.t === marker.t);
    assert.deepEqual(stillThere, marker);
  }
});

test("only the live path tip may move between nearby times", () => {
  const predicted = predictedSamples(0, 4, 2, 5, 80);
  const a = elapsedTrail(predicted, motionSample(0, 4, 2, 1.01));
  const b = elapsedTrail(predicted, motionSample(0, 4, 2, 1.02));

  assert.deepEqual(a.path.slice(0, -1), b.path.slice(0, -1));
  assert.notEqual(a.path.at(-1)?.t, b.path.at(-1)?.t);
});

test("path does not duplicate a lattice sample when time lands on the grid", () => {
  const predicted = predictedSamples(0, 4, 2, 5, 80);
  const time = (5 * 16) / 80;
  const trail = elapsedTrail(predicted, motionSample(0, 4, 2, time));

  assert.equal(trail.path.length, trail.markers.length);
  assert.equal(trail.path.at(-1)?.t, time);
});

test("time at or below zero leaves no trail", () => {
  const predicted = predictedSamples(0, 4, 2, 5, 80);
  assert.deepEqual(elapsedTrail(predicted, motionSample(0, 4, 2, 0)), {
    markers: [],
    path: [],
  });
});

test("manual time is clamped to the allowed clock range", () => {
  assert.equal(clampTime(-2), TIME_MIN);
  assert.equal(clampTime(TIME_MAX + 8), TIME_MAX);
  assert.equal(clampTime(3.25), 3.25);
  assert.equal(clampTime(Number.NaN), TIME_MIN);
});
