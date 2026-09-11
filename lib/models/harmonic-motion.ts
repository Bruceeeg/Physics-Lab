export type HarmonicMode = "pendulum" | "spring" | "physical";

export type HarmonicParams = {
  L: number;
  m: number;
  theta0Deg: number;
  g: number;
  k: number;
  A: number;
  pivotFrac?: number;
};

export type HarmonicSample = {
  t: number;
  theta: number;
  omega: number;
  x: number;
  y: number;
  v: number;
  K: number;
  Us: number;
  Ug: number;
  E: number;
  T: number;
  I: number;
  d: number;
};

export const DEFAULT_HARMONIC: HarmonicParams = {
  L: 1.0,
  m: 0.3,
  theta0Deg: 12,
  g: 9.81,
  k: 40,
  A: 0.18,
  pivotFrac: 0,
};

export function physicalPivotDistance(params: HarmonicParams) {
  const frac = Math.min(0.45, Math.max(0, params.pivotFrac ?? 0));
  return Math.abs(params.L / 2 - frac * params.L);
}

export function physicalInertia(params: HarmonicParams) {
  const d = physicalPivotDistance(params);
  return (params.m * params.L * params.L) / 12 + params.m * d * d;
}

export function angularFreq(params: HarmonicParams, mode: HarmonicMode = "pendulum") {
  if (mode === "spring") {
    return Math.sqrt(params.k / params.m);
  }
  if (mode === "physical") {
    const d = physicalPivotDistance(params);
    const I = physicalInertia(params);
    return I > 0 && d > 1e-9 ? Math.sqrt((params.m * params.g * d) / I) : 0;
  }
  return Math.sqrt(params.g / params.L);
}

export function period(params: HarmonicParams, mode: HarmonicMode = "pendulum") {
  const w = angularFreq(params, mode);
  return w > 0 ? (2 * Math.PI) / w : Number.POSITIVE_INFINITY;
}

export function sampleAt(
  params: HarmonicParams,
  t: number,
  mode: HarmonicMode = "pendulum",
): HarmonicSample {
  const time = Math.max(0, t);
  const w = angularFreq(params, mode);
  if (mode === "spring") {
    const x = params.A * Math.cos(w * time);
    const v = -params.A * w * Math.sin(w * time);
    const K = 0.5 * params.m * v * v;
    const Us = 0.5 * params.k * x * x;
    return {
      t: time,
      theta: 0,
      omega: 0,
      x,
      y: 0,
      v,
      K,
      Us,
      Ug: 0,
      E: K + Us,
      T: period(params, mode),
      I: 0,
      d: 0,
    };
  }
  const th0 = (params.theta0Deg * Math.PI) / 180;
  const theta = th0 * Math.cos(w * time);
  const omega = -th0 * w * Math.sin(w * time);
  if (mode === "physical") {
    const d = physicalPivotDistance(params);
    const I = physicalInertia(params);
    const x = d * Math.sin(theta);
    const y = -d * Math.cos(theta);
    const v = d * omega;
    const K = 0.5 * I * omega * omega;
    const Ug = params.m * params.g * d * (1 - Math.cos(theta));
    return {
      t: time,
      theta,
      omega,
      x,
      y,
      v,
      K,
      Us: 0,
      Ug,
      E: K + Ug,
      T: period(params, mode),
      I,
      d,
    };
  }
  const x = params.L * Math.sin(theta);
  const y = -params.L * Math.cos(theta);
  const v = params.L * omega;
  const K = 0.5 * params.m * v * v;
  const Ug = 0.5 * params.m * params.g * params.L * theta * theta;
  return {
    t: time,
    theta,
    omega,
    x,
    y,
    v,
    K,
    Us: 0,
    Ug,
    E: K + Ug,
    T: period(params, mode),
    I: 0,
    d: params.L,
  };
}
