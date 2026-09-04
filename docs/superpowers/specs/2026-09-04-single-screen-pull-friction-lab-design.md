# Single-Screen Pull-Friction Lab Design

**Date:** 2026-09-04
**Status:** Approved through layout mockup 1

## Goal

Turn the pull-friction experiment into a 1366x768 single-screen scientific
instrument centered on the 3D viewport. All controls, live readings, formulas,
and four charts remain visible without vertical page scrolling.

## Layout

- A 52px command bar spans the viewport and contains title, elapsed time,
  velocity, displacement, run state, and Start/Pause/Reset.
- The remaining desktop viewport is a three-column grid:
  - left, 260px: compact parameter controls and active formulas;
  - center, flexible: the dominant 3D viewport and force legend;
  - right, 330px: four stacked live charts.
- At widths below 1280px or heights below 720px, the page may scroll rather
  than hiding controls. Desktop 1366x768 is the no-scroll acceptance target.

## Runtime

- Remove duration from parameters and remove automatic stopping.
- Elapsed time increases until Pause or Reset.
- Reset returns time, position, velocity, trail, and chart history to zero.
- Charts show cumulative history from 0 to current time. The x-axis expands as
  time increases. History is compacted when necessary to keep memory bounded.

## Parameters

- F range: -50 N to 50 N.
- theta range: 0 degrees to 180 degrees.
- Direction validity:
  - F > 0 requires theta in [0, 90];
  - F < 0 requires theta in [90, 180];
  - F = 0 accepts any theta.
- Invalid F/theta combinations pause the clock, do not apply to the physics
  state, and show an inline error.
- Every parameter has both a number input and a range slider. Slider edits
  apply immediately. Number edits apply on Enter or blur and are clamped to
  the parameter range.
- The physical force magnitude is abs(F), while theta is the actual geometric
  angle measured counterclockwise from +x:
  `Fx = abs(F) cos(theta)` and `Fz = abs(F) sin(theta)`.

## Charts and Readings

- Charts: horizontal velocity `vx`, horizontal acceleration `ax`, horizontal
  net force `sum Fx`, and displacement `delta x = x - x(0)`.
- Each chart shows its current value, zero reference, cumulative actual trace,
  min/max values, and elapsed-time domain.
- The command bar always shows elapsed time, speed, and displacement.

## 3D Force Display

- Arrow length remains the force-magnitude encoding.
- Existing thin shafts and arrowheads remain.
- Collinear arrows use 0.015m center-to-center separation, enough to preserve
  parallel strokes while appearing almost adjacent.
- WebGL sprite labels remain synchronized with the arrows.

## Verification

- Model tests cover signed-force validation, signed force components,
  displacement samples, cumulative history compaction, and 0.015m offsets.
- Browser checks cover 1366x768 no-scroll layout, number and slider parity,
  indefinite clock behavior, invalid-pair pause/error, and all four live
  charts.
