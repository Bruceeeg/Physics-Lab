import assert from "node:assert/strict";
import { test } from "node:test";

import { derive, initialState } from "./pull-friction.ts";
import { FORCE_COLORS, forceMarks } from "./force-display.ts";

const rest = initialState();

function names(marks: ReturnType<typeof forceMarks>) {
  return marks.map((mark) => mark.name);
}

test("oblique pull shows solid F and dashed Fx Fz", () => {
  const derived = derive(
    { F: 20, thetaDeg: 30, m: 2, muS: 0.4, muK: 0.3, g: 9.81 },
    rest,
  );
  const marks = forceMarks(derived);
  const byName = Object.fromEntries(marks.map((mark) => [mark.name, mark]));
  assert.deepEqual(names(marks).sort(), ["F", "Fx", "Fz", "G", "N", "f"].sort());
  assert.equal(byName.F.style, "solid");
  assert.equal(byName.Fx.style, "dashed");
  assert.equal(byName.Fz.style, "dashed");
  assert.equal(byName.G.style, "solid");
  assert.equal(byName.N.style, "solid");
  assert.equal(byName.f.style, "solid");
  assert.equal(byName.F.color, FORCE_COLORS.F);
  assert.equal(byName.Fx.color, FORCE_COLORS.Fdash);
  assert.equal(byName.Fz.color, FORCE_COLORS.Fdash);
  assert.equal(byName.G.color, FORCE_COLORS.G);
  assert.equal(byName.N.color, FORCE_COLORS.N);
  assert.equal(byName.f.color, FORCE_COLORS.f);
  assert.ok(Math.abs(byName.F.magnitude - 20) < 1e-9);
  assert.ok(Math.abs(byName.Fx.magnitude - derived.forces.Fx) < 1e-9);
  assert.ok(Math.abs(byName.Fz.magnitude - derived.forces.Fz) < 1e-9);
});

test("horizontal pull hides Fz dashed component", () => {
  const derived = derive(
    { F: 10, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 9.81 },
    rest,
  );
  const marks = forceMarks(derived);
  assert.ok(names(marks).includes("F"));
  assert.ok(names(marks).includes("Fx"));
  assert.ok(!names(marks).includes("Fz"));
});

test("zero pull hides F family", () => {
  const derived = derive(
    { F: 0, thetaDeg: 30, m: 2, muS: 0.4, muK: 0.3, g: 9.81 },
    rest,
  );
  const marks = forceMarks(derived);
  assert.ok(!names(marks).includes("F"));
  assert.ok(!names(marks).includes("Fx"));
  assert.ok(!names(marks).includes("Fz"));
  assert.ok(names(marks).includes("G"));
});

test("liftoff hides N and f but keeps F components", () => {
  const derived = derive(
    { F: 30, thetaDeg: 80, m: 1, muS: 0.2, muK: 0.1, g: 10 },
    rest,
  );
  const marks = forceMarks(derived);
  assert.equal(derived.forces.N, 0);
  assert.ok(names(marks).includes("F"));
  assert.ok(names(marks).includes("Fx"));
  assert.ok(names(marks).includes("Fz"));
  assert.ok(!names(marks).includes("N"));
  assert.ok(!names(marks).includes("f"));
});

test("same-direction vertical forces offset a little from center", () => {
  const derived = derive(
    { F: 20, thetaDeg: 30, m: 2, muS: 0.4, muK: 0.3, g: 9.81 },
    rest,
  );
  const marks = forceMarks(derived);
  const byName = Object.fromEntries(marks.map((mark) => [mark.name, mark]));
  assert.deepEqual(byName.G.offset, [0, 0, 0]);
  assert.deepEqual(byName.F.offset, [0, 0, 0]);
  const gap = Math.hypot(
    byName.Fz.offset[0] - byName.N.offset[0],
    byName.Fz.offset[1] - byName.N.offset[1],
    byName.Fz.offset[2] - byName.N.offset[2],
  );
  assert.ok(gap > 0.014);
  assert.ok(gap < 0.016);
  for (const mark of [byName.Fz, byName.N]) {
    const along =
      mark.offset[0] * mark.vector[0] +
      mark.offset[1] * mark.vector[1] +
      mark.offset[2] * mark.vector[2];
    assert.ok(Math.abs(along) < 1e-9);
    assert.ok(Math.hypot(...mark.offset) < 0.008);
  }
});

test("horizontal F and Fx sit slightly apart", () => {
  const derived = derive(
    { F: 10, thetaDeg: 0, m: 2, muS: 0, muK: 0, g: 9.81 },
    rest,
  );
  const marks = forceMarks(derived);
  const pull = marks.find((mark) => mark.name === "F");
  const horizontal = marks.find((mark) => mark.name === "Fx");
  assert.ok(pull);
  assert.ok(horizontal);
  const gap = Math.hypot(
    pull.offset[0] - horizontal.offset[0],
    pull.offset[1] - horizontal.offset[1],
    pull.offset[2] - horizontal.offset[2],
  );
  assert.ok(gap > 0.014);
  assert.ok(gap < 0.016);
});

