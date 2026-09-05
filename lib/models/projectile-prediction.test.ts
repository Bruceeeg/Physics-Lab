import assert from "node:assert/strict";
import { test } from "node:test";

import {
  HIDDEN_V0_MAX,
  HIDDEN_V0_MIN,
  PREDICTION_G,
  canLaunch,
  createPrediction,
  drawHiddenV0,
  newDataset,
  placeTarget,
  predictionParams,
  recordLanding,
  retryPrediction,
  setHeight,
  setTheta,
  submitV0Estimate,
} from "./projectile-prediction.ts";

// 2 + (1/3) * 6 = 4.00 m/s
const fixedV0 = () => 1 / 3;

test("hidden v0 is drawn from [2, 8] with two decimals", () => {
  assert.equal(drawHiddenV0(() => 0), HIDDEN_V0_MIN);
  assert.ok(drawHiddenV0(() => 0.999999) <= HIDDEN_V0_MAX);
  const mid = drawHiddenV0(() => 0.123456);
  assert.ok(Math.abs(mid * 100 - Math.round(mid * 100)) < 1e-9);
  assert.equal(drawHiddenV0(fixedV0), 4);
});

test("a new prediction starts in the measure phase with a horizontal launcher", () => {
  const state = createPrediction(fixedV0);
  assert.equal(state.phase, "measure");
  assert.equal(state.hiddenV0, 4);
  assert.equal(state.thetaDeg, 0);
  assert.equal(state.h, 1);
  assert.deepEqual(predictionParams(state), { v0: 4, thetaDeg: 0, h: 1, g: PREDICTION_G });
  assert.equal(canLaunch(state), true);
});

test("theta is locked during measure and clamped during predict", () => {
  const measure = createPrediction(fixedV0);
  assert.equal(setTheta(measure, 30), measure);
  const predict = submitV0Estimate(measure, 4);
  assert.equal(setTheta(predict, 95).thetaDeg, 80);
  assert.equal(setTheta(predict, -5).thetaDeg, 0);
});

test("v0 estimate within 5 percent unlocks the predict phase", () => {
  const state = createPrediction(fixedV0);
  const accepted = submitV0Estimate(state, 4.2);
  assert.equal(accepted.phase, "predict");
  assert.equal(accepted.v0Accepted, true);
  assert.equal(submitV0Estimate(state, 3.8).phase, "predict");
  const rejected = submitV0Estimate(state, 4.2004);
  assert.equal(rejected.phase, "measure");
  assert.equal(rejected.v0Accepted, false);
  assert.equal(rejected.v0Estimate, 4.2004);
});

test("measure phase records the landing without judging it", () => {
  const state = recordLanding(createPrediction(fixedV0), 1.81);
  assert.equal(state.phase, "measure");
  assert.equal(state.lastLandingX, 1.81);
  assert.equal(state.outcome, null);
});

test("predict phase needs a placed target before launching", () => {
  const predict = submitV0Estimate(createPrediction(fixedV0), 4);
  assert.equal(canLaunch(predict), false);
  assert.equal(recordLanding(predict, 2), predict);
  const placed = placeTarget(predict, 2);
  assert.equal(placed.targetPlaced, true);
  assert.equal(placed.xPredicted, 2);
  assert.equal(canLaunch(placed), true);
});

test("landing within 0.10 m of the target counts as a hit", () => {
  const placed = placeTarget(submitV0Estimate(createPrediction(fixedV0), 4), 2);
  const hit = recordLanding(placed, 2.1);
  assert.equal(hit.phase, "result");
  assert.equal(hit.outcome?.hit, true);
  assert.equal(canLaunch(hit), false);
  const nearMiss = recordLanding(placed, 2.101);
  assert.equal(nearMiss.outcome?.hit, false);
  assert.ok(Math.abs((nearMiss.outcome?.deltaX ?? 0) - 0.101) < 1e-9);
  assert.equal(recordLanding(placed, 1.9).outcome?.hit, true);
});

test("changing h or theta while predicting removes the placed target", () => {
  const placed = placeTarget(submitV0Estimate(createPrediction(fixedV0), 4), 2);
  assert.equal(setHeight(placed, 1.5).targetPlaced, false);
  assert.equal(setTheta(placed, 20).xPredicted, null);
  assert.equal(setHeight(placed, 5).h, 3);
  assert.equal(setHeight(placed, 1), placed);
});

test("retry keeps the hidden v0; a new dataset replaces it", () => {
  const result = recordLanding(
    placeTarget(submitV0Estimate(createPrediction(fixedV0), 4), 2),
    2.5,
  );
  const retry = retryPrediction(result);
  assert.equal(retry.phase, "predict");
  assert.equal(retry.hiddenV0, 4);
  assert.equal(retry.targetPlaced, false);
  assert.equal(retry.outcome, null);
  assert.equal(retry.lastLandingX, null);
  const fresh = newDataset(result, () => 0.5);
  assert.equal(fresh.phase, "measure");
  assert.equal(fresh.hiddenV0, 5);
  assert.equal(fresh.h, result.h);
  assert.equal(fresh.thetaDeg, 0);
  assert.equal(fresh.v0Estimate, null);
});
