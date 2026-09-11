import assert from "node:assert/strict";
import { test } from "node:test";

import { acceleration, DEFAULT_ATWOOD, sampleAt, tension, timeToStop } from "./atwood-machine.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("Atwood acceleration is g Δm / (m1 + m2)", () => {
  const params = { m1: 1, m2: 3, g: 10, travel: 0.5 };
  assert.ok(close(acceleration(params), 5));
  assert.ok(close(tension(params), 15));
});

test("equal masses stay put, heavier mass 2 goes down", () => {
  const equal = sampleAt({ m1: 2, m2: 2, g: 9.81, travel: 0.4 }, 1);
  assert.ok(close(equal.s, 0));
  assert.ok(close(equal.a, 0));
  const moving = sampleAt(DEFAULT_ATWOOD, 0.2);
  assert.ok(moving.y2 < 0);
  assert.ok(moving.y1 > 0);
});

test("modified Atwood is driven only by the hanging weight", () => {
  const params = { m1: 2, m2: 1, g: 10, travel: 0.4, mu: 0 };
  assert.ok(close(acceleration(params, "modified"), 10 / 3));
  assert.ok(close(tension(params, "modified"), 1 * (10 - 10 / 3)));
  const withMu = { ...params, mu: 0.2 };
  assert.ok(close(acceleration(withMu, "modified"), (10 - 4) / 3));
});

test("modified Atwood stays put when hanging weight cannot beat static friction", () => {
  const params = { m1: 2, m2: 0.5, g: 10, travel: 0.4, mu: 0.2, muS: 0.4 };
  assert.ok(close(acceleration(params, "modified"), 0));
  const sample = sampleAt(params, 0.3, "modified");
  assert.equal(sample.frictionKind, "static");
  assert.ok(close(sample.f, 5));
});

test("modified Atwood uses kinetic friction once it slides", () => {
  const params = { m1: 2, m2: 1, g: 10, travel: 0.4, mu: 0.2, muS: 0.4 };
  assert.ok(close(acceleration(params, "modified"), (10 - 4) / 3));
  const sample = sampleAt(params, 0.1, "modified");
  assert.equal(sample.frictionKind, "kinetic");
  assert.ok(close(sample.f, 4));
});

test("motion stops after the travel limit", () => {
  const params = DEFAULT_ATWOOD;
  const end = sampleAt(params, timeToStop(params) + 4);
  assert.ok(close(Math.abs(end.s), params.travel, 1e-8));
  assert.ok(close(end.t, timeToStop(params)));
});

test("massive pulley slows Atwood by adding I/R² to the inertia", () => {
  const params = { m1: 1, m2: 3, g: 10, travel: 0.5, Mp: 2, Rp: 0.1 };
  const I = 0.5 * 2 * 0.1 * 0.1;
  const a = (10 * 2) / (1 + 3 + I / 0.01);
  assert.ok(close(acceleration(params, "pulley"), a));
  assert.ok(a < 5);
  const sample = sampleAt(params, 0.1, "pulley");
  assert.ok(close(sample.T1, params.m1 * (params.g + a)));
  assert.ok(close(sample.T, params.m2 * (params.g - a)));
  assert.ok(sample.T > sample.T1);
});
