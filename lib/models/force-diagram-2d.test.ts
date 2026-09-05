import assert from "node:assert/strict";
import { test } from "node:test";

import { forceDiagram2D } from "./force-diagram-2d.ts";
import { derive, initialState, type PullParams } from "./pull-friction.ts";

const rest = initialState();
const oblique: PullParams = {
  F: 20,
  thetaDeg: 30,
  m: 2,
  muS: 0.4,
  muK: 0.3,
  g: 9.81,
};

function arrow(diagram: ReturnType<typeof forceDiagram2D>, name: string) {
  const found = diagram.arrows.find((item) => item.name === name);
  assert.ok(found, `missing arrow ${name}`);
  return found;
}

function length(item: { x1: number; y1: number; x2: number; y2: number }) {
  return Math.hypot(item.x2 - item.x1, item.y2 - item.y1);
}

test("grounded block sits on the ground line", () => {
  const diagram = forceDiagram2D(derive(oblique, rest), 0);
  assert.equal(diagram.block.y + diagram.block.height, diagram.groundY);
});

test("block is centered in a compact frame", () => {
  const diagram = forceDiagram2D(derive(oblique, rest), 0);
  assert.equal(diagram.origin.x, diagram.width / 2);
  assert.ok(Math.abs(diagram.origin.y - diagram.height / 2) <= 2);
  assert.ok(diagram.width <= 140);
  assert.ok(diagram.height <= 84);
  assert.ok(diagram.groundFill <= 10);
});

test("airborne block lifts off the ground", () => {
  const diagram = forceDiagram2D(derive(oblique, rest), 0.5);
  assert.ok(diagram.block.y + diagram.block.height < diagram.groundY - 6);
});

test("oblique pull draws the same force set as the 3D marks", () => {
  const diagram = forceDiagram2D(derive(oblique, rest), 0);
  assert.deepEqual(
    diagram.arrows.map((item) => item.name).sort(),
    ["F", "Fx", "Fz", "G", "N", "f"].sort(),
  );
  assert.equal(arrow(diagram, "Fx").dashed, true);
  assert.equal(arrow(diagram, "F").dashed, false);
});

test("weight points down and pull points up-right", () => {
  const diagram = forceDiagram2D(derive(oblique, rest), 0);
  const weight = arrow(diagram, "G");
  const pull = arrow(diagram, "F");
  assert.ok(weight.y2 > weight.y1);
  assert.ok(pull.x2 > pull.x1);
  assert.ok(pull.y2 < pull.y1);
});

test("liftoff hides support and friction arrows", () => {
  const derived = derive(
    { F: 30, thetaDeg: 80, m: 1, muS: 0.2, muK: 0.1, g: 10 },
    rest,
  );
  const names = forceDiagram2D(derived, 0).arrows.map((item) => item.name);
  assert.ok(names.includes("F"));
  assert.ok(!names.includes("N"));
  assert.ok(!names.includes("f"));
});

test("stronger pull draws a longer F arrow", () => {
  const mild = forceDiagram2D(derive({ ...oblique, F: 8 }, rest), 0);
  const hard = forceDiagram2D(derive({ ...oblique, F: 40 }, rest), 0);
  assert.ok(length(arrow(hard, "F")) > length(arrow(mild, "F")) + 8);
});
