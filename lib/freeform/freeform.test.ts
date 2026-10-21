import assert from "node:assert/strict";
import { test } from "node:test";

import { recommendParts, searchParts, createPart } from "./catalog.ts";
import { forceComponents, torqueFromOffset } from "./forces.ts";
import { addPart, isCanonical, presetFor, removePart } from "./scene.ts";
import { advanceSandbox, createSandbox, evaluate } from "./sandbox.ts";
import { listExperimentSlugs } from "../experiments/catalog.ts";
import type { SceneDocument } from "./types.ts";

test("force components use lab axes", () => {
  const horizontal = forceComponents(10, 0, 0);
  assert.ok(Math.abs(horizontal.x - 10) < 1e-9);
  assert.ok(Math.abs(horizontal.y) < 1e-9);
  const up = forceComponents(10, 90, 0);
  assert.ok(Math.abs(up.y - 10) < 1e-9);
  const depth = forceComponents(10, 0, 90);
  assert.ok(Math.abs(depth.z - 10) < 1e-9);
});

test("offset force produces a torque", () => {
  const torque = torqueFromOffset({ x: 0, y: 0.2, z: 0 }, { x: 10, y: 0, z: 0 });
  assert.ok(Math.abs(torque.z + 2) < 1e-9);
});

test("custom force changes acceleration and keeps integrating", () => {
  const scene = sceneOf(block(2), force(10, "b"));
  const state = createSandbox(scene);
  const sample = evaluate(scene, state);
  assert.ok(Math.abs(sample.ax - 5) < 1e-9);
  assert.ok(Math.abs(sample.torque - 1.5) < 1e-9);
  const moved = advanceSandbox(scene, state, 0.2);
  const primary = moved.bodies[0];
  assert.ok(primary);
  assert.ok(Math.abs(primary.vx - 1) < 0.02);
  assert.ok(Math.abs(primary.x - 0.1) < 0.02);
});

test("a world force misses when it does not touch a body", () => {
  const applied = force(8, "b");
  applied.attach = "world";
  applied.x = 3;
  applied.y = 3;
  const sample = evaluate(sceneOf(block(1), applied), createSandbox(sceneOf(block(1), applied)));
  assert.equal(sample.ax, 0);
  assert.match(sample.notice, /没有作用在物体上/);
});

test("like charges push the bodies apart and stay finite when overlapping", () => {
  const left = block(1);
  left.charge = 1e-6;
  const right = block(1);
  right.id = "c";
  right.charge = 1e-6;
  right.x = 0.5;
  const scene = sceneOf(left, right);
  const sample = evaluate(scene, createSandbox(scene));
  assert.ok(sample.ax < 0);
  assert.ok(Math.abs(sample.ax + 0.03595) < 0.002);

  left.x = 0;
  right.x = 0;
  const crowded = evaluate(sceneOf(left, right), createSandbox(sceneOf(left, right)));
  assert.ok(Number.isFinite(crowded.ax));
  assert.match(crowded.notice, /库仑力已限制/);
});

test("a lens does not push a block", () => {
  const lens = createPart("lens-convex", "lens");
  lens.x = 0.5;
  const lamp = createPart("lamp", "lamp");
  lamp.x = -0.3;
  const scene = sceneOf(block(1), lens, lamp);
  const sample = evaluate(scene, createSandbox(scene));
  assert.equal(sample.ax, 0);
  assert.equal(sample.ay, 0);
  assert.ok(sample.imageDistance !== null);
});

test("search finds every catalog part and themes the empty query", () => {
  const themed = searchParts("", "incline-friction");
  assert.equal(themed.length, 8);
  assert.equal(themed[0]?.type, "incline");
  const lenses = searchParts("透镜", "incline-friction");
  assert.ok(lenses.some((entry) => entry.type === "lens-convex"));
  assert.ok(lenses.some((entry) => entry.type === "lens-concave"));
  assert.equal(searchParts("没有这种零件xyz", "incline-friction").length, 0);
  assert.equal(recommendParts("geometric-optics")[0]?.type, "lens-convex");
});

test("presets stay canonical until a part is added", () => {
  for (const slug of listExperimentSlugs()) {
    const preset = presetFor(slug);
    assert.ok(preset.parts.length > 0);
    assert.equal(isCanonical(preset, preset), true);
    assert.equal(recommendParts(slug).length, 8);
    const added = addPart(preset, "lens-convex");
    assert.equal(isCanonical(added, preset), false);
    const removed = removePart(added, added.parts.at(-1)?.id ?? "");
    assert.equal(isCanonical(removed, preset), true);
  }
});

function block(mass: number) {
  const part = createPart("block", "b");
  part.mass = mass;
  part.x = 0;
  part.y = 0;
  part.z = 0;
  return part;
}

function force(magnitude: number, anchorId: string) {
  const part = createPart("custom-force", "f");
  part.magnitude = magnitude;
  part.thetaDeg = 0;
  part.phiDeg = 0;
  part.attach = "body";
  part.anchorId = anchorId;
  part.x = 0;
  part.y = 0.15;
  part.z = 0;
  return part;
}

function sceneOf(...parts: SceneDocument["parts"]): SceneDocument {
  return { slug: "test", parts };
}
