import assert from "node:assert/strict";
import { test } from "node:test";

import {
  C_EM_CED_UNITS,
  C_MECH_CED_UNITS,
  COURSE_SECTIONS,
  P1_CED_UNITS,
  P2_CED_UNITS,
  clusterByCEmUnit,
  clusterByCMechUnit,
  clusterByP1Unit,
  clusterByP2Unit,
  experimentCourses,
  experimentHref,
  experimentUnit,
  getExperiment,
  isReadyExperiment,
  listCatalogGroups,
  listExperimentSlugs,
  listExperiments,
  parseCourseFilter,
} from "./catalog.ts";

const P1_READY = [
  "linear-motion",
  "projectile-motion",
  "pull-friction",
  "incline-friction",
  "atwood-machine",
  "circular-motion",
  "conservation-of-energy",
  "impulse-momentum",
  "torque-equilibrium",
  "rotational-motion",
  "angular-momentum",
  "harmonic-motion",
  "fluid-dynamics",
  "archimedes",
];

const C_MECH_READY = [
  "linear-motion",
  "projectile-motion",
  "pull-friction",
  "incline-friction",
  "atwood-machine",
  "circular-motion",
  "conservation-of-energy",
  "impulse-momentum",
  "torque-equilibrium",
  "rotational-motion",
  "angular-momentum",
  "harmonic-motion",
  "rotational-inertia",
  "rotation-n2",
  "ballistic-pendulum",
  "physical-pendulum",
];

const C_EM_READY = [
  "electric-field",
  "resistor-circuits",
  "rc-circuits",
  "magnetism",
  "electromagnetic-induction",
  "equipotential",
  "coulombs-law",
  "capacitance",
  "rl-circuits",
  "solenoid",
];

const P2_READY = [
  "boyles-law",
  "thermal-conductivity",
  "electric-field",
  "resistor-circuits",
  "rc-circuits",
  "magnetism",
  "electromagnetic-induction",
  "geometric-optics",
  "waves-optics",
  "particle-model-of-light",
];

const C_UNIQUE = [
  "rotational-inertia",
  "rotation-n2",
  "ballistic-pendulum",
  "physical-pendulum",
  "equipotential",
  "coulombs-law",
  "capacitance",
  "rl-circuits",
  "solenoid",
];

test("exposes four AP course sections without inquiry or site-status groups", () => {
  assert.deepEqual(
    COURSE_SECTIONS.map((section) => section.id),
    ["p1", "p2", "c-mech", "c-em"],
  );
  assert.equal(
    COURSE_SECTIONS.some((section) => /官方|本站/.test(section.title)),
    false,
  );
});

test("lists Physics 1 labs in CED unit order", () => {
  const p1 = listExperiments("p1");
  assert.deepEqual(
    p1.filter((item) => item.status === "ready").map((item) => item.slug),
    P1_READY,
  );
  assert.ok(p1.every((item) => item.status === "ready"));
  assert.equal(p1[0]?.slug, "linear-motion");
});

test("Physics 1 unit labels match the eight CED units", () => {
  const titles = new Set(P1_CED_UNITS.map((unit) => unit.title));
  const p1 = listExperiments("p1");
  assert.equal(P1_CED_UNITS.length, 8);
  assert.ok(p1.every((item) => titles.has(item.unit)));
  const clustered = clusterByP1Unit(p1);
  assert.deepEqual(
    clustered.flatMap((group) => group.experiments.map((item) => item.slug)),
    P1_READY,
  );
});

test("lists Physics 2 labs in CED unit order", () => {
  const p2 = listExperiments("p2");
  assert.deepEqual(
    p2.filter((item) => item.status === "ready").map((item) => item.slug),
    P2_READY,
  );
  assert.ok(p2.every((item) => item.status === "ready"));
  assert.equal(p2[0]?.slug, "boyles-law");
});

test("Physics 2 unit labels match the seven CED units", () => {
  const titles = new Set(P2_CED_UNITS.map((unit) => unit.title));
  const p2 = listExperiments("p2");
  assert.equal(P2_CED_UNITS.length, 7);
  assert.ok(p2.every((item) => titles.has(item.unit)));
  const clustered = clusterByP2Unit(p2);
  assert.deepEqual(
    clustered.flatMap((group) => group.experiments.map((item) => item.slug)),
    P2_READY,
  );
});

test("only ready labs have detail routes", () => {
  assert.deepEqual(listExperimentSlugs(), [...P1_READY, ...P2_READY, ...C_UNIQUE]);
  assert.equal(
    listExperiments("all").some((item) => item.status === "pending"),
    false,
  );
  assert.equal(isReadyExperiment(getExperiment("solenoid")!), true);
});

test("filters by AP course and lists overlapping labs in Physics C", () => {
  const p2 = listExperiments("p2");
  assert.ok(p2.length > 0);
  assert.ok(p2.every((item) => item.course === "p2"));
  const mechanics = listExperiments("c-mech");
  assert.deepEqual(
    mechanics.map((item) => item.slug),
    C_MECH_READY,
  );
  assert.ok(mechanics.every((item) => experimentCourses(item).includes("c-mech")));
  assert.ok(experimentCourses(getExperiment("atwood-machine")!).includes("c-mech"));
  assert.equal(experimentCourses(getExperiment("fluid-dynamics")!).includes("c-mech"), false);
  const em = listExperiments("c-em");
  assert.deepEqual(
    em.map((item) => item.slug),
    C_EM_READY,
  );
});

test("Physics C unit labels match the CED units", () => {
  assert.equal(C_MECH_CED_UNITS.length, 7);
  assert.equal(C_EM_CED_UNITS.length, 6);
  const mechanics = listExperiments("c-mech");
  const mechTitles = new Set(C_MECH_CED_UNITS.map((unit) => unit.title));
  assert.ok(mechanics.every((item) => mechTitles.has(item.unit)));
  const clusteredMech = clusterByCMechUnit(mechanics);
  assert.deepEqual(
    clusteredMech.flatMap((group) => group.experiments.map((item) => item.slug)),
    [
      "linear-motion",
      "projectile-motion",
      "pull-friction",
      "incline-friction",
      "atwood-machine",
      "circular-motion",
      "conservation-of-energy",
      "impulse-momentum",
      "ballistic-pendulum",
      "torque-equilibrium",
      "rotational-inertia",
      "rotation-n2",
      "rotational-motion",
      "angular-momentum",
      "harmonic-motion",
      "physical-pendulum",
    ],
  );
  const em = listExperiments("c-em");
  const emTitles = new Set(C_EM_CED_UNITS.map((unit) => unit.title));
  assert.ok(em.every((item) => emTitles.has(item.unit)));
  assert.equal(experimentUnit(getExperiment("electric-field")!, "c-em"), "Unit 8 电荷、电场与高斯定理");
  assert.equal(experimentUnit(getExperiment("electromagnetic-induction")!, "c-em"), "Unit 13 电磁感应");
  const clusteredEm = clusterByCEmUnit(em);
  assert.deepEqual(
    clusteredEm.flatMap((group) => group.experiments.map((item) => item.slug)),
    [
      "electric-field",
      "coulombs-law",
      "equipotential",
      "capacitance",
      "resistor-circuits",
      "rc-circuits",
      "magnetism",
      "solenoid",
      "electromagnetic-induction",
      "rl-circuits",
    ],
  );
});

test("groups the full catalog by course", () => {
  const groups = listCatalogGroups("all");
  assert.deepEqual(
    groups.map((group) => group.course),
    ["p1", "p2", "c-mech", "c-em"],
  );
  assert.ok(groups.every((group) => group.experiments.length > 0));
  const onlyEm = listCatalogGroups("c-em");
  assert.equal(onlyEm.length, 1);
  assert.equal(onlyEm[0]?.course, "c-em");
});

test("looks up ready and pending experiments by slug", () => {
  const found = getExperiment("pull-friction");
  assert.equal(found?.title, "斜向拉力实验台");
  assert.equal(found?.formula, "N = mg − |F|sinθ");
  assert.equal(found?.course, "p1");
  assert.equal(found?.status, "ready");
  assert.equal(getExperiment("circular-motion")?.status, "ready");
  assert.equal(getExperiment("torque-equilibrium")?.unit, "Unit 5 力矩与转动动力学");
  assert.equal(getExperiment("projectile-motion")?.formula, "x = (v₀ cosθ) t");
  assert.equal(getExperiment("boyles-law")?.status, "ready");
  assert.equal(getExperiment("boyles-law")?.course, "p2");
  assert.equal(getExperiment("rc-circuits")?.formula, "τ = RC");
  assert.equal(getExperiment("physical-pendulum")?.status, "ready");
  assert.equal(getExperiment("solenoid")?.course, "c-em");
  assert.equal(getExperiment("c-atwood"), undefined);
  assert.equal(getExperiment("no-such-lab"), undefined);
});

test("builds the lab detail href for ready slugs", () => {
  assert.equal(experimentHref("linear-motion"), "/labs/linear-motion");
});

test("parses course filter values", () => {
  assert.equal(parseCourseFilter(undefined), "all");
  assert.equal(parseCourseFilter("p1"), "p1");
  assert.equal(parseCourseFilter("c-em"), "c-em");
  assert.equal(parseCourseFilter("mechanics"), "all");
  assert.equal(parseCourseFilter("官方探究"), "all");
});
