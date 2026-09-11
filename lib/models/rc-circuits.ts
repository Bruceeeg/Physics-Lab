export type RcMode = "charge" | "discharge";

export type RcParams = {
  R: number;
  C_uF: number;
  emf: number;
};

export type RcSample = {
  t: number;
  tau: number;
  Vc: number;
  I: number;
  Q: number;
  Vr: number;
};

export const DEFAULT_RC: RcParams = {
  R: 2000,
  C_uF: 100,
  emf: 10,
};

export function timeConstant(params: RcParams) {
  return params.R * params.C_uF * 1e-6;
}

export function chargeDuration(params: RcParams) {
  return 5 * timeConstant(params);
}

export function sampleAt(params: RcParams, t: number, mode: RcMode = "charge"): RcSample {
  const tau = timeConstant(params);
  const cap = params.C_uF * 1e-6;
  const time = Math.max(0, t);
  const settled = tau > 0 && time >= 5 * tau;
  if (mode === "discharge") {
    if (settled) {
      return { t: time, tau, Vc: 0, I: 0, Q: 0, Vr: 0 };
    }
    const decay = tau > 0 ? Math.exp(-time / tau) : 0;
    const Vc = params.emf * decay;
    const I = tau > 0 ? -(params.emf / params.R) * decay : 0;
    return { t: time, tau, Vc, I, Q: cap * Vc, Vr: -Vc };
  }
  if (settled) {
    return { t: time, tau, Vc: params.emf, I: 0, Q: cap * params.emf, Vr: 0 };
  }
  const grow = tau > 0 ? Math.exp(-time / tau) : 0;
  const Vc = params.emf * (1 - grow);
  const I = tau > 0 ? (params.emf / params.R) * grow : 0;
  return { t: time, tau, Vc, I, Q: cap * Vc, Vr: I * params.R };
}
