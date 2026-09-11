export const MU_0 = 4 * Math.PI * 1e-7;
export const B_EARTH = 5e-5;
export const MAGNETISM_DURATION = 5;

export type MagnetismMode = "wire" | "magnet" | "solenoid";

export type MagnetismParams = {
  I: number;
  r0_cm: number;
  r1_cm: number;
  m: number;
  n?: number;
  turns?: number;
  length_cm?: number;
};

export type MagnetismSample = {
  t: number;
  r: number;
  B: number;
  BuT: number;
  theta: number;
  thetaDeg: number;
  nI: number;
};

export const DEFAULT_MAGNETISM: MagnetismParams = {
  I: 5,
  r0_cm: 3,
  r1_cm: 12,
  m: 0.8,
  n: 800,
  turns: 200,
  length_cm: 25,
};

function probeRadius(params: MagnetismParams, t: number) {
  const tc = Math.min(Math.max(0, t), MAGNETISM_DURATION);
  const r0 = params.r0_cm / 100;
  const r1 = params.r1_cm / 100;
  return r0 + ((r1 - r0) * tc) / MAGNETISM_DURATION;
}

export function solenoidTurnsPerMeter(params: MagnetismParams) {
  if (params.n && params.n > 0) {
    return params.n;
  }
  const length = (params.length_cm ?? 25) / 100;
  const turns = params.turns ?? 200;
  return length > 1e-9 ? turns / length : 0;
}

export function sampleAt(
  params: MagnetismParams,
  t: number,
  mode: MagnetismMode = "wire",
): MagnetismSample {
  const r = probeRadius(params, t);
  if (mode === "solenoid") {
    const n = solenoidTurnsPerMeter(params);
    const B = MU_0 * n * params.I;
    return {
      t: Math.min(Math.max(0, t), MAGNETISM_DURATION),
      r,
      B,
      BuT: B * 1e6,
      theta: 0,
      thetaDeg: 0,
      nI: n * params.I,
    };
  }
  const B =
    mode === "magnet"
      ? ((MU_0 / (4 * Math.PI)) * (2 * params.m)) / r ** 3
      : (MU_0 * params.I) / (2 * Math.PI * r);
  const theta = Math.atan(B / B_EARTH);
  return {
    t: Math.min(Math.max(0, t), MAGNETISM_DURATION),
    r,
    B,
    BuT: B * 1e6,
    theta,
    thetaDeg: (theta * 180) / Math.PI,
    nI: 0,
  };
}
