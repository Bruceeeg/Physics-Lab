# 抛体落点实验台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/labs/projectile-motion` 抛体落点实验台，含「参数实验」与「预测落点」两种模式，顶栏分段按钮切换，3D 视口与图表共用。

**Architecture:** 抛体运动学与 B 模式状态机都是 `lib/models` 下的纯函数，node test 覆盖。一个 `ProjectileLab` 客户端组件持有 `mode`、时钟和飞行数据，左栏按模式渲染参数面板或预测面板，右栏按「是否揭示」渲染四张图或测量板。R3F 场景只接 props 画图，不含物理。

**Tech Stack:** Next.js 16.3、React 19、TypeScript 6、Tailwind CSS 4、@react-three/fiber 9、@react-three/drei 10、three 0.185、Node test runner (`node --test --experimental-strip-types`)。

**Spec:** `docs/superpowers/specs/2026-09-05-projectile-lab-design.md`

## Global Constraints

- 桌面 1366x768 两种模式都不得出现文档级滚动；小屏沿用 `.lab-shell` 现有滚动回退。
- 坐标：x 水平、y 竖直向上；three.js 直接用 y 向上，不做 z 映射。
- 任何参数变化（滑条或数字输入）先暂停并重置到 t = 0，再套用新参数。
- t 到落地时间自动暂停。
- B 模式 `measure` / `predict` 阶段：顶栏 |v| 显示「—」，右栏显示测量板而非图表，3D 不画速度箭头，相机取景用 v₀ = 8.00 m/s。
- 颜色沿用现有实验台：navy `#1E3A5F`、gold `#A16207`、blue `#2563EB`、light blue `#60A5FA`、green `#047857`、violet `#6D28D9`、amber `#B45309`、slate `#3D5A80`、red `#DC2626`。圆角 2px，细线，无阴影。
- 不新增运行时依赖。
- 工作区里有大量与本任务无关的未提交改动，每次提交只 `git add` 本任务列出的文件。
- 不修改 `components/pull-friction-scene.tsx`、`components/pull-friction-lab.tsx`、`components/linear-motion-lab.tsx`。

---

### Task 1: 抛体运动学模型

**Files:**
- Create: `lib/models/projectile.ts`
- Create: `lib/models/projectile.test.ts`

**Interfaces:**
- Produces: `ProjectileParams = { v0; thetaDeg; h; g }`，`ProjectileSample = { t; x; y; vx; vy }`
- Produces: `flightTime(params)`, `range(params)`, `apexHeight(params)`, `sampleAt(params, t)`, `trajectory(params, steps?)`, `inferV0FromRange(R, h, g)`, `viewExtent(params)`, `rulerSteps(extentX)`

- [ ] **Step 1: 写失败测试**

写入 `lib/models/projectile.test.ts`：

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  apexHeight,
  flightTime,
  inferV0FromRange,
  range,
  rulerSteps,
  sampleAt,
  trajectory,
  viewExtent,
} from "./projectile.ts";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

test("horizontal launch falls for sqrt(2h/g) and travels v0 times that", () => {
  const params = { v0: 4, thetaDeg: 0, h: 1.25, g: 10 };
  assert.ok(close(flightTime(params), 0.5));
  assert.ok(close(range(params), 2));
  assert.ok(close(apexHeight(params), 1.25));
});

test("oblique launch lands at y = 0 exactly at the flight time", () => {
  const params = { v0: 6, thetaDeg: 40, h: 0.8, g: 9.81 };
  const tLand = flightTime(params);
  const landing = sampleAt(params, tLand);
  assert.ok(tLand > 0);
  assert.equal(landing.y, 0);
  assert.ok(close(landing.x, range(params)));
  assert.ok(landing.vy < 0);
});

test("apex height adds (v0 sin theta)^2 / 2g above the launch height", () => {
  const params = { v0: 5, thetaDeg: 30, h: 1, g: 10 };
  assert.ok(close(apexHeight(params), 1.3125));
});

test("inferV0FromRange inverts the horizontal range formula", () => {
  const params = { v0: 3.7, thetaDeg: 0, h: 0.9, g: 9.81 };
  assert.ok(close(inferV0FromRange(range(params), params.h, params.g), 3.7));
  assert.ok(Number.isNaN(inferV0FromRange(2, 0, 9.81)));
});

test("sampleAt clamps time into [0, flight time]", () => {
  const params = { v0: 5, thetaDeg: 30, h: 1, g: 9.81 };
  const tLand = flightTime(params);
  assert.equal(sampleAt(params, -1).t, 0);
  assert.ok(close(sampleAt(params, -1).y, 1));
  const late = sampleAt(params, tLand + 5);
  assert.ok(close(late.t, tLand));
  assert.equal(late.y, 0);
});

test("horizontal launch from the ground lands immediately", () => {
  const params = { v0: 5, thetaDeg: 0, h: 0, g: 9.81 };
  assert.equal(flightTime(params), 0);
  assert.equal(range(params), 0);
  assert.deepEqual(sampleAt(params, 1), { t: 0, x: 0, y: 0, vx: 5, vy: 0 });
});

test("trajectory samples span launch to landing", () => {
  const params = { v0: 5, thetaDeg: 45, h: 0.5, g: 9.81 };
  const points = trajectory(params, 40);
  assert.equal(points.length, 41);
  assert.equal(points[0].t, 0);
  assert.ok(close(points[0].y, 0.5));
  assert.ok(close(points[40].t, flightTime(params)));
  assert.equal(points[40].y, 0);
});

test("view extent never collapses below the minimum stage and scales with range", () => {
  const tiny = viewExtent({ v0: 0.5, thetaDeg: 0, h: 0.2, g: 9.81 });
  assert.equal(tiny.extentX, 1.5);
  assert.equal(tiny.extentY, 1);
  assert.equal(tiny.scale, 1);
  const long = viewExtent({ v0: 12, thetaDeg: 45, h: 0, g: 9.81 });
  assert.ok(long.extentX > 14);
  assert.ok(close(long.scale, long.extentX / 4));
});

test("ruler steps coarsen as the stage grows", () => {
  assert.deepEqual(rulerSteps(2), { major: 1, minor: 0.5 });
  assert.deepEqual(rulerSteps(12), { major: 2, minor: 1 });
  assert.deepEqual(rulerSteps(30), { major: 5, minor: 2.5 });
  assert.deepEqual(rulerSteps(80), { major: 10, minor: 5 });
  assert.deepEqual(rulerSteps(150), { major: 20, minor: 10 });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | tail -20`
Expected: `projectile.test.ts` 报 `Cannot find module './projectile.ts'`，其余 48 个已有测试仍通过。

- [ ] **Step 3: 写模型**

写入 `lib/models/projectile.ts`：

```ts
export type ProjectileParams = {
  v0: number;
  thetaDeg: number;
  h: number;
  g: number;
};

export type ProjectileSample = {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type ViewExtent = { extentX: number; extentY: number; scale: number };

export type RulerSteps = { major: number; minor: number };

const TIME_EPS = 1e-9;

function launchComponents(params: ProjectileParams) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  return {
    vx0: params.v0 * Math.cos(theta),
    vy0: params.v0 * Math.sin(theta),
  };
}

export function flightTime(params: ProjectileParams): number {
  const { vy0 } = launchComponents(params);
  const h = Math.max(0, params.h);
  const discriminant = vy0 * vy0 + 2 * params.g * h;
  const t = (vy0 + Math.sqrt(Math.max(0, discriminant))) / params.g;
  return t > TIME_EPS ? t : 0;
}

export function range(params: ProjectileParams): number {
  return launchComponents(params).vx0 * flightTime(params);
}

export function apexHeight(params: ProjectileParams): number {
  const { vy0 } = launchComponents(params);
  if (vy0 <= 0) {
    return params.h;
  }
  return params.h + (vy0 * vy0) / (2 * params.g);
}

export function sampleAt(params: ProjectileParams, t: number): ProjectileSample {
  const tLand = flightTime(params);
  const clamped = Math.min(tLand, Math.max(0, t));
  const { vx0, vy0 } = launchComponents(params);
  const y = params.h + vy0 * clamped - 0.5 * params.g * clamped * clamped;
  return {
    t: clamped,
    x: vx0 * clamped,
    y: clamped >= tLand ? 0 : Math.max(0, y),
    vx: vx0,
    vy: vy0 - params.g * clamped,
  };
}

export function trajectory(params: ProjectileParams, steps = 80): ProjectileSample[] {
  const tLand = flightTime(params);
  const samples: ProjectileSample[] = [];
  for (let index = 0; index <= steps; index += 1) {
    samples.push(sampleAt(params, (tLand * index) / steps));
  }
  return samples;
}

// Horizontal launch only: R = v0 * sqrt(2h/g)  =>  v0 = R * sqrt(g/2h).
export function inferV0FromRange(rangeX: number, h: number, g: number): number {
  if (!(h > 0) || !(g > 0)) {
    return Number.NaN;
  }
  return rangeX * Math.sqrt(g / (2 * h));
}

// Stage box the 3D camera frames. `scale` multiplies every decorative size
// (ball radius, labels, arrows) so a 100 m throw reads like a 2 m throw.
export function viewExtent(params: ProjectileParams): ViewExtent {
  const extentX = Math.max(1.5, range(params));
  const extentY = Math.max(1, apexHeight(params), params.h);
  return { extentX, extentY, scale: Math.max(1, extentX / 4) };
}

export function rulerSteps(extentX: number): RulerSteps {
  const major =
    extentX <= 6 ? 1 : extentX <= 15 ? 2 : extentX <= 40 ? 5 : extentX <= 100 ? 10 : 20;
  return { major, minor: major / 2 };
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test 2>&1 | tail -12`
Expected: `ℹ pass 57`，`ℹ fail 0`。

- [ ] **Step 5: 提交**

```bash
git add lib/models/projectile.ts lib/models/projectile.test.ts
git commit -m "Add the projectile kinematics model."
```

---

### Task 2: 预测模式状态机

**Files:**
- Create: `lib/models/projectile-prediction.ts`
- Create: `lib/models/projectile-prediction.test.ts`

**Interfaces:**
- Consumes: `ProjectileParams` from `./projectile`
- Produces: 常量 `HIDDEN_V0_MIN=2`, `HIDDEN_V0_MAX=8`, `V0_TOLERANCE=0.05`, `TARGET_HALF_WIDTH=0.1`, `PREDICTION_G=9.81`, `PREDICTION_H_MIN=0.2`, `PREDICTION_H_MAX=3`, `PREDICTION_THETA_MIN=0`, `PREDICTION_THETA_MAX=80`, `DEFAULT_PREDICTION_H=1`
- Produces: `PredictionPhase`, `PredictionState`, `PredictionOutcome`, `RandomSource`
- Produces: `drawHiddenV0(random?)`, `createPrediction(random?, h?)`, `predictionParams(state)`, `isRevealed(state)`, `canLaunch(state)`, `setHeight(state, h)`, `setTheta(state, deg)`, `submitV0Estimate(state, v0)`, `placeTarget(state, x)`, `recordLanding(state, x)`, `retryPrediction(state)`, `newDataset(state, random?)`

- [ ] **Step 1: 写失败测试**

写入 `lib/models/projectile-prediction.test.ts`：

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  HIDDEN_V0_MAX,
  HIDDEN_V0_MIN,
  PREDICTION_G,
  canLaunch,
  createPrediction,
  drawHiddenV0,
  newDataset,
  placeTarget,
  predictionParams,
  recordLanding,
  retryPrediction,
  setHeight,
  setTheta,
  submitV0Estimate,
} from "./projectile-prediction.ts";

// 2 + (1/3) * 6 = 4.00 m/s
const fixedV0 = () => 1 / 3;

test("hidden v0 is drawn from [2, 8] with two decimals", () => {
  assert.equal(drawHiddenV0(() => 0), HIDDEN_V0_MIN);
  assert.ok(drawHiddenV0(() => 0.999999) <= HIDDEN_V0_MAX);
  const mid = drawHiddenV0(() => 0.123456);
  assert.ok(Math.abs(mid * 100 - Math.round(mid * 100)) < 1e-9);
  assert.equal(drawHiddenV0(fixedV0), 4);
});

test("a new prediction starts in the measure phase with a horizontal launcher", () => {
  const state = createPrediction(fixedV0);
  assert.equal(state.phase, "measure");
  assert.equal(state.hiddenV0, 4);
  assert.equal(state.thetaDeg, 0);
  assert.equal(state.h, 1);
  assert.deepEqual(predictionParams(state), { v0: 4, thetaDeg: 0, h: 1, g: PREDICTION_G });
  assert.equal(canLaunch(state), true);
});

test("theta is locked during measure and clamped during predict", () => {
  const measure = createPrediction(fixedV0);
  assert.equal(setTheta(measure, 30), measure);
  const predict = submitV0Estimate(measure, 4);
  assert.equal(setTheta(predict, 95).thetaDeg, 80);
  assert.equal(setTheta(predict, -5).thetaDeg, 0);
});

test("v0 estimate within 5 percent unlocks the predict phase", () => {
  const state = createPrediction(fixedV0);
  const accepted = submitV0Estimate(state, 4.2);
  assert.equal(accepted.phase, "predict");
  assert.equal(accepted.v0Accepted, true);
  assert.equal(submitV0Estimate(state, 3.8).phase, "predict");
  const rejected = submitV0Estimate(state, 4.2004);
  assert.equal(rejected.phase, "measure");
  assert.equal(rejected.v0Accepted, false);
  assert.equal(rejected.v0Estimate, 4.2004);
});

test("measure phase records the landing without judging it", () => {
  const state = recordLanding(createPrediction(fixedV0), 1.81);
  assert.equal(state.phase, "measure");
  assert.equal(state.lastLandingX, 1.81);
  assert.equal(state.outcome, null);
});

test("predict phase needs a placed target before launching", () => {
  const predict = submitV0Estimate(createPrediction(fixedV0), 4);
  assert.equal(canLaunch(predict), false);
  assert.equal(recordLanding(predict, 2), predict);
  const placed = placeTarget(predict, 2);
  assert.equal(placed.targetPlaced, true);
  assert.equal(placed.xPredicted, 2);
  assert.equal(canLaunch(placed), true);
});

test("landing within 0.10 m of the target counts as a hit", () => {
  const placed = placeTarget(submitV0Estimate(createPrediction(fixedV0), 4), 2);
  const hit = recordLanding(placed, 2.1);
  assert.equal(hit.phase, "result");
  assert.equal(hit.outcome?.hit, true);
  assert.equal(canLaunch(hit), false);
  const nearMiss = recordLanding(placed, 2.101);
  assert.equal(nearMiss.outcome?.hit, false);
  assert.ok(Math.abs((nearMiss.outcome?.deltaX ?? 0) - 0.101) < 1e-9);
  assert.equal(recordLanding(placed, 1.9).outcome?.hit, true);
});

test("changing h or theta while predicting removes the placed target", () => {
  const placed = placeTarget(submitV0Estimate(createPrediction(fixedV0), 4), 2);
  assert.equal(setHeight(placed, 1.5).targetPlaced, false);
  assert.equal(setTheta(placed, 20).xPredicted, null);
  assert.equal(setHeight(placed, 5).h, 3);
  assert.equal(setHeight(placed, 1), placed);
});

test("retry keeps the hidden v0; a new dataset replaces it", () => {
  const result = recordLanding(
    placeTarget(submitV0Estimate(createPrediction(fixedV0), 4), 2),
    2.5,
  );
  const retry = retryPrediction(result);
  assert.equal(retry.phase, "predict");
  assert.equal(retry.hiddenV0, 4);
  assert.equal(retry.targetPlaced, false);
  assert.equal(retry.outcome, null);
  assert.equal(retry.lastLandingX, null);
  const fresh = newDataset(result, () => 0.5);
  assert.equal(fresh.phase, "measure");
  assert.equal(fresh.hiddenV0, 5);
  assert.equal(fresh.h, result.h);
  assert.equal(fresh.thetaDeg, 0);
  assert.equal(fresh.v0Estimate, null);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | tail -20`
Expected: `projectile-prediction.test.ts` 报 `Cannot find module './projectile-prediction.ts'`。

- [ ] **Step 3: 写状态机**

写入 `lib/models/projectile-prediction.ts`：

```ts
import type { ProjectileParams } from "./projectile";

export const HIDDEN_V0_MIN = 2;
export const HIDDEN_V0_MAX = 8;
export const V0_TOLERANCE = 0.05;
export const TARGET_HALF_WIDTH = 0.1;
export const PREDICTION_G = 9.81;
export const PREDICTION_H_MIN = 0.2;
export const PREDICTION_H_MAX = 3;
export const PREDICTION_THETA_MIN = 0;
export const PREDICTION_THETA_MAX = 80;
export const DEFAULT_PREDICTION_H = 1;

const EPS = 1e-9;

export type PredictionPhase = "measure" | "predict" | "result";

export type RandomSource = () => number;

export type PredictionOutcome = { hit: boolean; deltaX: number; landingX: number };

export type PredictionState = {
  phase: PredictionPhase;
  hiddenV0: number;
  h: number;
  thetaDeg: number;
  v0Estimate: number | null;
  v0Accepted: boolean;
  xPredicted: number | null;
  targetPlaced: boolean;
  lastLandingX: number | null;
  outcome: PredictionOutcome | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function drawHiddenV0(random: RandomSource = Math.random): number {
  const raw = HIDDEN_V0_MIN + random() * (HIDDEN_V0_MAX - HIDDEN_V0_MIN);
  return clamp(Math.round(raw * 100) / 100, HIDDEN_V0_MIN, HIDDEN_V0_MAX);
}

export function createPrediction(
  random: RandomSource = Math.random,
  h = DEFAULT_PREDICTION_H,
): PredictionState {
  return {
    phase: "measure",
    hiddenV0: drawHiddenV0(random),
    h: clamp(h, PREDICTION_H_MIN, PREDICTION_H_MAX),
    thetaDeg: 0,
    v0Estimate: null,
    v0Accepted: false,
    xPredicted: null,
    targetPlaced: false,
    lastLandingX: null,
    outcome: null,
  };
}

export function predictionParams(state: PredictionState): ProjectileParams {
  return { v0: state.hiddenV0, thetaDeg: state.thetaDeg, h: state.h, g: PREDICTION_G };
}

export function isRevealed(state: PredictionState): boolean {
  return state.phase === "result";
}

export function canLaunch(state: PredictionState): boolean {
  if (state.phase === "measure") {
    return true;
  }
  return state.phase === "predict" && state.targetPlaced;
}

export function setHeight(state: PredictionState, h: number): PredictionState {
  if (state.phase === "result" || !Number.isFinite(h)) {
    return state;
  }
  const next = clamp(h, PREDICTION_H_MIN, PREDICTION_H_MAX);
  if (next === state.h) {
    return state;
  }
  return { ...state, h: next, lastLandingX: null, xPredicted: null, targetPlaced: false };
}

export function setTheta(state: PredictionState, thetaDeg: number): PredictionState {
  if (state.phase !== "predict" || !Number.isFinite(thetaDeg)) {
    return state;
  }
  const next = clamp(thetaDeg, PREDICTION_THETA_MIN, PREDICTION_THETA_MAX);
  if (next === state.thetaDeg) {
    return state;
  }
  return { ...state, thetaDeg: next, lastLandingX: null, xPredicted: null, targetPlaced: false };
}

export function submitV0Estimate(state: PredictionState, value: number): PredictionState {
  if (state.phase !== "measure" || !Number.isFinite(value) || value <= 0) {
    return state;
  }
  const relativeError = Math.abs(value - state.hiddenV0) / state.hiddenV0;
  const accepted = relativeError <= V0_TOLERANCE + EPS;
  return {
    ...state,
    v0Estimate: value,
    v0Accepted: accepted,
    phase: accepted ? "predict" : "measure",
    lastLandingX: accepted ? null : state.lastLandingX,
  };
}

export function placeTarget(state: PredictionState, x: number): PredictionState {
  if (state.phase !== "predict" || !Number.isFinite(x) || x < 0) {
    return state;
  }
  return { ...state, xPredicted: x, targetPlaced: true };
}

export function recordLanding(state: PredictionState, landingX: number): PredictionState {
  if (state.phase === "measure") {
    return { ...state, lastLandingX: landingX };
  }
  if (state.phase === "predict" && state.targetPlaced && state.xPredicted !== null) {
    const deltaX = landingX - state.xPredicted;
    return {
      ...state,
      phase: "result",
      lastLandingX: landingX,
      outcome: { hit: Math.abs(deltaX) <= TARGET_HALF_WIDTH + EPS, deltaX, landingX },
    };
  }
  return state;
}

export function retryPrediction(state: PredictionState): PredictionState {
  if (state.phase === "measure") {
    return state;
  }
  return {
    ...state,
    phase: "predict",
    xPredicted: null,
    targetPlaced: false,
    lastLandingX: null,
    outcome: null,
  };
}

export function newDataset(
  state: PredictionState,
  random: RandomSource = Math.random,
): PredictionState {
  return createPrediction(random, state.h);
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test 2>&1 | tail -12`
Expected: `ℹ pass 66`，`ℹ fail 0`。

- [ ] **Step 5: 提交**

```bash
git add lib/models/projectile-prediction.ts lib/models/projectile-prediction.test.ts
git commit -m "Add the projectile prediction-mode state machine."
```

---

### Task 3: 共享时间序列与泛型图表

`appendKinematicSample` 的去重 / 限频 / 压缩逻辑要给抛体复用，抽到 `time-series.ts`；`TimeSeriesChart` 现在写死斜向拉力的 `KinematicSample`，改成泛型。两个已有实验台的调用点不改。

**Files:**
- Create: `lib/models/time-series.ts`
- Create: `lib/models/time-series.test.ts`
- Modify: `lib/models/pull-friction.ts:212-243`
- Modify: `components/kinematic-charts.tsx`

**Interfaces:**
- Produces: `appendTimeSample<T extends { t: number }>(prev: T[], sample: T, interval = 1/30): T[]`
- Produces: `TimeSeriesChart<T extends { t: number }>` props `{ title; quantity; unit; strokeColor; valueKey: 数值键且不为 "t"; points: readonly T[]; currentTime; currentValue }`
- Keeps: `appendKinematicSample` 签名与行为不变

- [ ] **Step 1: 写失败测试**

写入 `lib/models/time-series.test.ts`：

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test 2>&1 | tail -20`
Expected: `time-series.test.ts` 报 `Cannot find module './time-series.ts'`。

- [ ] **Step 3: 写 `time-series.ts`**

```ts
export type TimeSample = { t: number };

const SAMPLE_EPS = 1e-4;
const SERIES_CAP = 800;

// Keeps the first and latest samples, drops samples closer than `interval`,
// and halves the middle once the series exceeds SERIES_CAP.
export function appendTimeSample<T extends TimeSample>(
  prev: T[],
  sample: T,
  interval = 1 / 30,
): T[] {
  if (prev.length === 0) {
    return [sample];
  }

  const last = prev[prev.length - 1];
  if (Math.abs(sample.t - last.t) < SAMPLE_EPS) {
    return [...prev.slice(0, -1), sample];
  }
  if (sample.t - last.t < interval) {
    return prev;
  }

  const next = [...prev, sample];
  if (next.length <= SERIES_CAP) {
    return next;
  }

  const compacted = [next[0]];
  for (let index = 2; index < next.length - 1; index += 2) {
    compacted.push(next[index]);
  }
  compacted.push(next[next.length - 1]);
  return compacted;
}
```

- [ ] **Step 4: 让 `pull-friction.ts` 复用它**

在 `lib/models/pull-friction.ts` 顶部加：

```ts
import { appendTimeSample } from "./time-series";
```

把文件末尾从 `const SAMPLE_EPS = 1e-4;` 到结尾的 `appendKinematicSample` 整段替换为：

```ts
export function appendKinematicSample(
  prev: KinematicSample[],
  sample: KinematicSample,
  interval = 1 / 30,
): KinematicSample[] {
  return appendTimeSample(prev, sample, interval);
}
```

- [ ] **Step 5: 泛型化 `TimeSeriesChart`**

用下面内容整体替换 `components/kinematic-charts.tsx`：

```tsx
"use client";

import { memo, useMemo } from "react";

const WIDTH = 320;
const HEIGHT = 90;

export type TimeSeriesPoint = { t: number };

type NumericKeys<T> = { [K in keyof T]-?: T[K] extends number ? K : never }[keyof T];

export type SeriesValueKey<T extends TimeSeriesPoint> = Exclude<NumericKeys<T>, "t">;

function formatNumber(value: number) {
  return value.toFixed(2);
}

function axisRange(values: number[]) {
  if (values.length === 0) {
    return { min: -1, max: 1 };
  }
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (min === max) {
    return { min: -1, max: 1 };
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function valueOf<T extends TimeSeriesPoint>(point: T, key: SeriesValueKey<T>): number {
  return point[key] as unknown as number;
}

function buildLinePath<T extends TimeSeriesPoint>(
  points: readonly T[],
  valueKey: SeriesValueKey<T>,
  valueMin: number,
  valueMax: number,
  timeMax: number,
) {
  if (points.length === 0) {
    return "";
  }

  const range = valueMax - valueMin || 1;
  const timeSpan = timeMax || 1;

  return points
    .map((point, index) => {
      const px = (point.t / timeSpan) * WIDTH;
      const py = HEIGHT - ((valueOf(point, valueKey) - valueMin) / range) * HEIGHT;
      return `${index === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(" ");
}

type TimeSeriesChartProps<T extends TimeSeriesPoint> = {
  title: string;
  quantity: string;
  unit: string;
  strokeColor: string;
  valueKey: SeriesValueKey<T>;
  points: readonly T[];
  currentTime: number;
  currentValue: number;
};

function TimeSeriesChartInner<T extends TimeSeriesPoint>({
  title,
  quantity,
  unit,
  strokeColor,
  valueKey,
  points,
  currentTime,
  currentValue,
}: TimeSeriesChartProps<T>) {
  const timeMax = Math.max(10, currentTime);
  const { min, max, range } = useMemo(() => {
    const values = [...points.map((point) => valueOf(point, valueKey)), currentValue];
    const next = axisRange(values);
    return { ...next, range: next.max - next.min || 1 };
  }, [currentValue, points, valueKey]);

  const linePath = useMemo(
    () => buildLinePath(points, valueKey, min, max, timeMax),
    [max, min, points, timeMax, valueKey],
  );

  const markerX = (currentTime / timeMax) * WIDTH;
  const markerY = HEIGHT - ((currentValue - min) / range) * HEIGHT;
  const zeroY = min < 0 && max > 0 ? HEIGHT - ((0 - min) / range) * HEIGHT : null;

  return (
    <figure className="flex min-h-0 flex-col border border-line bg-surface p-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <figcaption>
          <h3 className="text-[13px] font-medium text-ink">{title}</h3>
          <p className="font-mono text-[11px] text-quiet">
            {quantity}({formatNumber(currentTime)} s)
          </p>
        </figcaption>
        <p className="font-mono text-[15px] font-medium tabular-nums" style={{ color: strokeColor }}>
          {formatNumber(currentValue)}{" "}
          <span className="text-[11px] font-normal text-quiet">{unit}</span>
        </p>
      </div>

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-h-0 flex-1 w-full bg-paper"
        role="img"
        aria-label={`${title}，当前 ${formatNumber(currentValue)} ${unit}`}
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={`h-${fraction}`}
            x1="0"
            y1={HEIGHT * fraction}
            x2={WIDTH}
            y2={HEIGHT * fraction}
            stroke="#E9EEF5"
            strokeWidth="1"
          />
        ))}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={`v-${fraction}`}
            x1={WIDTH * fraction}
            y1="0"
            x2={WIDTH * fraction}
            y2={HEIGHT}
            stroke="#E9EEF5"
            strokeWidth="1"
          />
        ))}
        {zeroY !== null ? (
          <line x1="0" y1={zeroY} x2={WIDTH} y2={zeroY} stroke="#CBD5E1" strokeWidth="1" />
        ) : null}
        <line x1="0" y1="0" x2="0" y2={HEIGHT} stroke="#1E3A5F" strokeWidth="1" />
        <line x1="0" y1={HEIGHT} x2={WIDTH} y2={HEIGHT} stroke="#1E3A5F" strokeWidth="1" />
        {points.length >= 2 ? (
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        <line
          x1={markerX}
          y1="0"
          x2={markerX}
          y2={HEIGHT}
          stroke="#1E3A5F"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        <circle cx={markerX} cy={markerY} r="3.5" fill={strokeColor} />
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-quiet">
        <span>
          min {formatNumber(min)} {unit}
        </span>
        <span>0-{formatNumber(timeMax)} s</span>
        <span>
          max {formatNumber(max)} {unit}
        </span>
      </div>
    </figure>
  );
}

export const TimeSeriesChart = memo(TimeSeriesChartInner) as typeof TimeSeriesChartInner;
```

- [ ] **Step 6: 测试 + 类型检查 + lint**

Run: `npm test 2>&1 | tail -12 && npx tsc --noEmit -p tsconfig.json && npx eslint components lib`
Expected: `ℹ pass 67`，`fail 0`；tsc 无输出；eslint 无输出。`pull-friction-lab.tsx` 与 `linear-motion-lab.tsx` 不需要改动即可通过。

- [ ] **Step 7: 提交**

```bash
git add lib/models/time-series.ts lib/models/time-series.test.ts lib/models/pull-friction.ts components/kinematic-charts.tsx
git commit -m "Share time-series appending and make TimeSeriesChart generic."
```

---

### Task 4: 3D 场景

**Files:**
- Create: `components/scene-label.tsx`
- Create: `components/projectile-scene.tsx`
- Create: `components/projectile-canvas.tsx`

**Interfaces:**
- Consumes: `viewExtent`, `rulerSteps`, `trajectory`, `range`, `flightTime`, `ProjectileParams`, `ProjectileSample`（Task 1）；`TARGET_HALF_WIDTH`（Task 2）；`FORCE_COLORS`, `FORCE_LABEL_COLORS`（已有 `lib/models/force-display.ts`）
- Produces: `SpriteLabel({ text, color, position, height?, renderOrder? })`
- Produces: `TrailPoint2D = { x; y }`, `SceneTarget = { x; state: "pending" | "hit" | "miss"; deltaX: number | null }`, `ProjectileSceneProps`
- Produces: `ProjectileScene(props)` 与默认导出 `ProjectileCanvas(props: ProjectileSceneProps)`

说明：重力箭头没有质量可乘，标为 `g`（m/s²），颜色仍用规格里的绿色 `FORCE_COLORS.G`。

- [ ] **Step 1: 写 `components/scene-label.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

// Single-line sprite label rasterised to a canvas texture. Same halo treatment
// as the pull-friction force labels: paper-coloured glyph stroke, no pill.
const SCALE = 4;
const FALLBACK_FONT = "ui-monospace, Menlo, monospace";
const HALO_OUTER = "#e2e8f0";
const HALO_INNER = "#f1f5f9";

type Vec3 = [number, number, number];

function labelFontFamily() {
  const custom = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-plex-mono")
    .trim();
  return custom ? `${custom}, ${FALLBACK_FONT}` : FALLBACK_FONT;
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const settle = () => {
      if (alive) {
        setReady(true);
      }
    };
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(settle, settle);
    } else {
      settle();
    }
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

function rasterLabel(text: string, color: string, family: string) {
  const font = `700 ${13 * SCALE}px ${family}`;
  const line = 13 * SCALE * 1.2;
  const pad = 3 * SCALE;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }

  ctx.font = font;
  const width = ctx.measureText(text).width;
  canvas.width = Math.ceil(width + pad * 2);
  canvas.height = Math.ceil(line + pad * 2);

  // Resizing the canvas resets context state.
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = HALO_OUTER;
  ctx.lineWidth = 2.6 * SCALE;
  ctx.strokeText(text, cx, cy);
  ctx.strokeStyle = HALO_INNER;
  ctx.lineWidth = 1.3 * SCALE;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 1;
  return { texture, aspect: canvas.width / canvas.height };
}

export function SpriteLabel({
  text,
  color,
  position,
  height = 0.3,
  renderOrder = 30,
}: {
  text: string;
  color: string;
  position: Vec3;
  height?: number;
  renderOrder?: number;
}) {
  const fontsReady = useFontsReady();
  const family = fontsReady ? labelFontFamily() : FALLBACK_FONT;
  const raster = useMemo(() => rasterLabel(text, color, family), [text, color, family]);
  useEffect(() => () => raster.texture.dispose(), [raster]);

  return (
    <sprite
      position={position}
      scale={[height * raster.aspect, height, 1]}
      renderOrder={renderOrder}
      frustumCulled={false}
    >
      <spriteMaterial
        map={raster.texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}
```

- [ ] **Step 2: 写 `components/projectile-scene.tsx`**

```tsx
"use client";

import { Grid, Line, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Line as LineObject,
  LineBasicMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS, FORCE_LABEL_COLORS } from "@/lib/models/force-display";
import {
  flightTime,
  range,
  rulerSteps,
  trajectory,
  viewExtent,
  type ProjectileParams,
  type ProjectileSample,
} from "@/lib/models/projectile";
import { TARGET_HALF_WIDTH } from "@/lib/models/projectile-prediction";

export type TrailPoint2D = { x: number; y: number };

export type TargetState = "pending" | "hit" | "miss";

export type SceneTarget = { x: number; state: TargetState; deltaX: number | null };

export type ProjectileSceneProps = {
  params: ProjectileParams;
  sample: ProjectileSample;
  trail: TrailPoint2D[];
  showPrediction: boolean;
  showVelocity: boolean;
  landingX: number | null;
  target: SceneTarget | null;
  frameParams: ProjectileParams;
  allowRefit: boolean;
};

type Vec3 = [number, number, number];

const NAVY = "#1E3A5F";
const BALL_COLOR = "#3D5A80";
const HIT_COLOR = "#047857";
const MISS_COLOR = "#DC2626";
const TRAIL_MAX_POINTS = 400;
const ARROW_RENDER_ORDER = 20;
const UP = new Vector3(0, 1, 0);
const DEFAULT_VIEW_DIRECTION = new Vector3(0.18, 0.28, 1).normalize();

function formatMeters(value: number) {
  return `${value.toFixed(2)} m`;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

const Scenery = memo(function Scenery() {
  return (
    <>
      <color attach="background" args={["#cbd5e1"]} />
      <hemisphereLight args={["#f8fafc", "#64748b", 0.7]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={1.05} />
      <directionalLight position={[2, -8, 3]} intensity={0.4} />
      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        sectionSize={5}
        sectionThickness={1.1}
        cellColor="#94a3b8"
        sectionColor="#1e3a5f"
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid
        followCamera
        side={DoubleSide}
      />
    </>
  );
});

function Ruler({ extentX, scale }: { extentX: number; scale: number }) {
  const { major, minor } = rulerSteps(extentX);
  const end = Math.ceil(extentX / major) * major + major;
  const ticks = useMemo(() => {
    const list: { x: number; isMajor: boolean }[] = [];
    for (let x = 0; x <= end + 1e-9; x += minor) {
      const rounded = Number(x.toFixed(4));
      list.push({
        x: rounded,
        isMajor: Math.abs(rounded / major - Math.round(rounded / major)) < 1e-6,
      });
    }
    return list;
  }, [end, major, minor]);

  return (
    <group>
      <mesh position={[end / 2 - scale, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
        <planeGeometry args={[end + 4 * scale, 1.4 * scale]} />
        <meshStandardMaterial
          color="#e2e8f0"
          transparent
          opacity={0.55}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      {ticks.map((tick) => (
        <mesh key={tick.x} position={[tick.x, 0.004, 0]}>
          <boxGeometry args={[0.012 * scale, 0.004, (tick.isMajor ? 0.26 : 0.14) * scale]} />
          <meshBasicMaterial color={NAVY} />
        </mesh>
      ))}
      {ticks
        .filter((tick) => tick.isMajor)
        .map((tick) => (
          <SpriteLabel
            key={`label-${tick.x}`}
            text={`${tick.x} m`}
            color={NAVY}
            position={[tick.x, 0.09 * scale, 0.34 * scale]}
            height={0.2 * scale}
          />
        ))}
    </group>
  );
}

// Muzzle sits at (0, h). The barrel points back along -cos/-sin so the ball
// leaves from the origin; it is shortened when it would dip below ground.
function Launcher({ h, thetaDeg, scale }: { h: number; thetaDeg: number; scale: number }) {
  const theta = (thetaDeg * Math.PI) / 180;
  const nominal = 0.35 * scale;
  const barrel = thetaDeg > 0 ? Math.min(nominal, h / Math.sin(theta)) : nominal;
  if (barrel < 0.02) {
    return null;
  }
  const centre: Vec3 = [(-Math.cos(theta) * barrel) / 2, h - (Math.sin(theta) * barrel) / 2, 0];
  const columnX = -Math.cos(theta) * barrel * 0.7;
  const columnTop = h - Math.sin(theta) * barrel * 0.7;
  return (
    <group>
      {columnTop > 0.01 ? (
        <mesh position={[columnX, columnTop / 2, 0]}>
          <boxGeometry args={[0.05 * scale, columnTop, 0.05 * scale]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ) : null}
      <mesh position={centre} rotation={[0, 0, theta - Math.PI / 2]}>
        <cylinderGeometry args={[0.035 * scale, 0.035 * scale, barrel, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}

function Ball({ position, radius }: { position: Vec3; radius: number }) {
  return (
    <mesh position={position} renderOrder={1}>
      <sphereGeometry args={[radius, 32, 24]} />
      <meshPhysicalMaterial
        color={BALL_COLOR}
        roughness={0.3}
        metalness={0.1}
        clearcoat={0.4}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}

function TrailLine({ points, lift }: { points: TrailPoint2D[]; lift: number }) {
  // One preallocated buffer, updated in place: avoids rebuilding a BufferAttribute every frame.
  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(TRAIL_MAX_POINTS * 3), 3),
    );
    geometry.setDrawRange(0, 0);
    const object = new LineObject(geometry, new LineBasicMaterial({ color: FORCE_COLORS.f }));
    object.frustumCulled = false;
    return object;
  }, []);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
    },
    [line],
  );

  useLayoutEffect(() => {
    const attribute = line.geometry.getAttribute("position") as BufferAttribute;
    const array = attribute.array as Float32Array;
    const count = Math.min(points.length, TRAIL_MAX_POINTS);
    const start = points.length - count;
    for (let index = 0; index < count; index += 1) {
      const point = points[start + index];
      array[index * 3] = point.x;
      array[index * 3 + 1] = point.y + lift;
      array[index * 3 + 2] = 0;
    }
    attribute.needsUpdate = true;
    line.geometry.setDrawRange(0, count);
  }, [lift, line, points]);

  return <primitive object={line} visible={points.length >= 2} />;
}

function PredictionPath({
  params,
  lift,
  scale,
}: {
  params: ProjectileParams;
  lift: number;
  scale: number;
}) {
  const { v0, thetaDeg, h, g } = params;
  const points = useMemo<Vec3[]>(
    () => trajectory({ v0, thetaDeg, h, g }, 80).map((point) => [point.x, point.y + lift, 0]),
    [g, h, lift, thetaDeg, v0],
  );
  if (flightTime(params) <= 0) {
    return null;
  }
  const landing = range(params);
  return (
    <group>
      <Line
        points={points}
        color={NAVY}
        lineWidth={1.5}
        dashed
        dashSize={0.08 * scale}
        gapSize={0.05 * scale}
      />
      <mesh position={[landing, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06 * scale, 0.09 * scale, 32]} />
        <meshBasicMaterial color={NAVY} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function LandingMarker({ x, scale }: { x: number; scale: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08 * scale, 32]} />
        <meshBasicMaterial color={FORCE_COLORS.f} side={DoubleSide} />
      </mesh>
      <SpriteLabel
        text={`x = ${formatMeters(x)}`}
        color={FORCE_LABEL_COLORS.f}
        position={[0, 0.3 * scale, 0]}
        height={0.22 * scale}
      />
    </group>
  );
}

// Physical 0.20 m cup; the width is the hit tolerance, so it does not scale.
function TargetCup({ target, scale }: { target: SceneTarget; scale: number }) {
  const color = target.state === "hit" ? HIT_COLOR : target.state === "miss" ? MISS_COLOR : NAVY;
  const label =
    target.state === "hit"
      ? "命中"
      : target.state === "miss"
        ? `Δx = ${formatSigned(target.deltaX ?? 0)} m`
        : `标靶 x = ${formatMeters(target.x)}`;
  const height = 0.12;
  return (
    <group position={[target.x, 0, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry
          args={[TARGET_HALF_WIDTH, TARGET_HALF_WIDTH * 0.85, height, 24, 1, true]}
        />
        <meshStandardMaterial color={color} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TARGET_HALF_WIDTH * 0.85, 24]} />
        <meshBasicMaterial color={color} side={DoubleSide} />
      </mesh>
      <SpriteLabel
        text={label}
        color={color}
        position={[0, height + 0.2 * scale, 0]}
        height={0.22 * scale}
      />
    </group>
  );
}

function DashedShaft({
  length,
  radius,
  color,
  scale,
}: {
  length: number;
  radius: number;
  color: string;
  scale: number;
}) {
  const segments = useMemo(() => {
    const dash = 0.1 * scale;
    const gap = 0.07 * scale;
    const period = dash + gap;
    const list: { key: number; y: number; height: number }[] = [];
    let cursor = 0;
    let index = 0;
    while (cursor < length - 0.02 * scale) {
      const height = Math.min(dash, length - cursor);
      list.push({ key: index, y: cursor + height / 2, height });
      cursor += period;
      index += 1;
    }
    return list;
  }, [length, scale]);

  return (
    <group>
      {segments.map((segment) => (
        <mesh
          key={segment.key}
          position={[0, segment.y, 0]}
          renderOrder={ARROW_RENDER_ORDER}
          frustumCulled={false}
        >
          <cylinderGeometry args={[radius, radius, segment.height, 6]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

function VectorArrow({
  origin,
  vector,
  value,
  unitLength,
  color,
  labelColor,
  label,
  unit,
  dashed,
  labelOffset,
  scale,
}: {
  origin: Vec3;
  vector: Vec3;
  value: number;
  unitLength: number;
  color: string;
  labelColor: string;
  label: string;
  unit: string;
  dashed: boolean;
  labelOffset: Vec3;
  scale: number;
}) {
  const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
  if (magnitude < 1e-6) {
    return null;
  }
  const direction: Vec3 = [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
  const quaternion = new Quaternion().setFromUnitVectors(
    UP,
    new Vector3(direction[0], direction[1], direction[2]),
  );
  const shaft = Math.min(1.2 * scale, Math.max(0.18 * scale, magnitude * unitLength));
  const coneHeight = (dashed ? 0.08 : 0.1) * scale;
  const coneRadius = (dashed ? 0.028 : 0.036) * scale;
  const shaftRadius = (dashed ? 0.008 : 0.012) * scale;
  const reach = shaft + coneHeight + 0.16 * scale;
  const labelPosition: Vec3 = [
    direction[0] * reach + labelOffset[0],
    direction[1] * reach + labelOffset[1],
    direction[2] * reach + labelOffset[2],
  ];

  return (
    <group position={origin}>
      <group quaternion={quaternion}>
        {dashed ? (
          <DashedShaft length={shaft} radius={shaftRadius} color={color} scale={scale} />
        ) : (
          <mesh position={[0, shaft / 2, 0]} renderOrder={ARROW_RENDER_ORDER} frustumCulled={false}>
            <cylinderGeometry args={[shaftRadius, shaftRadius, shaft, 8]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        )}
        <mesh
          position={[0, shaft + coneHeight / 2, 0]}
          renderOrder={ARROW_RENDER_ORDER}
          frustumCulled={false}
        >
          <coneGeometry args={[coneRadius, coneHeight, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      </group>
      <SpriteLabel
        text={`${label} ${value.toFixed(2)} ${unit}`}
        color={labelColor}
        position={labelPosition}
        height={0.2 * scale}
      />
    </group>
  );
}

// Re-frames the stage when the extent changes while the ball is parked at
// t = 0. Keeps the user's current viewing direction; only distance and target move.
function FitCamera({
  extentX,
  extentY,
  allowRefit,
}: {
  extentX: number;
  extentY: number;
  allowRefit: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((state) => state.size);
  const key = `${extentX.toFixed(3)}|${extentY.toFixed(3)}`;
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    if (!allowRefit || fitted.current === key || !controls) {
      return;
    }
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const fov = (camera.fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    const target = new Vector3(extentX / 2, extentY * 0.45, 0);
    const fitHeight = (extentY * 1.3) / 2 / Math.tan(fov / 2);
    const fitWidth = (extentX * 1.15) / 2 / (aspect * Math.tan(fov / 2));
    const distance = Math.max(2, fitHeight, fitWidth);
    const direction =
      fitted.current === null
        ? DEFAULT_VIEW_DIRECTION.clone()
        : camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 1e-6) {
      direction.copy(DEFAULT_VIEW_DIRECTION);
    }
    camera.position.copy(target).addScaledVector(direction, distance);
    controls.target.copy(target);
    controls.update();
    fitted.current = key;
  }, [allowRefit, camera, controls, extentX, extentY, key, size.height, size.width]);

  return null;
}

export function ProjectileScene({
  params,
  sample,
  trail,
  showPrediction,
  showVelocity,
  landingX,
  target,
  frameParams,
  allowRefit,
}: ProjectileSceneProps) {
  const { v0, thetaDeg, h, g } = frameParams;
  const { extentX, extentY, scale } = useMemo(
    () => viewExtent({ v0, thetaDeg, h, g }),
    [g, h, thetaDeg, v0],
  );
  const radius = Math.max(0.04, 0.012 * extentX);
  const ballCentre: Vec3 = [sample.x, sample.y + radius, 0];
  const velocityUnit = 0.12 * scale;
  const gravityUnit = 0.035 * scale;

  return (
    <>
      <Scenery />
      <Ruler extentX={extentX} scale={scale} />
      <Launcher h={params.h} thetaDeg={params.thetaDeg} scale={scale} />
      {showPrediction ? <PredictionPath params={params} lift={radius} scale={scale} /> : null}
      <TrailLine points={trail} lift={radius} />
      <Ball position={ballCentre} radius={radius} />
      {showVelocity ? (
        <>
          <VectorArrow
            origin={ballCentre}
            vector={[sample.vx, sample.vy, 0]}
            value={Math.hypot(sample.vx, sample.vy)}
            unitLength={velocityUnit}
            color={FORCE_COLORS.F}
            labelColor={FORCE_LABEL_COLORS.F}
            label="v"
            unit="m/s"
            dashed={false}
            labelOffset={[0, 0.14 * scale, 0]}
            scale={scale}
          />
          <VectorArrow
            origin={ballCentre}
            vector={[sample.vx, 0, 0]}
            value={sample.vx}
            unitLength={velocityUnit}
            color={FORCE_COLORS.Fdash}
            labelColor={FORCE_LABEL_COLORS.Fdash}
            label="vₓ"
            unit="m/s"
            dashed
            labelOffset={[0, -0.14 * scale, 0]}
            scale={scale}
          />
          <VectorArrow
            origin={ballCentre}
            vector={[0, sample.vy, 0]}
            value={sample.vy}
            unitLength={velocityUnit}
            color={FORCE_COLORS.Fdash}
            labelColor={FORCE_LABEL_COLORS.Fdash}
            label="vᵧ"
            unit="m/s"
            dashed
            labelOffset={[0.16 * scale, 0, 0]}
            scale={scale}
          />
        </>
      ) : null}
      <VectorArrow
        origin={ballCentre}
        vector={[0, -params.g, 0]}
        value={params.g}
        unitLength={gravityUnit}
        color={FORCE_COLORS.G}
        labelColor={FORCE_LABEL_COLORS.G}
        label="g"
        unit="m/s²"
        dashed={false}
        labelOffset={[-0.16 * scale, 0, 0]}
        scale={scale}
      />
      {landingX !== null ? <LandingMarker x={landingX} scale={scale} /> : null}
      {target ? <TargetCup target={target} scale={scale} /> : null}
      <FitCamera extentX={extentX} extentY={extentY} allowRefit={allowRefit} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        zoomSpeed={0.65}
        panSpeed={0.5}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={0.8}
        maxDistance={600}
      />
    </>
  );
}
```

- [ ] **Step 3: 写 `components/projectile-canvas.tsx`**

```tsx
"use client";

import { Canvas } from "@react-three/fiber";

import { ProjectileScene, type ProjectileSceneProps } from "@/components/projectile-scene";

export default function ProjectileCanvas(props: ProjectileSceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ overflow: "visible" }}
      camera={{ position: [1.5, 1.6, 4.5], fov: 45, near: 0.05, far: 2000 }}
      gl={{ antialias: true }}
    >
      <ProjectileScene {...props} />
    </Canvas>
  );
}
```

- [ ] **Step 4: 类型检查 + lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint components lib`
Expected: 两者均无输出。若 tsc 对 `useThree((state) => state.controls)` 的类型断言报错，保留 `as unknown as OrbitControlsImpl | null` 写法。

- [ ] **Step 5: 提交**

```bash
git add components/scene-label.tsx components/projectile-scene.tsx components/projectile-canvas.tsx
git commit -m "Add the projectile 3D scene with ruler, launcher, target, and velocity arrows."
```

---

### Task 5: 预测模式的左栏面板与右栏测量板

纯展示组件：props 进、回调出，不含时钟和物理。

**Files:**
- Create: `components/projectile-prediction-panel.tsx`
- Create: `components/projectile-measurement-board.tsx`

**Interfaces:**
- Consumes: `ParameterControl`（已有）；`PredictionState`, `PredictionPhase`, `PREDICTION_*` 常量（Task 2）
- Produces: `ProjectilePredictionPanel({ state, onHeightChange, onThetaChange, onSubmitEstimate, onPlaceTarget, onRetry, onNewDataset })`
- Produces: `ProjectileMeasurementBoard({ state })`

- [ ] **Step 1: 写 `components/projectile-prediction-panel.tsx`**

```tsx
"use client";

import { useState } from "react";

import { ParameterControl } from "@/components/parameter-control";
import {
  PREDICTION_G,
  PREDICTION_H_MAX,
  PREDICTION_H_MIN,
  PREDICTION_THETA_MAX,
  PREDICTION_THETA_MIN,
  type PredictionPhase,
  type PredictionState,
} from "@/lib/models/projectile-prediction";

const STEPS: { phase: PredictionPhase; label: string }[] = [
  { phase: "measure", label: "1 测初速度" },
  { phase: "predict", label: "2 预测落点" },
  { phase: "result", label: "3 结果" },
];

function formatNumber(value: number) {
  return value.toFixed(2);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

function StepBar({ phase }: { phase: PredictionPhase }) {
  const current = STEPS.findIndex((step) => step.phase === phase);
  return (
    <ol className="grid grid-cols-3 border-b border-line text-[11px]" aria-label="预测步骤">
      {STEPS.map((step, index) => (
        <li
          key={step.phase}
          aria-current={index === current ? "step" : undefined}
          className={`px-2 py-1.5 text-center ${
            index === current
              ? "bg-navy font-medium text-white"
              : index < current
                ? "text-ink"
                : "text-quiet"
          }`}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}

function ReadOnlyRow({ symbol, label, value }: { symbol: string; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 px-1 py-0.5 text-[13px]">
      <p className="min-w-0 truncate text-quiet">
        <span className="font-mono text-ink">{symbol}</span>
        <span className="ml-1.5">{label}</span>
      </p>
      <p className="font-mono tabular-nums text-ink">{value}</p>
    </div>
  );
}

// Student inputs commit on Enter or the button, never on blur: a half-typed
// prediction must not place a target.
function NumberEntry({
  id,
  label,
  unit,
  buttonLabel,
  onSubmit,
}: {
  id: string;
  label: string;
  unit: string;
  buttonLabel: string;
  onSubmit: (value: number) => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const parsed = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      return;
    }
    onSubmit(parsed);
  };
  return (
    <div className="px-1 py-1">
      <label htmlFor={id} className="block text-[12px] text-quiet">
        {label} <span className="font-mono">({unit})</span>
      </label>
      <div className="mt-1 flex gap-1.5">
        <input
          id={id}
          type="number"
          step={0.01}
          inputMode="decimal"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          className="h-8 min-w-0 flex-1 border border-line bg-surface px-2 font-mono text-[13px] tabular-nums text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy"
        />
        <button
          type="button"
          onClick={submit}
          className="h-8 cursor-pointer bg-navy px-3 text-[12px] font-medium text-white hover:opacity-90"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function ProjectilePredictionPanel({
  state,
  onHeightChange,
  onThetaChange,
  onSubmitEstimate,
  onPlaceTarget,
  onRetry,
  onNewDataset,
}: {
  state: PredictionState;
  onHeightChange: (h: number) => void;
  onThetaChange: (thetaDeg: number) => void;
  onSubmitEstimate: (v0: number) => void;
  onPlaceTarget: (x: number) => void;
  onRetry: () => void;
  onNewDataset: () => void;
}) {
  const estimateRejected =
    state.phase === "measure" && state.v0Estimate !== null && !state.v0Accepted;

  return (
    <>
      <StepBar phase={state.phase} />

      <div className="space-y-1 px-1.5 py-1.5">
        {state.phase !== "result" ? (
          <ParameterControl
            id="prediction-h"
            label="发射高度"
            symbol="h"
            unit="m"
            value={state.h}
            min={PREDICTION_H_MIN}
            max={PREDICTION_H_MAX}
            step={0.05}
            onChange={onHeightChange}
          />
        ) : null}
        {state.phase === "predict" ? (
          <ParameterControl
            id="prediction-theta"
            label="发射角"
            symbol="θ"
            unit="°"
            value={state.thetaDeg}
            min={PREDICTION_THETA_MIN}
            max={PREDICTION_THETA_MAX}
            step={1}
            onChange={onThetaChange}
          />
        ) : null}
        {state.phase === "measure" ? (
          <>
            <ReadOnlyRow symbol="θ" label="发射角（锁定）" value="0 °" />
            <ReadOnlyRow symbol="g" label="重力加速度" value={`${formatNumber(PREDICTION_G)} m/s²`} />
            <ReadOnlyRow symbol="v₀" label="初速度" value="?" />
          </>
        ) : null}
        {state.phase === "predict" ? (
          <>
            <ReadOnlyRow symbol="g" label="重力加速度" value={`${formatNumber(PREDICTION_G)} m/s²`} />
            <ReadOnlyRow
              symbol="v₀"
              label="你的估算"
              value={`≈ ${formatNumber(state.v0Estimate ?? 0)} m/s`}
            />
          </>
        ) : null}
      </div>

      {state.phase === "measure" ? (
        <section className="mx-2 border-t border-line pt-2">
          <p className="px-1 font-mono text-[11px] text-ink">
            {state.lastLandingX !== null
              ? `落点 R = ${formatNumber(state.lastLandingX)} m`
              : "发射后在此读出落点 R"}
          </p>
          <NumberEntry
            id="prediction-v0"
            label="你的 v₀ 估算"
            unit="m/s"
            buttonLabel="核对"
            onSubmit={onSubmitEstimate}
          />
          <p
            role="status"
            className={`min-h-4 px-1 text-[11px] ${estimateRejected ? "text-red-700" : "text-quiet"}`}
          >
            {estimateRejected ? "偏差超过 5%，重新计算" : "与真值相差 5% 以内即通过"}
          </p>
        </section>
      ) : null}

      {state.phase === "predict" ? (
        <section className="mx-2 border-t border-line pt-2">
          <NumberEntry
            id="prediction-x"
            label="预测落点 x"
            unit="m"
            buttonLabel="放置标靶"
            onSubmit={onPlaceTarget}
          />
          <p role="status" className="min-h-4 px-1 text-[11px] text-quiet">
            {state.targetPlaced && state.xPredicted !== null
              ? `标靶已放在 x = ${formatNumber(state.xPredicted)} m，按发射`
              : "放置标靶后才能发射"}
          </p>
        </section>
      ) : null}

      {state.phase === "result" && state.outcome ? (
        <section className="mx-2 border-t border-line pt-2">
          <dl className="space-y-0.5 px-1 font-mono text-[12px] tabular-nums">
            {[
              ["真值 v₀", `${formatNumber(state.hiddenV0)} m/s`],
              ["你的估算", `${formatNumber(state.v0Estimate ?? 0)} m/s`],
              ["预测 x", `${formatNumber(state.xPredicted ?? 0)} m`],
              ["实际 x", `${formatNumber(state.outcome.landingX)} m`],
              ["Δx", `${formatSigned(state.outcome.deltaX)} m`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-quiet">{label}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p
            className={`mt-1.5 px-1 text-[13px] font-medium ${
              state.outcome.hit ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {state.outcome.hit ? "命中标靶" : "未命中"}
          </p>
          <div className="mt-2 flex gap-1.5 px-1">
            <button
              type="button"
              onClick={onRetry}
              className="h-8 flex-1 cursor-pointer bg-navy px-3 text-[12px] font-medium text-white hover:opacity-90"
            >
              再预测一次
            </button>
            <button
              type="button"
              onClick={onNewDataset}
              className="h-8 flex-1 cursor-pointer border border-line bg-surface px-3 text-[12px] font-medium text-ink"
            >
              换一组数据
            </button>
          </div>
        </section>
      ) : null}

      <section className="mx-2 mt-2 border-t border-line pt-2">
        <h2 className="text-[13px] font-medium text-ink">公式</h2>
        <div className="mt-1 space-y-1 font-mono text-[11px] leading-5 text-quiet">
          <p>v₀ = R·√(g / 2h)　（水平发射）</p>
          <p>t_L = (v₀sinθ + √(v₀²sin²θ + 2gh)) / g</p>
          <p>x = v₀cosθ·t_L</p>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: 写 `components/projectile-measurement-board.tsx`**

```tsx
"use client";

import { PREDICTION_G, type PredictionState } from "@/lib/models/projectile-prediction";

function formatNumber(value: number) {
  return value.toFixed(2);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

// What a real bench gives the student: heights, angles, and where the ball
// landed. No live charts here; they would expose v0 before the check.
export function ProjectileMeasurementBoard({ state }: { state: PredictionState }) {
  const rows: [string, string, string][] = [
    ["h", "发射高度", `${formatNumber(state.h)} m`],
    ["θ", "发射角", `${state.thetaDeg.toFixed(0)} °`],
    ["g", "重力加速度", `${formatNumber(PREDICTION_G)} m/s²`],
    ["R", "落点", state.lastLandingX !== null ? `${formatNumber(state.lastLandingX)} m` : "—"],
  ];
  if (state.phase !== "measure") {
    rows.push([
      "x̂",
      "预测落点",
      state.xPredicted !== null ? `${formatNumber(state.xPredicted)} m` : "—",
    ]);
    rows.push(["x", "实际落点", state.outcome ? `${formatNumber(state.outcome.landingX)} m` : "—"]);
    rows.push(["Δx", "偏差", state.outcome ? `${formatSigned(state.outcome.deltaX)} m` : "—"]);
  }

  return (
    <section className="flex h-full flex-col border border-line bg-surface">
      <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
        <h2 className="text-xs font-medium text-ink">测量板</h2>
        <p className="font-mono text-[10px] text-quiet">真实实验只能量到这些</p>
      </div>
      <dl className="divide-y divide-line font-mono text-[12px] tabular-nums">
        {rows.map(([symbol, label, value]) => (
          <div key={symbol} className="flex items-center justify-between px-2.5 py-2">
            <dt className="text-quiet">
              <span className="text-ink">{symbol}</span>
              <span className="ml-2">{label}</span>
            </dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-auto border-t border-line px-2.5 py-2 text-[11px] leading-4 text-quiet">
        落地判定后，这里换成 x、y、vₓ、vᵧ 四张运动学图。
      </p>
    </section>
  );
}
```

- [ ] **Step 3: 类型检查 + lint**

Run: `npx tsc --noEmit -p tsconfig.json && npx eslint components`
Expected: 无输出。

- [ ] **Step 4: 提交**

```bash
git add components/projectile-prediction-panel.tsx components/projectile-measurement-board.tsx
git commit -m "Add the prediction-mode panel and measurement board."
```

---

### Task 6: 实验台组件、样式、目录与路由

**Files:**
- Create: `components/projectile-lab.tsx`
- Modify: `app/globals.css`（`.lab-charts` 之后加新类；两个媒体查询块尾部加覆盖）
- Modify: `lib/experiments/catalog.ts:1`, `:69-167`
- Modify: `lib/experiments/catalog.test.ts:26-41`
- Modify: `app/labs/[slug]/page.tsx:3-17`

**Interfaces:**
- Consumes: Task 1–5 全部导出；`ParameterControl`, `TimeSeriesChart`
- Produces: `ProjectileLab()`；`ReadySlug` 含 `"projectile-motion"`

- [ ] **Step 1: 先改目录测试，让它失败**

`lib/experiments/catalog.test.ts` 第 26–41 行替换为：

```ts
test("lists ready labs first within Physics 1", () => {
  const p1 = listExperiments("p1");
  assert.deepEqual(
    p1.filter((item) => item.status === "ready").map((item) => item.slug),
    ["pull-friction", "linear-motion", "projectile-motion"],
  );
  assert.equal(p1[0]?.slug, "pull-friction");
  assert.equal(p1[1]?.slug, "linear-motion");
  assert.equal(p1[2]?.slug, "projectile-motion");
});

test("only ready labs have detail routes", () => {
  assert.deepEqual(listExperimentSlugs(), [
    "pull-friction",
    "linear-motion",
    "projectile-motion",
  ]);
  const pending = listExperiments("all").find((item) => item.status === "pending");
  assert.ok(pending);
  assert.equal(isReadyExperiment(pending), false);
});
```

Run: `npm test 2>&1 | tail -20`
Expected: 两个目录测试失败（数组少了 `projectile-motion`）。

- [ ] **Step 2: 改目录数据**

`lib/experiments/catalog.ts` 第 1 行：

```ts
export type ReadySlug = "pull-friction" | "linear-motion" | "projectile-motion";
```

删除第 158–167 行现有的 `projectile-motion` 条目（`slug: "projectile-motion"` 到其 `},`），在 `linear-motion` 条目（以 `summary: "调节初位置、初速度与加速度，观察匀变速直线运动。",` 结尾的 `},`）之后插入：

```ts
  {
    slug: "projectile-motion",
    title: "抛体落点",
    formula: "x = v₀t, y = ½gt²",
    course: "p1",
    unit: "Unit 1 运动学",
    preview: "projectile",
    status: "ready",
    summary: "平抛或斜抛：参数实验直接调 v₀、θ、h；预测模式先测初速度再预测落点。",
  },
```

Run: `npm test 2>&1 | tail -12`
Expected: `ℹ pass 67`，`fail 0`。

- [ ] **Step 3: 加样式**

`app/globals.css` 在 `.lab-charts { … }` 块之后插入：

```css
.lab-commandbar--modes {
  grid-template-columns: 190px auto 330px minmax(0, 1fr) auto;
}

.mode-switch {
  display: inline-flex;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}

.mode-switch button {
  height: 28px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--color-quiet);
  font-size: 12px;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.mode-switch button + button {
  border-left: 1px solid var(--color-line);
}

.mode-switch button[aria-pressed="true"] {
  background: var(--color-navy);
  color: #fff;
}

.mode-switch button:focus-visible {
  outline: 2px solid var(--color-navy);
  outline-offset: 2px;
}

.lab-board {
  display: flex;
  flex-direction: column;
}
```

在 `@media (max-width: 1279px), (max-height: 719px) { … }` 块末尾（`.lab-scene { min-height: 620px; }` 之后、块的 `}` 之前）追加：

```css
  .lab-commandbar--modes {
    grid-template-columns: 1fr auto;
  }

  .lab-commandbar--modes > :nth-child(2) {
    grid-column: 1;
    grid-row: 2;
  }

  .lab-commandbar--modes > :nth-child(3) {
    grid-column: 2;
    grid-row: 2;
  }

  .lab-commandbar--modes > :nth-child(4) {
    grid-column: 1 / -1;
    grid-row: 3;
  }

  .lab-board {
    grid-column: 1 / -1;
  }
```

在 `@media (max-width: 767px) { … }` 块末尾追加：

```css
  .lab-commandbar--modes > :nth-child(n) {
    grid-column: 1;
    grid-row: auto;
  }
```

- [ ] **Step 4: 写 `components/projectile-lab.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ParameterControl } from "@/components/parameter-control";
import { ProjectileMeasurementBoard } from "@/components/projectile-measurement-board";
import { ProjectilePredictionPanel } from "@/components/projectile-prediction-panel";
import type { SceneTarget, TrailPoint2D } from "@/components/projectile-scene";
import {
  apexHeight,
  flightTime,
  range,
  sampleAt,
  type ProjectileParams,
  type ProjectileSample,
} from "@/lib/models/projectile";
import {
  HIDDEN_V0_MAX,
  canLaunch,
  createPrediction,
  newDataset,
  placeTarget,
  predictionParams,
  recordLanding,
  retryPrediction,
  setHeight,
  setTheta,
  submitV0Estimate,
  type PredictionState,
} from "@/lib/models/projectile-prediction";
import { appendTimeSample } from "@/lib/models/time-series";

const SceneCanvas = dynamic(() => import("@/components/projectile-canvas"), {
  ssr: false,
});

type LabMode = "params" | "predict";

const DEFAULT_PARAMS: ProjectileParams = { v0: 5, thetaDeg: 30, h: 1, g: 9.81 };

const PARAMETER_DEFINITIONS: {
  key: keyof ProjectileParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "v0", label: "初速度", symbol: "v₀", unit: "m/s", min: 0.5, max: 12, step: 0.1 },
  { key: "thetaDeg", label: "发射角", symbol: "θ", unit: "°", min: 0, max: 80, step: 1 },
  { key: "h", label: "发射高度", symbol: "h", unit: "m", min: 0, max: 3, step: 0.05 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

const TRAIL_MAX_POINTS = 400;

function formatNumber(value: number) {
  return value.toFixed(2);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="min-w-0 border-l border-line pl-3">
      <p className="text-[10px] text-quiet">{label}</p>
      <p className="truncate font-mono text-base tabular-nums text-ink">
        {value} <span className="text-[10px] text-quiet">{unit}</span>
      </p>
    </div>
  );
}

function ModeSwitch({ mode, onChange }: { mode: LabMode; onChange: (mode: LabMode) => void }) {
  return (
    <div className="mode-switch" role="group" aria-label="实验模式">
      <button type="button" aria-pressed={mode === "params"} onClick={() => onChange("params")}>
        参数实验
      </button>
      <button type="button" aria-pressed={mode === "predict"} onClick={() => onChange("predict")}>
        预测落点
      </button>
    </div>
  );
}

export function ProjectileLab() {
  const [mode, setMode] = useState<LabMode>("params");
  const [paramsA, setParamsA] = useState<ProjectileParams>(DEFAULT_PARAMS);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [landed, setLanded] = useState(false);
  const [trail, setTrail] = useState<TrailPoint2D[]>([]);
  const [series, setSeries] = useState<ProjectileSample[]>([]);

  const activeParams = useMemo<ProjectileParams>(
    () => (mode === "predict" && prediction ? predictionParams(prediction) : paramsA),
    [mode, paramsA, prediction],
  );

  const paramsRef = useRef(activeParams);
  const modeRef = useRef<LabMode>("params");
  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const frameRef = useRef(0);
  const lastStampRef = useRef(0);

  useEffect(() => {
    paramsRef.current = activeParams;
  }, [activeParams]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const stopLoop = () => {
    playingRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  };

  const pause = () => {
    stopLoop();
    setIsPlaying(false);
  };

  // Puts the ball back on the launcher. Prediction inputs are untouched.
  const clearFlight = () => {
    pause();
    timeRef.current = 0;
    lastStampRef.current = 0;
    setTime(0);
    setLanded(false);
    setTrail([]);
    setSeries([]);
  };

  const startLoop = () => {
    if (playingRef.current) {
      return;
    }
    const params = paramsRef.current;
    if (timeRef.current >= flightTime(params)) {
      timeRef.current = 0;
      setTime(0);
      setLanded(false);
      setTrail([]);
      setSeries([]);
    }

    playingRef.current = true;
    setIsPlaying(true);
    lastStampRef.current = 0;
    setSeries((current) =>
      current.length === 0 ? [sampleAt(params, timeRef.current)] : current,
    );

    const tick = (now: number) => {
      if (!playingRef.current) {
        frameRef.current = 0;
        return;
      }
      if (lastStampRef.current === 0) {
        lastStampRef.current = now;
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(0.05, Math.max(0, (now - lastStampRef.current) / 1000));
      lastStampRef.current = now;
      const p = paramsRef.current;
      const limit = flightTime(p);
      const next = Math.min(limit, timeRef.current + dt);
      timeRef.current = next;
      const sample = sampleAt(p, next);
      setTime(next);
      setSeries((current) => appendTimeSample(current, sample));
      const minGap = Math.max(0.02, range(p) / 300);
      setTrail((current) => {
        const last = current[current.length - 1];
        if (last && Math.hypot(last.x - sample.x, last.y - sample.y) < minGap) {
          return current;
        }
        const appended = [...current, { x: sample.x, y: sample.y }];
        return appended.length > TRAIL_MAX_POINTS
          ? appended.slice(-TRAIL_MAX_POINTS)
          : appended;
      });

      if (next >= limit) {
        playingRef.current = false;
        frameRef.current = 0;
        setIsPlaying(false);
        setLanded(true);
        if (modeRef.current === "predict") {
          setPrediction((current) => (current ? recordLanding(current, sample.x) : current));
        }
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    clearFlight();
    if (mode === "predict") {
      setPrediction((current) =>
        current
          ? current.phase === "result"
            ? retryPrediction(current)
            : { ...current, lastLandingX: null }
          : current,
      );
    }
  };

  const updateParamA = (key: keyof ProjectileParams, value: number) => {
    clearFlight();
    setParamsA((current) => ({ ...current, [key]: value }));
  };

  const switchMode = (next: LabMode) => {
    if (next === mode) {
      return;
    }
    clearFlight();
    if (mode === "predict") {
      setPrediction((current) =>
        current && current.phase === "result" ? retryPrediction(current) : current,
      );
    }
    if (next === "predict") {
      setPrediction((current) => current ?? createPrediction());
    }
    setMode(next);
  };

  const updatePrediction = (updater: (state: PredictionState) => PredictionState) => {
    setPrediction((current) => (current ? updater(current) : current));
  };

  const handleHeight = (h: number) => {
    clearFlight();
    updatePrediction((state) => setHeight(state, h));
  };

  const handleTheta = (thetaDeg: number) => {
    clearFlight();
    updatePrediction((state) => setTheta(state, thetaDeg));
  };

  const handleEstimate = (v0: number) => {
    if (!prediction) {
      return;
    }
    const next = submitV0Estimate(prediction, v0);
    if (next.phase !== prediction.phase) {
      clearFlight();
    }
    setPrediction(next);
  };

  const handlePlaceTarget = (x: number) => {
    updatePrediction((state) => placeTarget(state, x));
  };

  const handleRetry = () => {
    clearFlight();
    updatePrediction(retryPrediction);
  };

  const handleNewDataset = () => {
    clearFlight();
    updatePrediction((state) => newDataset(state));
  };

  const sample = useMemo(() => sampleAt(activeParams, time), [activeParams, time]);
  const tLand = flightTime(activeParams);
  const revealed = mode === "params" || prediction?.phase === "result";
  const speed = Math.hypot(sample.vx, sample.vy);
  const chartSeries =
    series.length > 0 && Math.abs(series[series.length - 1].t - sample.t) < 1e-4
      ? series
      : [...series, sample];

  const frameParams = useMemo<ProjectileParams>(
    () => (mode === "predict" ? { ...activeParams, v0: HIDDEN_V0_MAX } : activeParams),
    [activeParams, mode],
  );

  const target: SceneTarget | null =
    mode === "predict" && prediction && prediction.targetPlaced && prediction.xPredicted !== null
      ? {
          x: prediction.xPredicted,
          state: prediction.outcome ? (prediction.outcome.hit ? "hit" : "miss") : "pending",
          deltaX: prediction.outcome?.deltaX ?? null,
        }
      : null;

  const launchBlocked = mode === "predict" && (!prediction || !canLaunch(prediction));
  const startLabel = mode === "predict" ? "发射" : time > 0 && !landed ? "继续" : "开始";

  let status: string;
  if (mode === "predict" && prediction) {
    if (prediction.phase === "result" && prediction.outcome) {
      status = `${prediction.outcome.hit ? "命中" : "未命中"}，Δx = ${formatSigned(
        prediction.outcome.deltaX,
      )} m`;
    } else if (isPlaying) {
      status = `抛体在空中，t = ${formatNumber(time)} s`;
    } else if (prediction.phase === "measure") {
      status =
        prediction.lastLandingX !== null
          ? `已落地，R = ${formatNumber(prediction.lastLandingX)} m，反推 v₀ 后填入核对`
          : "水平发射，读出落点 R 和高度 h，反推 v₀";
    } else {
      status =
        prediction.targetPlaced && prediction.xPredicted !== null
          ? `标靶在 x = ${formatNumber(prediction.xPredicted)} m，按发射`
          : "输入预测落点并放置标靶后才能发射";
    }
  } else if (tLand === 0) {
    status = "初速度水平且高度为 0，抛体立即落地";
  } else if (landed) {
    status = `已落地，x = ${formatNumber(sample.x)} m`;
  } else if (isPlaying) {
    status = `抛体在空中，t = ${formatNumber(time)} s`;
  } else if (time > 0) {
    status = `已暂停，t = ${formatNumber(time)} s`;
  } else {
    status = `调整参数后按开始。预测射程 R = ${formatNumber(range(activeParams))} m`;
  }

  return (
    <div className="lab-shell bg-paper text-ink">
      <header className="lab-commandbar lab-commandbar--modes border-b border-line bg-surface">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">
            <Link
              href="/"
              className="mr-2 text-[11px] font-normal text-quiet hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              目录
            </Link>
            抛体落点实验台
          </p>
          <p className="font-mono text-[10px] text-quiet">Physics Lab / 运动学</p>
        </div>
        <ModeSwitch mode={mode} onChange={switchMode} />
        <div className="grid min-w-0 grid-cols-3">
          <Stat label="时间 t" value={formatNumber(time)} unit="s" />
          <Stat label="速度 |v|" value={revealed ? formatNumber(speed) : "—"} unit="m/s" />
          <Stat label="水平位移 x" value={formatNumber(sample.x)} unit="m" />
        </div>
        <p role="status" className="min-w-0 truncate text-xs text-quiet" title={status}>
          {status}
        </p>
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={startLoop}
            disabled={isPlaying || launchBlocked}
            className="h-8 min-w-16 cursor-pointer bg-navy px-3 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {startLabel}
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!isPlaying}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            暂停
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink"
          >
            重置
          </button>
        </div>
      </header>

      <main className="lab-workspace">
        <aside className="lab-parameters min-h-0 overflow-y-auto border border-line bg-surface">
          {mode === "params" ? (
            <>
              <div className="border-b border-line px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-ink">参数设置</h2>
                  <span className="font-mono text-[10px] text-quiet">SI</span>
                </div>
                <p className="mt-0.5 text-[11px] text-quiet">
                  改任一参数即回到 t = 0。数字输入按 Enter 确认，滑条立即生效。
                </p>
              </div>

              <div className="space-y-1 px-1.5 py-1.5">
                {PARAMETER_DEFINITIONS.map((item) => (
                  <ParameterControl
                    key={item.key}
                    id={item.key}
                    label={item.label}
                    symbol={item.symbol}
                    unit={item.unit}
                    value={paramsA[item.key]}
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    onChange={(value) => updateParamA(item.key, value)}
                  />
                ))}
              </div>

              <section className="mx-2 mt-2 border-t border-line pt-2">
                <h2 className="text-[13px] font-medium text-ink">公式与当前数值</h2>
                <div className="mt-1 space-y-1 font-mono text-[11px] leading-5">
                  <p className="text-quiet">x = v₀cosθ·t　　y = h + v₀sinθ·t − ½gt²</p>
                  <p>t_L = (v₀sinθ + √(v₀²sin²θ + 2gh)) / g = {formatNumber(tLand)} s</p>
                  <p>R = v₀cosθ·t_L = {formatNumber(range(activeParams))} m</p>
                  <p>y_max = h + (v₀sinθ)² / 2g = {formatNumber(apexHeight(activeParams))} m</p>
                </div>
              </section>
            </>
          ) : prediction ? (
            <ProjectilePredictionPanel
              state={prediction}
              onHeightChange={handleHeight}
              onThetaChange={handleTheta}
              onSubmitEstimate={handleEstimate}
              onPlaceTarget={handlePlaceTarget}
              onRetry={handleRetry}
              onNewDataset={handleNewDataset}
            />
          ) : null}
        </aside>

        <section className="lab-scene min-h-0 border border-line bg-surface">
          <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
            <h2 className="text-xs font-medium text-ink">三维轨迹与速度</h2>
            <p className="font-mono text-[10px] text-quiet">
              {mode === "params" ? "虚线 预测轨迹　实线 v　虚线 vₓ/vᵧ　拖动旋转" : "拖动旋转"}
            </p>
          </div>
          <div className="relative min-h-0 flex-1">
            <SceneCanvas
              params={activeParams}
              sample={sample}
              trail={trail}
              showPrediction={mode === "params"}
              showVelocity={Boolean(revealed)}
              landingX={landed ? sample.x : null}
              target={target}
              frameParams={frameParams}
              allowRefit={time === 0}
            />
          </div>
          <dl className="grid h-12 grid-cols-5 border-t border-line font-mono text-[11px] tabular-nums">
            {[
              ["x", sample.x, "m", true],
              ["y", sample.y, "m", true],
              ["vₓ", sample.vx, "m/s", revealed],
              ["vᵧ", sample.vy, "m/s", revealed],
              ["|v|", speed, "m/s", revealed],
            ].map(([label, value, unit, visible]) => (
              <div key={String(label)} className="border-r border-line px-2 py-1 last:border-r-0">
                <dt className="text-quiet">{label}</dt>
                <dd className="truncate text-ink">
                  {visible ? `${formatNumber(Number(value))} ${unit}` : "—"}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {revealed ? (
          <aside className="lab-charts min-h-0">
            <TimeSeriesChart
              title="水平位移-时间"
              quantity="x"
              unit="m"
              strokeColor="#1E3A5F"
              valueKey="x"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.x}
            />
            <TimeSeriesChart
              title="高度-时间"
              quantity="y"
              unit="m"
              strokeColor="#A16207"
              valueKey="y"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.y}
            />
            <TimeSeriesChart
              title="水平速度-时间"
              quantity="vₓ"
              unit="m/s"
              strokeColor="#2563EB"
              valueKey="vx"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.vx}
            />
            <TimeSeriesChart
              title="竖直速度-时间"
              quantity="vᵧ"
              unit="m/s"
              strokeColor="#6D28D9"
              valueKey="vy"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.vy}
            />
          </aside>
        ) : (
          <aside className="lab-board min-h-0">
            {prediction ? <ProjectileMeasurementBoard state={prediction} /> : null}
          </aside>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: 注册路由**

`app/labs/[slug]/page.tsx` 第 3–4 行的两个 import 之后加：

```ts
import { ProjectileLab } from "@/components/projectile-lab";
```

`LAB_PAGES` 改为：

```ts
const LAB_PAGES: Record<ReadySlug, ComponentType> = {
  "pull-friction": PullFrictionLab,
  "linear-motion": LinearMotionLab,
  "projectile-motion": ProjectileLab,
};
```

- [ ] **Step 6: 测试 + 类型检查 + lint**

Run: `npm test 2>&1 | tail -12 && npx tsc --noEmit -p tsconfig.json && npx eslint app components lib`
Expected: `ℹ pass 67`，`fail 0`；tsc、eslint 无输出。

- [ ] **Step 7: 浏览器冒烟（模式 A）**

Run: `npm run dev`（后台），然后在浏览器打开 `http://localhost:3000/labs/projectile-motion`，窗口 1366x768。检查：

- 顶栏出现「参数实验 | 预测落点」分段按钮，「参数实验」高亮。
- 3D 里能看到地面米尺、发射台、小球在 (0, 1 m)、虚线预测轨迹与落点环。
- 按「开始」：球沿虚线飞，轨迹变 amber，落地时自动停，状态栏「已落地，x = … m」，落点盘和标签出现，右栏四张图有曲线。
- 拖 θ 滑条：球回到发射台、t = 0、虚线轨迹实时变化、相机重新取景。
- 在控制台执行 `document.documentElement.scrollHeight <= window.innerHeight`，Expected: `true`。

- [ ] **Step 8: 浏览器冒烟（模式 B）**

- 点「预测落点」：左栏出现三步进度条，θ 锁 0°，v₀ 显示「?」；顶栏 |v| 为「—」；右栏是测量板；3D 里没有虚线轨迹与速度箭头，只有 g 箭头。
- 按「发射」：球水平飞出落地，测量板 R 有值，落点标签显示 x。
- 用 R 与 h 算 `v₀ = R·√(9.81 / 2h)` 填入，按「核对」：进入步骤 2，球回到发射台。故意填一个偏 10% 的值验证「偏差超过 5%」提示。
- 步骤 2 改 h 为 1.5，用估算 v₀ 算落点填入，按「放置标靶」：3D 出现 navy 小杯；按「发射」：落地后杯子变绿或变红，状态栏显示 Δx，右栏切成四张图，|v| 与速度箭头出现，左栏显示真值 v₀。
- 「再预测一次」回到步骤 2 且真值不变（可再放标靶验证）；「换一组数据」回到步骤 1，v₀ 换新。
- 切回「参数实验」再切回来：B 的阶段与输入保留。
- `document.documentElement.scrollHeight <= window.innerHeight`，Expected: `true`。

- [ ] **Step 9: 提交**

```bash
git add components/projectile-lab.tsx app/globals.css lib/experiments/catalog.ts lib/experiments/catalog.test.ts "app/labs/[slug]/page.tsx"
git commit -m "Add the projectile-landing lab with parameter and prediction modes."
```

---

### Task 7: 设计系统页面文件与最终验证

**Files:**
- Create: `design-system/physics-lab/pages/projectile-motion.md`
- Verify: 全部改动文件

- [ ] **Step 1: 写页面规则**

写入 `design-system/physics-lab/pages/projectile-motion.md`：

```markdown
# Projectile Motion Page Overrides

> **PROJECT:** Physics Lab
> **Page:** 抛体落点实验台
> Rules here override `MASTER.md`.

---

## Page-Specific Rules

### Intent

Two-mode projectile bench in 3D. Mode A exposes v₀, θ, h, g and shows the predicted path live. Mode B hides v₀: measure a horizontal throw, infer v₀, then predict a landing point and fire at a 0.20 m cup. Physics is closed-form TypeScript; WebGL is a viewport only.

### Layout

- Same cockpit shell as 斜向拉力实验台: 52px command bar, then `260px / 1fr / 330px` columns.
- Command bar gains a segmented mode switch (`.lab-commandbar--modes`, `.mode-switch`) between the title and the readouts.
- Left rail swaps by mode: parameter sliders and live formulas (A), or a three-step bar with the current step's controls and inputs (B).
- Right rail is four charts when revealed (A, or B result), otherwise the measurement board.
- No document scroll at widths >=1280px and heights >=720px in either mode. Smaller viewports use the shared scrolling fallback.
- Radius 2px. Hairline borders. No drop shadows.

### Typography

IBM Plex Sans + Noto Sans SC. Numbers IBM Plex Mono, `tabular-nums`. Do not use EB Garamond / Crimson Text on this page.

### Color

Paper `#F8FAFC`, navy `#1E3A5F` for primary actions, the active mode segment, the ground ruler, and the dashed predicted path. Ball slate `#3D5A80`. Flown trail and landing disk amber `#B45309`. Velocity `v` blue `#2563EB`, components `vₓ` / `vᵧ` dashed `#60A5FA`, gravity arrow green `#047857`. Target cup navy while pending, green `#047857` on hit, red `#DC2626` on miss. Charts: x navy, y gold `#A16207`, vₓ blue `#2563EB`, vᵧ violet `#6D28D9`.

### Motion

- WebGL allowed only in the experiment canvas.
- The clock is `requestAnimationFrame` advancing `t`; position is closed-form. It stops automatically at the landing time.
- Any parameter change returns to `t = 0` before applying.
- Camera refits to the stage only while `t = 0`; it never moves during a flight. Mode B frames the stage using v₀ = 8.00 m/s so the true value is not implied.
- CSS transitions 150–200ms on controls. Honor `prefers-reduced-motion` for CSS; do not stop the physics clock.

### Controls, Inputs, and Reveal

- Every parameter combines a number input with a range slider.
- Student inputs (v₀ estimate, predicted x) commit on Enter or their button only, step 0.01.
- Mode B before the result: command bar |v| shows「—」, the right rail shows the measurement board, and the viewport draws only the gravity arrow. Everything is revealed after the landing judgement.
```

- [ ] **Step 2: 全量检查**

先停掉 `npm run dev`，再：

Run: `npm test 2>&1 | tail -12 && npx tsc --noEmit -p tsconfig.json && npx eslint app components lib && npm run build 2>&1 | tail -15`
Expected: `ℹ pass 67`，`fail 0`；tsc、eslint 无输出；`next build` 成功且静态路由列表包含 `/labs/projectile-motion`。

- [ ] **Step 3: 目录首页检查**

浏览器打开 `http://localhost:3000/`：AP Physics 1 区块第三张卡是「抛体落点」，无「等待开发」角标，可点进 `/labs/projectile-motion`。

- [ ] **Step 4: 已有实验台回归**

打开 `/labs/pull-friction` 与 `/labs/linear-motion`，各按一次开始 / 暂停 / 重置，确认四张图仍正常更新（Task 3 改了共用的 `TimeSeriesChart` 与 `appendKinematicSample`）。

- [ ] **Step 5: 截图存证**

1366x768 下分别截「参数实验 落地后」与「预测落点 结果阶段」两张图，存到 `evidence/session4/projectile-a-landed.png` 与 `evidence/session4/projectile-b-result.png`，并写 `evidence/session4/README.md` 记录检查项与结果（格式参考 `evidence/session3/README.md`）。

- [ ] **Step 6: 提交**

```bash
git add design-system/physics-lab/pages/projectile-motion.md evidence/session4
git commit -m "Record the projectile lab page rules and Session 4 evidence."
```
