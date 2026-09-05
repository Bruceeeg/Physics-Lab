export type AngMomMode = "drop" | "skater";

export type AngMomParams = {
  M: number;
  R: number;
  omega0: number;
  m: number;
  r: number;
  h: number;
  g: number;
  IScale?: number;
};

export type AngMomSample = {
  t: number;
  y: number;
  phi: number;
  omega: number;
  I: number;
  L: number;
  stuck: boolean;
};

export const DEFAULT_ANGMOM: AngMomParams = {
  M: 2.0,
  R: 0.35,
  omega0: 6,
  m: 0.4,
  r: 0.22,
  h: 0.45,
  g: 9.81,
  IScale: 0.45,
};

export function IDisk(params: AngMomParams) {
  return 0.5 * params.M * params.R * params.R;
}

export function IAfter(params: AngMomParams) {
  return IDisk(params) + params.m * params.r * params.r;
}

export function fallTime(params: AngMomParams) {
  if (params.h <= 0 || params.g <= 0) {
    return 0;
  }
  return Math.sqrt((2 * params.h) / params.g);
}

export function omegaAfter(params: AngMomParams) {
  const I2 = IAfter(params);
  return I2 > 0 ? (IDisk(params) * params.omega0) / I2 : 0;
}

export function skaterI2(params: AngMomParams) {
  return IDisk(params) * Math.min(1, Math.max(0.2, params.IScale ?? 0.45));
}

export function sampleAt(params: AngMomParams, t: number, mode: AngMomMode = "drop"): AngMomSample {
  if (mode === "skater") {
    const time = Math.max(0, t);
    const I1 = IDisk(params);
    const I2 = skaterI2(params);
    const tPull = 0.6;
    const pulled = time >= tPull;
    const I = pulled ? I2 : I1;
    const omega = pulled ? (I1 * params.omega0) / I2 : params.omega0;
    const phi = pulled
      ? params.omega0 * tPull + ((I1 * params.omega0) / I2) * (time - tPull)
      : params.omega0 * time;
    return {
      t: time,
      y: 0,
      phi,
      omega,
      I,
      L: I1 * params.omega0,
      stuck: pulled,
    };
  }
  const time = Math.max(0, t);
  const tf = fallTime(params);
  const stuck = time >= tf;
  const y = stuck ? 0 : params.h - 0.5 * params.g * time * time;
  const omega = stuck ? omegaAfter(params) : params.omega0;
  const phi = stuck
    ? params.omega0 * tf + omegaAfter(params) * (time - tf)
    : params.omega0 * time;
  const I = stuck ? IAfter(params) : IDisk(params);
  return {
    t: time,
    y: Math.max(0, y),
    phi,
    omega,
    I,
    L: IDisk(params) * params.omega0,
    stuck,
  };
}
