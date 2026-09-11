export const GAS_R = 8.314;
export const BOYLE_DURATION = 4;

export type BoyleMode = "isothermal" | "work";

export type BoyleParams = {
  n: number;
  T: number;
  V0_cm3: number;
  Vf_cm3: number;
};

export type BoyleSample = {
  t: number;
  V: number;
  P: number;
  PV: number;
  W: number;
  Vcm3: number;
  PkPa: number;
};

export const DEFAULT_BOYLE: BoyleParams = {
  n: 0.004,
  T: 293,
  V0_cm3: 100,
  Vf_cm3: 50,
};

export function volumeSi(cm3: number) {
  return cm3 * 1e-6;
}

export function gasPressure(params: BoyleParams, volume: number) {
  return (params.n * GAS_R * params.T) / volume;
}

export function sampleAt(
  params: BoyleParams,
  t: number,
  _mode: BoyleMode = "isothermal",
): BoyleSample {
  const tc = Math.min(Math.max(0, t), BOYLE_DURATION);
  const V0 = volumeSi(params.V0_cm3);
  const Vf = volumeSi(params.Vf_cm3);
  const V = V0 + ((Vf - V0) * tc) / BOYLE_DURATION;
  const P = gasPressure(params, V);
  const W = params.n * GAS_R * params.T * Math.log(V0 / V);
  return {
    t: tc,
    V,
    P,
    PV: P * V,
    W,
    Vcm3: V * 1e6,
    PkPa: P / 1000,
  };
}
