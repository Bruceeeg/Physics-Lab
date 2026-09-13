import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LANDING_REL_TOL,
  PREDICTION_G,
  canLaunch,
  createPrediction,
  newDataset,
  placeTarget,
  predictionParams,
  recordLanding,
  relativeLandingError,
  retryPrediction,
  setHeight,
  setTheta,
  setV0,
} from "./projectile-prediction.ts";

test("a new prediction starts with settable v0 and launch angle", () => {
  const state = createPrediction(5, 1, 30);
  assert.equal(state.v0, 5);
  assert.equal(state.thetaDeg, 30);
  assert.equal(state.h, 1);
  assert.equal(state.xPredicted, null);
  assert.equal(canLaunch(state), false);
  assert.deepEqual(predictionParams(state), { v0: 5, thetaDeg: 30, h: 1, g: PREDICTION_G });
});

test("theta and v0 can be changed before launch", () => {
  const state = createPrediction();
  assert.equal(setTheta(state, 45).thetaDeg, 45);
  assert.equal(setV0(state, 8).v0, 8);
  assert.equal(setHeight(state, 1.6).h, 1.6);
});

test("launch needs a predicted landing position", () => {
  const ready = placeTarget(createPrediction(), 2.4);
  assert.equal(ready.xPredicted, 2.4);
  assert.equal(canLaunch(ready), true);
});

test("landing within 1 percent of the prediction counts as a hit", () => {
  const placed = placeTarget(createPrediction(5, 1, 0), 2);
  const hit = recordLanding(placed, 2.02);
  assert.equal(hit.outcome?.hit, true);
  assert.ok((hit.outcome?.relativeError ?? 1) <= LANDING_REL_TOL + 1e-9);
  const miss = recordLanding(placed, 2.03);
  assert.equal(miss.outcome?.hit, false);
  assert.ok(Math.abs(relativeLandingError(2, 2.02) - 0.01) < 1e-9);
});

test("retry keeps v0 and theta; a new dataset keeps the current settings", () => {
  const result = recordLanding(placeTarget(setTheta(createPrediction(6, 1, 20), 20), 3), 3.2);
  const retry = retryPrediction(result);
  assert.equal(retry.v0, 6);
  assert.equal(retry.thetaDeg, 20);
  assert.equal(retry.outcome, null);
  assert.equal(retry.lastLandingX, null);
  const fresh = newDataset(result);
  assert.equal(fresh.v0, 6);
  assert.equal(fresh.h, 1);
  assert.equal(fresh.xPredicted, null);
});
