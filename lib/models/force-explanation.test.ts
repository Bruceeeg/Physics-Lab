import assert from "node:assert/strict";
import { test } from "node:test";

import { forceExplanation } from "./force-explanation.ts";
import { derive, initialState, type PullParams } from "./pull-friction.ts";

const oblique: PullParams = {
  F: 20,
  thetaDeg: 30,
  m: 2,
  muS: 0.4,
  muK: 0.3,
  g: 9.81,
};

test("component explanations show the formula and current substitution", () => {
  const derived = derive(oblique, initialState());

  const fx = forceExplanation("Fx", oblique, derived);
  assert.equal(fx.title, "水平分力 Fₓ");
  assert.equal(fx.formula, "Fₓ = |F| × cosθ");
  assert.equal(fx.substitution, "20.00 × cos(30.00°)");
  assert.equal(fx.result, "17.32 N");

  const fz = forceExplanation("Fz", oblique, derived);
  assert.equal(fz.formula, "Fᶻ = |F| × sinθ");
  assert.equal(fz.result, "10.00 N");
});

test("weight and normal force explanations use the current parameters", () => {
  const derived = derive(oblique, initialState());

  const weight = forceExplanation("G", oblique, derived);
  assert.equal(weight.formula, "G = m × g");
  assert.equal(weight.substitution, "2.00 × 9.81");
  assert.equal(weight.result, "19.62 N");

  const normal = forceExplanation("N", oblique, derived);
  assert.equal(normal.formula, "N = G - Fᶻ");
  assert.equal(normal.substitution, "19.62 - 10.00");
  assert.equal(normal.result, "9.62 N");
});

test("static friction explains its self-adjusting branch", () => {
  const params: PullParams = {
    F: 4,
    thetaDeg: 0,
    m: 2,
    muS: 0.4,
    muK: 0.3,
    g: 10,
  };
  const derived = derive(params, initialState());
  const friction = forceExplanation("f", params, derived);

  assert.equal(derived.mode, "static");
  assert.equal(friction.formula, "f = -Fₓ");
  assert.equal(friction.substitution, "-(4.00)");
  assert.equal(friction.result, "-4.00 N");
  assert.match(friction.detail, /最大静摩擦力 μₛN = 8\.00 N/);
});

test("sliding friction explains coefficient, normal force, and direction", () => {
  const derived = derive(oblique, initialState());
  const friction = forceExplanation("f", oblique, derived);

  assert.equal(derived.mode, "sliding");
  assert.equal(friction.formula, "f = -μₖN × sgn(vₓ)");
  assert.equal(friction.substitution, "-0.30 × 9.62 × 1");
  assert.equal(friction.result, "-2.89 N");
  assert.match(friction.detail, /运动方向相反/);
});

test("the resultant pull explanation links the input to its components", () => {
  const derived = derive(oblique, initialState());
  const pull = forceExplanation("F", oblique, derived);

  assert.equal(pull.formula, "|F| = √(Fₓ² + Fᶻ²)");
  assert.equal(pull.substitution, "√(17.32² + 10.00²)");
  assert.equal(pull.result, "20.00 N");
});
