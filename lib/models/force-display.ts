import { frictionForceLabel } from "./lab-format.ts";
import type { PullDerived } from "./pull-friction";

export const FORCE_COLORS = {
  F: "#2563EB",
  Fdash: "#60A5FA",
  G: "#047857",
  N: "#6D28D9",
  f: "#B45309",
} as const;

export const FORCE_LABEL_COLORS = {
  F: "#1D4ED8",
  Fdash: "#2563EB",
  G: "#059669",
  N: "#7C3AED",
  f: "#D97706",
} as const;

export type ForceMarkStyle = "solid" | "dashed";

export type ForceMark = {
  name: string;
  label: string;
  vector: [number, number, number];
  magnitude: number;
  style: ForceMarkStyle;
  color: string;
  labelColor: string;
  offset: [number, number, number];
};

const EPS = 1e-6;
const COLLINEAR_DOT = 0.98;
const SIDE_SPACING = 0.015;

function hypot3(vector: [number, number, number]) {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function unit(vector: [number, number, number]): [number, number, number] {
  const length = hypot3(vector);
  if (length < EPS) {
    return [0, 0, 0];
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function perpendicular(axis: [number, number, number]): [number, number, number] {
  const [x, y, z] = axis;
  const side: [number, number, number] = [z, 0, -x];
  const length = hypot3(side);
  if (length > 0.2) {
    return [side[0] / length, side[1] / length, side[2] / length];
  }
  return [1, 0, 0];
}

function applyCollinearOffsets(marks: ForceMark[]) {
  const remaining = marks.filter((mark) => hypot3(mark.vector) > EPS);
  const used = new Set<string>();

  for (const seed of remaining) {
    if (used.has(seed.name)) {
      continue;
    }
    const axis = unit(seed.vector);
    const group = remaining.filter((mark) => {
      if (used.has(mark.name)) {
        return false;
      }
      const other = unit(mark.vector);
      return axis[0] * other[0] + axis[1] * other[1] + axis[2] * other[2] >= COLLINEAR_DOT;
    });
    group.sort((a, b) => a.name.localeCompare(b.name));
    for (const mark of group) {
      used.add(mark.name);
    }
    if (group.length < 2) {
      continue;
    }
    const side = perpendicular(axis);
    const mid = (group.length - 1) / 2;
    group.forEach((mark, index) => {
      const k = (index - mid) * SIDE_SPACING;
      mark.offset = [side[0] * k, side[1] * k, side[2] * k];
    });
  }
}

export function forceMarks(derived: PullDerived): ForceMark[] {
  const { Fx, Fz, N, f, G } = derived.forces;
  const pull = Math.hypot(Fx, Fz);
  const marks: ForceMark[] = [];

  if (pull > EPS) {
    marks.push({
      name: "F",
      label: "F",
      vector: [Fx, Fz, 0],
      magnitude: pull,
      style: "solid",
      color: FORCE_COLORS.F,
      labelColor: FORCE_LABEL_COLORS.F,
      offset: [0, 0, 0],
    });
    if (Math.abs(Fx) > EPS) {
      marks.push({
        name: "Fx",
        label: "Fx",
        vector: [Fx, 0, 0],
        magnitude: Fx,
        style: "dashed",
        color: FORCE_COLORS.Fdash,
        labelColor: FORCE_LABEL_COLORS.Fdash,
        offset: [0, 0, 0],
      });
    }
    if (Math.abs(Fz) > EPS) {
      marks.push({
        name: "Fz",
        label: "Fy",
        vector: [0, Fz, 0],
        magnitude: Fz,
        style: "dashed",
        color: FORCE_COLORS.Fdash,
        labelColor: FORCE_LABEL_COLORS.Fdash,
        offset: [0, 0, 0],
      });
    }
  }

  marks.push({
    name: "G",
    label: "G",
    vector: [0, -G, 0],
    magnitude: G,
    style: "solid",
    color: FORCE_COLORS.G,
    labelColor: FORCE_LABEL_COLORS.G,
    offset: [0, 0, 0],
  });

  const showN = N > EPS && derived.mode !== "airborne" && derived.mode !== "liftoff";
  if (showN) {
    marks.push({
      name: "N",
      label: "N",
      vector: [0, N, 0],
      magnitude: N,
      style: "solid",
      color: FORCE_COLORS.N,
      labelColor: FORCE_LABEL_COLORS.N,
      offset: [0, 0, 0],
    });
  }

  if (Math.abs(f) > EPS) {
    const kind = derived.mode === "static" ? "static" : "kinetic";
    marks.push({
      name: "f",
      label: frictionForceLabel(kind),
      vector: [f, 0, 0],
      magnitude: f,
      style: "solid",
      color: FORCE_COLORS.f,
      labelColor: FORCE_LABEL_COLORS.f,
      offset: [0, 0, 0],
    });
  }

  applyCollinearOffsets(marks);
  return marks;
}
