export type ArchimedesParams = {
  rhoObj: number;
  rhoFluid: number;
  side: number;
  g: number;
};

export type ArchimedesSample = {
  t: number;
  s: number;
  Vsub: number;
  Fb: number;
  T: number;
  W: number;
  rhoMeas: number;
  fullyIn: boolean;
};

export const DEFAULT_ARCHIMEDES: ArchimedesParams = {
  rhoObj: 2700,
  rhoFluid: 1000,
  side: 0.08,
  g: 9.81,
};

export const LOWER_DURATION = 3.2;
export const START_GAP = 0.18;

export function volume(params: ArchimedesParams) {
  return params.side * params.side * params.side;
}

export function mass(params: ArchimedesParams) {
  return params.rhoObj * volume(params);
}

export function sampleAt(params: ArchimedesParams, t: number): ArchimedesSample {
  const tc = Math.min(Math.max(0, t), LOWER_DURATION);
  const start = -START_GAP;
  const end = params.side + 0.12;
  const s = start + ((end - start) * tc) / LOWER_DURATION;
  const submergedH = Math.min(params.side, Math.max(0, s));
  const Vsub = params.side * params.side * submergedH;
  const Fb = params.rhoFluid * Vsub * params.g;
  const W = mass(params) * params.g;
  const T = Math.max(0, W - Fb);
  const fullyIn = s >= params.side - 1e-6;
  const rhoMeas = fullyIn && volume(params) > 0 ? Fb / (volume(params) * params.g) : 0;
  return { t: tc, s, Vsub, Fb, T, W, rhoMeas, fullyIn };
}
