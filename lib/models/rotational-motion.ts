import type { FrictionKind } from "./lab-format.ts";

export type RollingShape = "disk" | "hoop" | "solid-sphere" | "hollow-sphere";

export type RollingContact = "roll" | "slide";

export type RollingParams = {
  shape: RollingShape;
  m: number;
  r: number;
  h: number;
  thetaDeg: number;
  g: number;
  contact?: RollingContact;
};

export type RollingSample = {
  t: number;
  s: number;
  v: number;
  omega: number;
  x: number;
  y: number;
  Ktrans: number;
  Krot: number;
  Ug: number;
  E: number;
  N: number;
  f: number;
  ax: number;
  ay: number;
  frictionKind: FrictionKind;
  landed: boolean;
};

export const ROLLING_SHAPES: readonly { id: RollingShape; label: string; kappa: number }[] = [
  { id: "disk", label: "圆盘 ½mr²", kappa: 0.5 },
  { id: "hoop", label: "细环 mr²", kappa: 1 },
  { id: "solid-sphere", label: "实心球 ⅖mr²", kappa: 0.4 },
  { id: "hollow-sphere", label: "薄球壳 ⅔mr²", kappa: 2 / 3 },
];

export const DEFAULT_ROLLING: RollingParams = {
  shape: "disk",
  m: 0.8,
  r: 0.08,
  h: 0.6,
  thetaDeg: 25,
  g: 9.81,
};

export function kappa(shape: RollingShape) {
  const found = ROLLING_SHAPES.find((item) => item.id === shape);
  return found?.kappa ?? 0.5;
}

export function accel(params: RollingParams) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  if ((params.contact ?? "roll") === "slide") {
    return params.g * Math.sin(theta);
  }
  return (params.g * Math.sin(theta)) / (1 + kappa(params.shape));
}

export function contactForces(params: RollingParams) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  const N = params.m * params.g * Math.cos(theta);
  const sliding = (params.contact ?? "roll") === "slide";
  if (sliding) {
    return { N, f: 0, frictionKind: "none" as const };
  }
  const k = kappa(params.shape);
  const f = (k / (1 + k)) * params.m * params.g * Math.sin(theta);
  return { N, f, frictionKind: "static" as const };
}

export function pathLength(params: RollingParams) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  const s = Math.sin(theta);
  return s > 1e-9 ? params.h / s : Number.POSITIVE_INFINITY;
}

export function timeToBottom(params: RollingParams) {
  const a = accel(params);
  const s = pathLength(params);
  if (a <= 1e-12 || !Number.isFinite(s)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.sqrt((2 * s) / a);
}

export function speedAtBottom(params: RollingParams) {
  if ((params.contact ?? "roll") === "slide") {
    return Math.sqrt(2 * params.g * params.h);
  }
  return Math.sqrt((2 * params.g * params.h) / (1 + kappa(params.shape)));
}

export function sampleAt(params: RollingParams, t: number): RollingSample {
  const tEnd = timeToBottom(params);
  const landed = Number.isFinite(tEnd) && t >= tEnd - 1e-9;
  const tc = landed ? tEnd : Math.max(0, t);
  const a = accel(params);
  const s = 0.5 * a * tc * tc;
  const v = a * tc;
  const sliding = (params.contact ?? "roll") === "slide";
  const omega = sliding || params.r <= 0 ? 0 : v / params.r;
  const theta = (params.thetaDeg * Math.PI) / 180;
  const x = s * Math.cos(theta);
  const y = params.h - s * Math.sin(theta);
  const I = kappa(params.shape) * params.m * params.r * params.r;
  const Ktrans = 0.5 * params.m * v * v;
  const Krot = sliding ? 0 : 0.5 * I * omega * omega;
  const Ug = params.m * params.g * y;
  const contact = contactForces(params);
  return {
    t: tc,
    s,
    v,
    omega,
    x,
    y,
    Ktrans,
    Krot,
    Ug,
    E: Ktrans + Krot + Ug,
    N: contact.N,
    f: contact.f,
    ax: landed ? 0 : a * Math.cos(theta),
    ay: landed ? 0 : -a * Math.sin(theta),
    frictionKind: contact.frictionKind,
    landed,
  };
}
