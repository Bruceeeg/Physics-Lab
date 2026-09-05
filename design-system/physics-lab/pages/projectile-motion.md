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
