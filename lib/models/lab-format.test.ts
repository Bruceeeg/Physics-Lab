import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatLabNumber,
  formatLabSci,
  formatLabSigned,
  frictionForceLabel,
  frictionForceTitle,
} from "./lab-format.ts";

test("finite values keep two decimal places", () => {
  assert.equal(formatLabNumber(9.81), "9.81");
  assert.equal(formatLabNumber(4), "4.00");
  assert.equal(formatLabNumber(-2.5), "-2.50");
});

test("near-zero and non-finite values become display tokens", () => {
  assert.equal(formatLabNumber(0.004), "0.00");
  assert.equal(formatLabNumber(Number.NaN), "—");
  assert.equal(formatLabNumber(Number.POSITIVE_INFINITY), "—");
});

test("signed formatter keeps a plus for positive components", () => {
  assert.equal(formatLabSigned(1.2), "+1.20");
  assert.equal(formatLabSigned(-0.3), "-0.30");
  assert.equal(formatLabSigned(0.001), "0.00");
});

test("scientific formatter keeps small physical constants readable", () => {
  assert.equal(formatLabSci(2e-5), "2.00×10^-5");
  assert.equal(formatLabSci(4.5e5), "4.50×10^5");
  assert.equal(formatLabSci(12.5), "12.50");
});

test("friction labels follow the contact state", () => {
  assert.equal(frictionForceLabel("static"), "fs");
  assert.equal(frictionForceLabel("kinetic"), "fk");
  assert.equal(frictionForceTitle("static"), "静摩擦力 fs");
  assert.equal(frictionForceTitle("kinetic"), "滑动摩擦力 fk");
});
