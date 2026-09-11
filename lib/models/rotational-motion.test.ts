import assert from "node:assert/strict";
import { test } from "node:test";

import {
  accel,
  kappa,
  sampleAt,
  speedAtBottom,
  timeToBottom,
} from "./rotational-motion.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("bottom speed is √(2mgh / (m + I/r²))", () => {
  const params = {
    shape: "disk" as const,
    m: 0.8,
    r: 0.08,
    h: 0.6,
    thetaDeg: 30,
    g: 10,
  };
  const expected = Math.sqrt((2 * params.g * params.h) / (1 + kappa("disk")));
  assert.ok(close(speedAtBottom(params), expected));
  const landing = sampleAt(params, timeToBottom(params));
  assert.ok(close(landing.v, expected));
  assert.ok(close(landing.y, 0, 1e-9));
  assert.equal(landing.landed, true);
});

test("hoop is slower than a disk from the same height, sphere is faster", () => {
  const base = { m: 1, r: 0.1, h: 0.5, thetaDeg: 20, g: 9.81 };
  const hoop = speedAtBottom({ ...base, shape: "hoop" });
  const disk = speedAtBottom({ ...base, shape: "disk" });
  const sphere = speedAtBottom({ ...base, shape: "solid-sphere" });
  assert.ok(hoop < disk);
  assert.ok(disk < sphere);
});

test("a sliding block is faster than a rolling disk from the same height", () => {
  const base = { shape: "disk" as const, m: 1, r: 0.1, h: 0.5, thetaDeg: 20, g: 10 };
  const slide = speedAtBottom({ ...base, contact: "slide" });
  const roll = speedAtBottom({ ...base, contact: "roll" });
  assert.ok(close(slide, Math.sqrt(10)));
  assert.ok(slide > roll);
  const end = sampleAt({ ...base, contact: "slide" }, timeToBottom({ ...base, contact: "slide" }));
  assert.ok(close(end.Krot, 0));
  assert.ok(close(end.omega, 0));
});

test("translational plus rotational KE equals the lost gravitational PE", () => {
  const params = {
    shape: "solid-sphere" as const,
    m: 1,
    r: 0.1,
    h: 0.4,
    thetaDeg: 25,
    g: 9.81,
  };
  const start = sampleAt(params, 0);
  const end = sampleAt(params, timeToBottom(params));
  assert.ok(close(start.E, end.E, 1e-8));
  assert.ok(close(end.Ktrans + end.Krot, start.Ug - end.Ug, 1e-8));
});

test("rolling uses static friction and splits acceleration in the lab frame", () => {
  const params = {
    shape: "disk" as const,
    m: 1,
    r: 0.1,
    h: 0.5,
    thetaDeg: 30,
    g: 10,
  };
  const mid = sampleAt(params, timeToBottom(params) * 0.4);
  const theta = Math.PI / 6;
  const a = accel(params);
  assert.equal(mid.frictionKind, "static");
  assert.ok(mid.f > 0);
  assert.ok(close(mid.ax, a * Math.cos(theta)));
  assert.ok(close(mid.ay, -a * Math.sin(theta)));
  const slide = sampleAt({ ...params, contact: "slide" }, 0.1);
  assert.equal(slide.frictionKind, "none");
  assert.ok(close(slide.f, 0));
});
