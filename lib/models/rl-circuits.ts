export type RlMode = "grow" | "decay" | "lc";

export type RlParams = {
  R: number;
  L_mH: number;
  C_uF: number;
  emf: number;
};

export type RlSample = {
  t: number;
  tau: number;
  I: number;
  VL: number;
  VR: number;
  Q: number;
  omega: number;
};

export const DEFAULT_RL: RlParams = {
  R: 12,
  L_mH: 80,
  C_uF: 100,
  emf: 8,
};

export function inductance(params: RlParams) {
  return params.L_mH * 1e-3;
}

export function capacitance(params: RlParams) {
  return params.C_uF * 1e-6;
}

export function rlTau(params: RlParams) {
  return params.R > 1e-12 ? inductance(params) / params.R : Number.POSITIVE_INFINITY;
}

export function lcOmega(params: RlParams) {
  const L = inductance(params);
  const C = capacitance(params);
  return L > 0 && C > 0 ? 1 / Math.sqrt(L * C) : 0;
}

export function rlDuration(params: RlParams, mode: RlMode) {
  if (mode === "lc") {
    const w = lcOmega(params);
    return w > 0 ? (4 * Math.PI) / w : 2;
  }
  const tau = rlTau(params);
  return Number.isFinite(tau) ? 5 * tau : 2;
}

export function sampleAt(params: RlParams, t: number, mode: RlMode = "grow"): RlSample {
  const time = Math.max(0, t);
  const L = inductance(params);
  const tau = rlTau(params);
  const Iinf = params.R > 1e-12 ? params.emf / params.R : 0;
  if (mode === "lc") {
    const C = capacitance(params);
    const w = lcOmega(params);
    const Q0 = C * params.emf;
    const Q = Q0 * Math.cos(w * time);
    const I = -Q0 * w * Math.sin(w * time);
    return {
      t: time,
      tau,
      I,
      VL: -L * Q0 * w * w * Math.cos(w * time),
      VR: 0,
      Q,
      omega: w,
    };
  }
  if (mode === "decay") {
    const decay = Number.isFinite(tau) && tau > 0 ? Math.exp(-time / tau) : 0;
    const I = Iinf * decay;
    const dIdt = tau > 0 ? -Iinf * decay / tau : 0;
    return {
      t: time,
      tau,
      I,
      VL: L * dIdt,
      VR: I * params.R,
      Q: 0,
      omega: 0,
    };
  }
  const grow = Number.isFinite(tau) && tau > 0 ? Math.exp(-time / tau) : 0;
  const I = Iinf * (1 - grow);
  const dIdt = tau > 0 ? (Iinf * grow) / tau : 0;
  return {
    t: time,
    tau,
    I,
    VL: L * dIdt,
    VR: I * params.R,
    Q: 0,
    omega: 0,
  };
}
