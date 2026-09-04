# Single-Screen Pull-Friction Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved three-column, unlimited-runtime pull-friction lab that fits 1366x768 and exposes sliders plus numeric inputs.

**Architecture:** Keep physics and sampling in pure TypeScript. Keep the interactive experiment in `PullFrictionLab`, split compact parameter controls and charts into focused components, and leave Three.js isolated behind the dynamic canvas boundary.

**Tech Stack:** Next.js 16.3, React 19, TypeScript 6, Tailwind CSS 4, React Three Fiber 9, Node test runner.

## Global Constraints

- Preserve the current force/contact solver except for the approved signed-force semantics.
- Desktop 1366x768 must have no document-level vertical scroll.
- No duration or automatic stop.
- Charts retain cumulative history from zero and keep memory bounded.
- No new runtime dependency.

---

### Task 1: Signed parameters and validation

**Files:**
- Modify: `lib/models/pull-friction.ts`
- Modify: `lib/models/pull-friction.test.ts`

**Interfaces:**
- Produces: `validatePullParams(params): PullParamIssue | null`
- Produces: force components based on `abs(F)` and geometric `thetaDeg`

- [ ] Add failing tests for valid positive/right, valid negative/left, invalid sign-angle pairs, and zero force.
- [ ] Run `npm test` and confirm the new assertions fail.
- [ ] Implement `validatePullParams` and signed-force component semantics.
- [ ] Run `npm test` and confirm all model tests pass.

### Task 2: Cumulative displacement sampling

**Files:**
- Modify: `lib/models/pull-friction.ts`
- Modify: `lib/models/pull-friction.test.ts`

**Interfaces:**
- Extends: `KinematicSample` with `dx`
- Updates: `appendKinematicSample` to retain first and latest samples while compacting older points

- [ ] Add failing tests for `dx = x - initialX` and bounded cumulative history.
- [ ] Run `npm test` and verify the failures.
- [ ] Implement displacement sampling and history compaction.
- [ ] Run `npm test` and confirm all tests pass.

### Task 3: Near-adjacent collinear arrows

**Files:**
- Modify: `lib/models/force-display.ts`
- Modify: `lib/models/force-display.test.ts`

- [ ] Change offset assertions to require approximately 0.015m separation and run them red.
- [ ] Set `SIDE_SPACING` to 0.015m.
- [ ] Run `npm test` green.

### Task 4: Compact parameter control

**Files:**
- Create: `components/parameter-control.tsx`
- Modify: `components/pull-friction-lab.tsx`

**Interfaces:**
- Consumes: label, unit, value, min, max, step, error, `onChange`
- Produces: synchronized number input and range slider

- [ ] Implement local text draft, Enter/blur commit, clamping, and accessible error state.
- [ ] Replace slider-only rows and remove duration.
- [ ] Pause on invalid F/theta drafts and keep the last valid applied parameters.
- [ ] Run TypeScript and ESLint.

### Task 5: Unlimited runtime and four cumulative charts

**Files:**
- Modify: `components/kinematic-charts.tsx`
- Modify: `components/pull-friction-lab.tsx`

- [ ] Remove projected/duration traces and automatic stop.
- [ ] Make chart x-domain `0..max(currentTime, 10)` and add displacement.
- [ ] Keep actual series live until Pause or Reset.
- [ ] Run TypeScript, ESLint, and tests.

### Task 6: Approved single-screen cockpit layout

**Files:**
- Modify: `components/pull-friction-lab.tsx`
- Modify: `design-system/physics-lab/pages/pull-friction.md`

- [ ] Build the 52px command bar and `260px / 1fr / 330px` main grid.
- [ ] Put compact parameters/formulas left, 3D center, four charts right.
- [ ] Add a safe scrolling fallback below 1280px or 720px height.
- [ ] Verify at 1366x768 that `scrollHeight <= innerHeight`.

### Task 7: Final verification

**Files:**
- Verify all modified files.

- [ ] Run `npm test`.
- [ ] Run `npx tsc --noEmit -p tsconfig.json`.
- [ ] Run `npx eslint components lib/models`.
- [ ] Browser-test Start/Pause/Reset, numeric input, slider, invalid pair, negative force, and four chart updates.
- [ ] Capture a 1366x768 screenshot and compare it with approved mockup 1.
