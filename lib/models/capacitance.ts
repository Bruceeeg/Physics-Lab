import { EPS_0 } from "./electric-field.ts";

export const CAP_DURATION = 5;

export type CapMode = "gap" | "dielectric";

export type CapParams = {
  A_cm2: number;
  d0_mm: number;
  d1_mm: number;
  kappa: number;
  V: number;
};

export type CapSample = {
  t: number;
  d: number;
  A: number;
  C: number;
  Q: number;
  E: number;
  U: number;
  kappa: number;
};

export const DEFAULT_CAP: CapParams = {
  A_cm2: 200,
  d0_mm: 8,
  d1_mm: 2,
  kappa: 4,
  V: 12,
};

export function capacitance(A: number, d: number, kappa: number) {
  if (d <= 1e-9) {
    return Number.POSITIVE_INFINITY;
  }
  return (kappa * EPS_0 * A) / d;
}

export function sampleAt(params: CapParams, t: number, mode: CapMode = "gap"): CapSample {
  const tc = Math.min(Math.max(0, t), CAP_DURATION);
  const frac = tc / CAP_DURATION;
  const A = params.A_cm2 / 1e4;
  const kappa = mode === "dielectric" ? 1 + (params.kappa - 1) * frac : 1;
  const d0 = params.d0_mm / 1000;
  const d1 = params.d1_mm / 1000;
  const d = mode === "gap" ? d0 + (d1 - d0) * frac : d0;
  const C = capacitance(A, d, kappa);
  const Q = C * params.V;
  const E = d > 1e-12 ? params.V / d : 0;
  const U = 0.5 * C * params.V * params.V;
  return { t: tc, d, A, C, Q, E, U, kappa };
}
