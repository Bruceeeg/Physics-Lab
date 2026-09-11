# Lab Display Conventions Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Every mechanics diagram shows two-decimal readouts, lab-frame horizontal/vertical split, and friction that switches with the object's state.

**Architecture:** Shared `formatLabNumber` and `ForceWithXY` feed every scene. Models export `frictionKind` plus lab-frame components where friction or an incline exists.

**Tech Stack:** TypeScript models, React Three Fiber scenes, existing `VectorArrow`.

## Global Constraints

- Display two decimal places; keep full precision inside `step` / closed-form solvers.
- Student axes: x horizontal, y vertical up. Dashed arrows for oblique components.
- Static vs kinetic friction: show only the active branch.
- Incline uses lab-frame xy, not only along-ramp.
- Modified Atwood gains μs and a real static check.

---
