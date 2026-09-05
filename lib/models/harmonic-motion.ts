export type HarmonicMode = "pendulum" | "spring";

export type HarmonicParams = {
  L: number;
  m: number;
  theta0Deg: number;
  g: number;
  k: number;
  A: number;
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
};

export const DEFAULT_HARMONIC: HarmonicParams = {
  L: 1.0,
  m: 0.3,
  theta0Deg: 12,
  g: 9.81,
  k: 40,
  A: 0.18,
};

export function angularFreq(params: HarmonicParams, mode: HarmonicMode = "pendulum") {
  if (mode === "spring") {
    return Math.sqrt(params.k / params.m);
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
    };
  }
  const th0 = (params.theta0Deg * Math.PI) / 180;
  const theta = th0 * Math.cos(w * time);
  const omega = -th0 * w * Math.sin(w * time);
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
  };
}
