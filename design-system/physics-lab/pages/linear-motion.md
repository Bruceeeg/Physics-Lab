# Linear Motion Page Overrides

> **PROJECT:** Physics Lab
> **Page:** 匀变速直线运动
> Rules here override `MASTER.md`.

---

## Page-Specific Rules

### Intent

Interactive kinematics bench, not a marketing page. Preserve all motion math, playback, and parameter logic. Visual language is a laboratory instrument: Swiss grid, hairline rules, tabular data.

### Layout Overrides

- **Max Width:** 1200px
- **Layout:** Header (title + constitutive equations + transport) then 2-column bench on `lg` (parameters | track + charts). Single column below 1024px.
- **Radius:** 2px everywhere (Swiss). No pill buttons, no 2rem cards.
- **Elevation:** Hairline borders only. No drop shadows. No card hover lift.

### Typography Overrides

Instrument UI, not a journal article. Do not use EB Garamond / Crimson Text on this page.

- **UI / headings / body:** IBM Plex Sans
- **CJK:** Noto Sans SC in the same stack
- **Numbers, equations, axis values:** IBM Plex Mono, `tabular-nums`
- Load via `next/font/google` in the root layout. No runtime Google Fonts CSS import.

### Color Overrides

- **Surfaces:** paper `#F8FAFC`, cards `#FFFFFF`, ink `#0F172A`, quiet `#475569`, line `#CBD5E1`
- **Brand / primary action / x-series:** navy `#1E3A5F` (not gold CTAs)
- **v-series only:** research gold `#A16207` (data encoding, not a second brand)
- Do not use `#2563EB` on this page. One accent family: navy, plus gold as the second kinematic series.

### Motion Overrides

- No GSAP, no scroll reveal, no WebGL.
- The only continuous motion is the existing `requestAnimationFrame` integration of the particle. That is the experiment, not decoration.
- CSS transitions 150-200ms on controls only. Honor `prefers-reduced-motion` for CSS. Do not stop the physics clock.

### Component Overrides

- Transport (开始 / 继续 / 暂停 / 重置) sits with the time readout.
- Predicted curve (from existing samples) is a faint full path; elapsed trail is the heavier stroke. Scale math unchanged.
- Place the geometric origin tick at `x = 0` using the existing `toTrackPercent`, not at the visual center of the label row.
