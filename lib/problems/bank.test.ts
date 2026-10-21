import assert from "node:assert/strict";
import { test } from "node:test";

import { listExperimentSlugs } from "../experiments/catalog.ts";
import { AP_PROBLEMS } from "./bank.ts";
import { grade } from "./check.ts";
import { expectKind } from "./oracle.ts";
import { solveKind } from "./solve.ts";
import type { Kind } from "./types.ts";

test("every AP problem matches an independent formula", () => {
  const slugs = new Set(listExperimentSlugs());
  const ids = new Set<string>();
  const failures: string[] = [];
  for (const problem of AP_PROBLEMS) {
    assert.equal(ids.has(problem.id), false, problem.id);
    ids.add(problem.id);
    assert.equal(slugs.has(problem.slug as never), true, `${problem.id} -> ${problem.slug}`);
    assert.equal(/\p{Script=Han}/u.test(`${problem.title} ${problem.ask}`), false, problem.id);
    assert.match(problem.ask, /\b(Calculate|Determine)\b/, problem.id);
    const result = grade(problem);
    for (const row of result.rows) {
      assert.equal(/\p{Script=Han}/u.test(row.label), false, `${problem.id} ${row.label}`);
    }
    if (!result.ok) {
      const detail = result.rows
        .map((row) => `${row.label} lab=${row.value} formula=${row.expected}`)
        .join("; ");
      failures.push(`${problem.id} ${detail}`);
    }
  }
  assert.deepEqual(failures, []);
  assert.ok(AP_PROBLEMS.length >= 160);
});

test("unused formulas still agree on their default numbers", () => {
  const used = new Set(AP_PROBLEMS.map((problem) => problem.kind));
  const extras: Kind[] = [
    "conical",
    "horizontal-circle",
    "vertical-circle",
    "freq-ratio",
    "pendulum-t",
    "drag",
  ];
  for (const kind of extras) {
    if (used.has(kind) && kind !== "drag") {
      continue;
    }
    const answers = solveKind(kind, { quad: kind === "drag" ? 1 : 0, g: 9.8 });
    const expected = expectKind(kind, { quad: kind === "drag" ? 1 : 0, g: 9.8 });
    assert.equal(answers.length, expected.length, kind);
    answers.forEach((answer, index) => {
      const target = expected[index] ?? Number.NaN;
      const scale = Math.max(1, Math.abs(answer.value), Math.abs(target));
      assert.ok(Math.abs(answer.value - target) <= 1e-4 * scale + 1e-8, kind);
    });
  }
});
