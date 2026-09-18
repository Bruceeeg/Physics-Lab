import { kappa, type RollingShape } from "./rotational-motion.ts";
import { integrateMotion } from "./rk4.ts";

export type LoopMode = "slide" | "roll";

export type LoopParams = {
  m: number;
  R: number;
  h: number;
  g: number;
  shape: RollingShape;
};

export type LoopSample = {
  t: number;
  phi: number;
  s: number;
  x: number;
  y: number;
  v: number;
  omega: number;
  N: number;
  K: number;
  Ug: number;
  E: number;
  looping: boolean;
  left: boolean;
};

export const DEFAULT_LOOP: LoopParams = {
  m: 0.4,
  R: 0.35,
  h: 1.2,
  g: 9.81,
  shape: "solid-sphere",
};

export function inertiaFactor(params: LoopParams, mode: LoopMode) {
  return mode === "roll" ? 1 + kappa(params.shape) : 1;
}

export function minLoopHeight(params: LoopParams, mode: LoopMode) {
  return 2 * params.R + 0.5 * params.R * inertiaFactor(params, mode);
}

export function speedFromHeight(params: LoopParams, y: number, mode: LoopMode) {
  const drop = params.h - y;
  if (drop <= 0) {
    return 0;
  }
  return Math.sqrt((2 * params.g * drop) / inertiaFactor(params, mode));
}

export function normalForce(params: LoopParams, phi: number, v: number) {
  return params.m * ((v * v) / params.R + params.g * Math.cos(phi));
}

export function canLoop(params: LoopParams, mode: LoopMode) {
  return params.h + 1e-9 >= minLoopHeight(params, mode);
}

function loopPoint(params: LoopParams, phi: number): { x: number; y: number } {
  return {
    x: params.R * Math.sin(phi),
    y: params.R * (1 - Math.cos(phi)),
  };
}

export function sampleAt(params: LoopParams, t: number, mode: LoopMode = "slide"): LoopSample {
  const time = Math.max(0, t);
  const factor = inertiaFactor(params, mode);
  const R = Math.max(params.R, 1e-9);
  const gOverR = params.g / (R * factor);
  const v0 = speedFromHeight(params, 0, mode);
  const omega0 = v0 / R;

  const state = integrateMotion(0, omega0, time, (phi) => -gOverR * Math.sin(phi), 0.002, (phi, omega) => {
    const v = Math.abs(omega) * R;
    const N = normalForce(params, phi, v);
    return N < 0 && phi > Math.PI / 2;
  });

  let phi = state.x;
  let omega = state.v;
  const pt = loopPoint(params, phi);
  const v = Math.abs(omega) * R;
  let N = normalForce(params, phi, v);
  const left = N < 0 && phi > Math.PI / 2;
  if (left) {
    N = 0;
  }
  const Ktrans = 0.5 * params.m * v * v;
  const Krot = mode === "roll" ? 0.5 * kappa(params.shape) * params.m * v * v : 0;
  const Ug = params.m * params.g * pt.y;
  const E0 = params.m * params.g * params.h;
  return {
    t: state.t,
    phi,
    s: phi * R,
    x: pt.x,
    y: pt.y,
    v,
    omega: mode === "roll" ? omega : 0,
    N: Math.max(0, N),
    K: Ktrans + Krot,
    Ug,
    E: E0,
    looping: canLoop(params, mode) && !left,
    left,
  };
}

export function durationOf(params: LoopParams) {
  const v = speedFromHeight(params, 0, "slide");
  return v > 1e-9 ? Math.max(2.4, (2 * Math.PI * params.R) / v) : 3;
}
