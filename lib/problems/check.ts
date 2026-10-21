import { oracle } from "./oracle.ts";
import { solve } from "./solve.ts";
import type { Problem } from "./types.ts";

export function agrees(actual: number, expected: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
    return false;
  }
  const scale = Math.max(1, Math.abs(actual), Math.abs(expected));
  return Math.abs(actual - expected) <= 1e-4 * scale + 1e-8;
}

export function grade(problem: Problem) {
  const answers = solve(problem);
  const expected = oracle(problem);
  const rows = answers.map((answer, index) => {
    const target = expected[index] ?? Number.NaN;
    return { ...answer, expected: target, ok: agrees(answer.value, target) };
  });
  return {
    ok: rows.length > 0 && rows.length === expected.length && rows.every((row) => row.ok),
    rows,
  };
}
