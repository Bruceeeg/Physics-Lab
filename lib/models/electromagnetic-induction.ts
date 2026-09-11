export type InductionMode = "coil" | "rail";

export type InductionParams = {
  N: number;
  A: number;
  Bpeak: number;
  w: number;
  z0: number;
  v: number;
  B: number;
  ell: number;
  R: number;
};

export type InductionSample = {
  t: number;
  z: number;
  flux: number;
  emf: number;
  I: number;
  F: number;
  P: number;
};

export const DEFAULT_INDUCTION: InductionParams = {
  N: 40,
  A: 0.002,
  Bpeak: 0.08,
  w: 0.06,
  z0: 0.2,
  v: 0.4,
  B: 0.4,
  ell: 0.2,
  R: 0.5,
};

export function coilDuration(params: InductionParams) {
  return (2 * params.z0) / params.v;
}

export function sampleAt(
  params: InductionParams,
  t: number,
  mode: InductionMode = "coil",
): InductionSample {
  const time = Math.max(0, t);
  if (mode === "rail") {
    const emf = params.B * params.ell * params.v;
    const I = emf / params.R;
    const F = -I * params.ell * params.B;
    return {
      t: time,
      z: params.v * time,
      flux: params.B * params.ell * params.v * time,
      emf,
      I,
      F,
      P: I * I * params.R,
    };
  }
  const z = params.z0 - params.v * time;
  const gauss = Math.exp(-(z * z) / (params.w * params.w));
  const flux = params.N * params.Bpeak * params.A * gauss;
  const emf =
    -params.N *
    params.Bpeak *
    params.A *
    ((2 * z * params.v) / (params.w * params.w)) *
    gauss;
  const I = emf / params.R;
  return {
    t: time,
    z,
    flux,
    emf,
    I,
    F: 0,
    P: I * I * params.R,
  };
}
