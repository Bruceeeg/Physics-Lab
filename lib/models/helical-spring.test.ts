import assert from "node:assert/strict";
import { test } from "node:test";

import {
  coilSpring2D,
  helicalSpringAlongFrames,
  helicalSpringPoints,
  helixWire2D,
  zigzagSpring2D,
} from "./helical-spring.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

function coilTurns(points: [number, number, number][]) {
  const interior = points.slice(Math.floor(points.length * 0.12), Math.ceil(points.length * 0.88));
  let prev = Math.atan2(interior[0][2], interior[0][1]);
  let acc = 0;
  for (const point of interior.slice(1)) {
    let next = Math.atan2(point[2], point[1]);
    let delta = next - prev;
    if (delta > Math.PI) {
      delta -= 2 * Math.PI;
    }
    if (delta < -Math.PI) {
      delta += 2 * Math.PI;
    }
    acc += delta;
    prev = next;
  }
  return Math.abs(acc) / (2 * Math.PI);
}

test("a straight helix keeps a constant radius and a fixed coil count", () => {
  const points = helicalSpringPoints({
    start: [0, 0, 0],
    end: [1, 0, 0],
    coils: 8,
    radius: 0.05,
    pointsPerCoil: 16,
  });
  assert.ok(points.length > 40);
  assert.ok(close(points[0][0], 0, 1e-6));
  assert.ok(close(points[0][1], 0, 1e-6));
  assert.ok(close(points[points.length - 1][0], 1, 1e-6));
  const mid = points.slice(20, -20);
  for (const point of mid) {
    const radial = Math.hypot(point[1], point[2]);
    assert.ok(Math.abs(radial - 0.05) < 0.008, `radius ${radial}`);
  }
  const turns = coilTurns(points);
  assert.ok(turns > 5.5 && turns < 7.2, `turns=${turns}`);
});

test("shortening the ends packs the same coils closer together", () => {
  const long = helicalSpringPoints({
    start: [0, 0, 0],
    end: [1.2, 0, 0],
    coils: 8,
    radius: 0.04,
    pointsPerCoil: 12,
  });
  const packed = helicalSpringPoints({
    start: [0, 0, 0],
    end: [0.4, 0, 0],
    coils: 8,
    radius: 0.04,
    pointsPerCoil: 12,
  });
  assert.equal(long.length, packed.length);
  const longStep = long[8][0] - long[7][0];
  const packedStep = packed[8][0] - packed[7][0];
  assert.ok(packedStep < longStep * 0.5);
  const mid = packed[Math.floor(packed.length / 2)];
  assert.ok(Math.abs(Math.hypot(mid[1], mid[2]) - 0.04) < 0.01);
});

test("2D helix wire is a projected coil from hitch to hitch and packs when shortened", () => {
  const start = { x: 10, y: 50 };
  const longEnd = { x: 130, y: 50 };
  const shortEnd = { x: 46, y: 50 };
  const long = helixWire2D(start, longEnd, 8, 6);
  const packed = helixWire2D(start, shortEnd, 8, 6);
  assert.equal(long[0]?.x, 10);
  assert.equal(long[0]?.y, 50);
  assert.ok(close(long[long.length - 1]?.x ?? 0, 130, 1e-6));
  assert.ok(close(packed[packed.length - 1]?.x ?? 0, 46, 1e-6));
  assert.ok(long.length > 80);
  assert.equal(long.length, packed.length);
  const longPitch = (long[long.length - 1].x - long[0].x) / 8;
  const packedPitch = (packed[packed.length - 1].x - packed[0].x) / 8;
  assert.ok(packedPitch < longPitch * 0.4);
  const longAmp = Math.max(...long.map((point) => Math.abs(point.y - 50)));
  const packedAmp = Math.max(...packed.map((point) => Math.abs(point.y - 50)));
  assert.ok(longAmp > 4);
  assert.ok(packedAmp > 4);
  let crossings = 0;
  for (let index = 1; index < long.length; index += 1) {
    if ((long[index - 1].y - 50) * (long[index].y - 50) < 0) {
      crossings += 1;
    }
  }
  assert.ok(crossings >= 12);
});

test("2D zigzag spring runs straight from hitch to hitch and packs when shortened", () => {
  const start = { x: 10, y: 50 };
  const longEnd = { x: 130, y: 50 };
  const shortEnd = { x: 46, y: 50 };
  const long = zigzagSpring2D(start, longEnd, 6, 8);
  const packed = zigzagSpring2D(start, shortEnd, 6, 8);
  assert.equal(long[0]?.x, 10);
  assert.equal(long[0]?.y, 50);
  assert.equal(long[long.length - 1]?.x, 130);
  assert.equal(packed[packed.length - 1]?.x, 46);
  const longSpan = long[4].x - long[3].x;
  const packedSpan = packed[4].x - packed[3].x;
  assert.ok(packedSpan < longSpan * 0.55);
  const longAmp = Math.max(...long.map((point) => Math.abs(point.y - 50)));
  const packedAmp = Math.max(...packed.map((point) => Math.abs(point.y - 50)));
  assert.ok(longAmp > 4);
  assert.ok(packedAmp > 2);
});

test("a bent centerline keeps the coil offset in the supplied normal", () => {
  const frames = [
    { point: [0, 0.2, 0] as [number, number, number], tangent: [1, 0, 0] as [number, number, number], normal: [0, 1, 0] as [number, number, number] },
    { point: [0.5, 0.2, 0] as [number, number, number], tangent: [1, 0, 0] as [number, number, number], normal: [0, 1, 0] as [number, number, number] },
    { point: [1, 0.4, 0] as [number, number, number], tangent: [0.8, 0.6, 0] as [number, number, number], normal: [-0.6, 0.8, 0] as [number, number, number] },
  ];
  const points = helicalSpringAlongFrames(frames, 2, 0.05);
  assert.equal(points.length, 3);
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const point = points[index];
    const along = (point[0] - frame.point[0]) * frame.tangent[0] + (point[1] - frame.point[1]) * frame.tangent[1];
    assert.ok(Math.abs(along) < 1e-8);
  }
});

test("2D coil loops sit on the wall-to-cart line and pack when the spring shortens", () => {
  const start = { x: 10, y: 50 };
  const longEnd = { x: 130, y: 50 };
  const shortEnd = { x: 46, y: 50 };
  const long = coilSpring2D(start, longEnd, 8, 5);
  const packed = coilSpring2D(start, shortEnd, 8, 5);
  assert.equal(long.loops.length, 8);
  assert.equal(packed.loops.length, 8);
  assert.ok(close(long.hooks[0][0].x, 10));
  assert.ok(close(long.hooks[1][1].x, 130));
  for (const loop of long.loops) {
    assert.ok(loop.cx > 10 && loop.cx < 130);
    assert.ok(close(loop.cy, 50));
    assert.ok(close(loop.angle, 0));
  }
  assert.ok(packed.loops[0].rx < long.loops[0].rx);
  const longPitch = long.loops[1].cx - long.loops[0].cx;
  const packedPitch = packed.loops[1].cx - packed.loops[0].cx;
  assert.ok(packedPitch < longPitch * 0.45);
});
