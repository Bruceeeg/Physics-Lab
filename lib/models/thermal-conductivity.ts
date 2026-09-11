export const THERMAL_DURATION = 8;
export const THERMAL_TAU = 2.2;

export type ThermalMode = "single" | "compare";

export type ThermalParams = {
  k: number;
  k2: number;
  A_cm2: number;
  L_cm: number;
  Th: number;
  Tc: number;
};

export type ThermalSample = {
  t: number;
  H: number;
  H2: number;
  Tmid: number;
  dT: number;
  frac: number;
};

export const DEFAULT_THERMAL: ThermalParams = {
  k: 400,
  k2: 80,
  A_cm2: 4,
  L_cm: 20,
  Th: 373,
  Tc: 273,
};

export function heatCurrent(params: ThermalParams, conductivity = params.k) {
  const area = params.A_cm2 * 1e-4;
  const length = params.L_cm / 100;
  return (conductivity * area * (params.Th - params.Tc)) / length;
}

export function sampleAt(
  params: ThermalParams,
  t: number,
  _mode: ThermalMode = "single",
): ThermalSample {
  const tc = Math.min(Math.max(0, t), THERMAL_DURATION);
  const done = tc >= THERMAL_DURATION - 1e-12;
  const frac = done ? 1 : 1 - Math.exp(-tc / THERMAL_TAU);
  const Hss = heatCurrent(params, params.k);
  const H2ss = heatCurrent(params, params.k2);
  return {
    t: tc,
    H: Hss * frac,
    H2: H2ss * frac,
    Tmid: 0.5 * (params.Th + params.Tc),
    dT: params.Th - params.Tc,
    frac,
  };
}
