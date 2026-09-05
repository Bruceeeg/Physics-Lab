# Linear Motion Page Overrides

> **PROJECT:** Physics Lab
> **Page:** 匀变速直线运动
> Rules here override `MASTER.md`.

---

## Page-Specific Rules

### Intent

Interactive kinematics bench, not a marketing page. Preserve motion math. Visual language matches the pull-friction cockpit: Swiss grid, hairline rules, tabular data.

### Layout Overrides

- Desktop is a viewport-filling scientific cockpit, same shell as 斜向拉力实验台.
- At 1366x768: 52px command bar, then `260px / 1fr / 330px` columns for parameters, 1D track, and four charts.
- No document scroll at widths >=1280px and heights >=720px. Smaller viewports use the shared scrolling fallback.
- Radius 2px. Hairline borders. No drop shadows.

### Typography Overrides

Instrument UI, not a journal article. Do not use EB Garamond / Crimson Text on this page.

- **UI / headings / body:** IBM Plex Sans
- **CJK:** Noto Sans SC in the same stack
- **Numbers, equations, axis values:** IBM Plex Mono, `tabular-nums`

### Color Overrides

- **Surfaces:** paper `#F8FAFC`, cards `#FFFFFF`, ink `#0F172A`, quiet `#475569`, line `#CBD5E1`
- **Brand / primary action / x-series:** navy `#1E3A5F`
- **v-series only:** research gold `#A16207`
- Do not use `#2563EB` on this page.

### Motion Overrides

- No GSAP, no scroll reveal, no WebGL.
- The only continuous motion is `requestAnimationFrame` integration of the particle.
- CSS transitions 150-200ms on controls only. Honor `prefers-reduced-motion` for CSS. Do not stop the physics clock.

### Controls and Charts

- Every parameter combines a number input with a range slider.
- Time `t` is a parameter (0-60 s). Slider and number input set the clock immediately. Playback advances `t` in real time until 60 s.
- Right rail shows `x`, `v`, `a`, and `Δx` versus time.
- Geometric origin tick stays at `x = 0` using `toTrackPercent`.
