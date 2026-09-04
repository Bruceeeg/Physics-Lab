# 斜向拉力 3D 实验台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage 2D uniform-acceleration lab with a 3D pull-and-friction bench driven by a tested pure-function solver.

**Architecture:** `derive`/`step` live in `lib/models/pull-friction.ts` with no React or Three. The lab shell owns playback and copy. The R3F canvas is a client-only view of pose and force arrows.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, `@react-three/fiber`, `@react-three/drei`, Three.js. No Rapier/Cannon.

## Global Constraints

- θ range 0–80 degrees, upward only.
- Live param edits keep `x,z,vx,vz,t`; recompute forces next frame; do not auto-reset.
- Reset returns origin rest, `t = 0`, empty trail.
- Clamp `muK = min(muK, muS)`.
- Visual language: paper `#F8FAFC`, navy `#1E3A5F`, gold `#A16207` for second series, IBM Plex, 2px radius, hairline borders.
- WebGL only inside the experiment viewport.
- Homepage is this experiment only; do not keep a second route for the old 2D lab.

---

### Task 1: Vitest + solver tests then implementation

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script and vitest)
- Create: `lib/models/pull-friction.test.ts`
- Create: `lib/models/pull-friction.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `PullParams`, `PullState`, `derive`, `step`, `initialState`, `clampMuK`

- [ ] **Step 1: Add vitest**

```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run"`.

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 2: Write failing tests** in `lib/models/pull-friction.test.ts` for: frictionless horizontal \(a=F/m\); stuck below static threshold; lift-off when \(F\sin\theta \ge mg\); raising \(F\) leaves stuck; live param change keeps `x`.

- [ ] **Step 3: Run tests — expect FAIL** (`derive` not found)

- [ ] **Step 4: Implement `derive` + `step`** in `lib/models/pull-friction.ts` (semi-implicit Euler, inelastic landing \(z=0,v_z=0\), static clamp when \(|v_x|<\varepsilon\) and \(|F_x|\le\mu_s N\)).

- [ ] **Step 5: Run tests — expect PASS**

---

### Task 2: Lab UI shell (clock, params, alerts, formulas)

**Files:**
- Create: `components/pull-friction-lab.tsx`
- Modify: `app/layout.tsx` metadata
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `derive`, `step`, `initialState`, `clampMuK`
- Produces: `PullFrictionLab` default playback + 2D placeholder slot for scene

- [ ] **Step 6: Build lab chrome** matching existing instrument UI: sliders F/θ/m/μs/μk/g/T, transport, alert copy, live N/f/ax/az/v, formula list with current-branch highlight.

- [ ] **Step 7: Param change is live** (do not reset time). Reset clears trail and state.

---

### Task 3: 3D scene

**Files:**
- Create: `components/pull-friction-scene.tsx`
- Modify: `components/pull-friction-lab.tsx` to mount scene via `next/dynamic` `{ ssr: false }`

**Interfaces:**
- Consumes: `{ x, z, vx, forces, mode }` from lab
- Produces: ground, box, F/G/N/f arrows, trail of visited positions

- [ ] **Step 8: Install** `three @react-three/fiber @react-three/drei @types/three`

- [ ] **Step 9: Scene** with OrbitControls (limited polar), scale 1 unit = 1 m, arrows proportional to force, hide N when 0, trail only past positions.

---

### Task 4: Design overlay + homepage swap + verify

**Files:**
- Create: `design-system/physics-lab/pages/pull-friction.md`
- Modify: `app/page.tsx` to render `PullFrictionLab` only

- [ ] **Step 10: Page override** allowing WebGL in the viewport only.

- [ ] **Step 11: `npm test` and `npm run build`**

- [ ] **Step 12: Browser** play/pause/reset, stuck, lift-off, live F arrow update.

---
