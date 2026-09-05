import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COURSE_SECTIONS,
  experimentHref,
  getExperiment,
  isReadyExperiment,
  listCatalogGroups,
  listExperimentSlugs,
  listExperiments,
  parseCourseFilter,
} from "./catalog.ts";

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

test("lists ready labs first within Physics 1", () => {
  const p1 = listExperiments("p1");
  assert.deepEqual(
    p1.filter((item) => item.status === "ready").map((item) => item.slug),
    ["pull-friction", "linear-motion"],
  );
  assert.equal(p1[0]?.slug, "pull-friction");
  assert.equal(p1[1]?.slug, "linear-motion");
});

test("only ready labs have detail routes", () => {
  assert.deepEqual(listExperimentSlugs(), ["pull-friction", "linear-motion"]);
  const pending = listExperiments("all").find((item) => item.status === "pending");
  assert.ok(pending);
  assert.equal(isReadyExperiment(pending), false);
});

test("filters by AP course", () => {
  const p2 = listExperiments("p2");
  assert.ok(p2.length > 0);
  assert.ok(p2.every((item) => item.course === "p2"));
  const mechanics = listExperiments("c-mech");
  assert.ok(mechanics.every((item) => item.course === "c-mech"));
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
  assert.equal(getExperiment("circular-motion")?.status, "pending");
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
