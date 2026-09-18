import assert from "node:assert/strict";
import { test } from "node:test";

import { canLoop, DEFAULT_LOOP, minLoopHeight, sampleAt, speedFromHeight } from "./loop-track.ts";

const close = (a: number, b: number, eps = 1e-8) => Math.abs(a - b) < eps;

test("a sliding block just loops from h = 2.5 R", () => {
  const params = { ...DEFAULT_LOOP, R: 0.4, g: 10, h: 1.0, m: 0.5, shape: "disk" as const };
  assert.ok(close(minLoopHeight(params, "slide"), 1.0));
  assert.equal(canLoop(params, "slide"), true);
  assert.ok(close(speedFromHeight({ ...params, h: 1 }, 0.8, "slide"), Math.sqrt(4)));
});

test("a rolling sphere needs more height than a sliding block", () => {
  const params = { ...DEFAULT_LOOP, R: 0.4, g: 10, h: 1.2, shape: "solid-sphere" as const };
  assert.ok(minLoopHeight(params, "roll") > minLoopHeight(params, "slide"));
  assert.ok(canLoop({ ...params, h: minLoopHeight(params, "roll") }, "roll"));
  assert.equal(canLoop({ ...params, h: minLoopHeight(params, "slide") }, "roll"), false);
});

test("speed falls as the block climbs and N = m(v²/R + g cosφ)", () => {
  const params = { ...DEFAULT_LOOP, R: 0.4, g: 10, h: 1.4, m: 0.5, shape: "disk" as const };
  const bottom = sampleAt(params, 0, "slide");
  assert.ok(close(bottom.v, Math.sqrt(2 * 10 * 1.4), 1e-3));
  assert.ok(close(bottom.N, 0.5 * (bottom.v * bottom.v / 0.4 + 10), 0.05));
  const later = sampleAt(params, 0.2, "slide");
  assert.ok(later.y > bottom.y);
  assert.ok(later.v < bottom.v);
});

test("too little height leaves the track in the upper half", () => {
  const params = { ...DEFAULT_LOOP, R: 0.4, g: 10, h: 0.85, m: 0.5, shape: "disk" as const };
  assert.equal(canLoop(params, "slide"), false);
  const climb = sampleAt(params, 0.45, "slide");
  assert.ok(climb.left || climb.phi > Math.PI / 2);
});
