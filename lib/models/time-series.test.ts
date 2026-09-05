import assert from "node:assert/strict";
import { test } from "node:test";

import { appendTimeSample } from "./time-series.ts";

type Point = { t: number; v: number };

test("appendTimeSample replaces a same-time endpoint, throttles, and compacts", () => {
  let series: Point[] = [];
  series = appendTimeSample(series, { t: 0, v: 0 });
  series = appendTimeSample(series, { t: 0.00001, v: 1 });
  assert.deepEqual(series, [{ t: 0.00001, v: 1 }]);
  series = appendTimeSample(series, { t: 0.01, v: 2 });
  assert.equal(series.length, 1);
  series = appendTimeSample(series, { t: 0.05, v: 3 });
  assert.equal(series.length, 2);
  for (let index = 1; index <= 2000; index += 1) {
    series = appendTimeSample(series, { t: index, v: index }, 0);
  }
  assert.equal(series[0].t, 0.00001);
  assert.equal(series[series.length - 1].t, 2000);
  assert.ok(series.length <= 800);
});
