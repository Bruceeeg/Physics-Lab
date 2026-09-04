# Pull-Friction Page Overrides

> **PROJECT:** Physics Lab
> **Page:** 斜向拉力实验台
> Rules here override `MASTER.md`.

---

## Page-Specific Rules

### Intent

Interactive force-and-friction bench in 3D. Physics is solved in TypeScript; WebGL is a viewport only.

### Layout

- Desktop is a viewport-filling scientific cockpit centered on the 3D scene.
- At 1366x768: 52px command bar, then `260px / 1fr / 330px` columns for parameters, 3D, and four charts.
- No document scroll at widths >=1280px and heights >=720px. Smaller viewports use the explicit scrolling fallback.
- Radius 2px. Hairline borders. No drop shadows.

### Typography

IBM Plex Sans + Noto Sans SC. Numbers IBM Plex Mono, `tabular-nums`.

### Color

Paper `#F8FAFC`, navy `#1E3A5F` for primary actions. The sliding block is translucent slate `#3D5A80` with ink `#0F172A` edges. Viewport forces: blue `#2563EB` F (dashed components `#60A5FA`), green `#047857` G, violet `#6D28D9` N, amber `#B45309` friction and trail.

### Motion

- WebGL allowed only in the experiment canvas.
- Physics clock is `requestAnimationFrame` integration. CSS transitions 150–200ms on controls.
- Honor `prefers-reduced-motion` for CSS; do not stop the physics clock.
- Force arrows start at the block center. Same-direction overlaps use a nearly adjacent perpendicular offset. No world axes helper. Dashed components use segmented cylinders. Labels are bold and vivid with a paper-colored glyph stroke, no white pill.
- The experiment has no duration limit. Time and cumulative chart domains grow until Pause or Reset.
- Same-direction force arrows use approximately 0.015m separation so the lines remain parallel but appear nearly adjacent.

### Controls and Charts

- Every parameter combines a number input with a range slider.
- `F` ranges from -50N to 50N; its sign must agree with the left/right half-plane selected by theta.
- The right rail always shows cumulative `vx`, `ax`, horizontal net force, and displacement charts.
