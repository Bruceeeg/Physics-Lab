export const COULOMB_K = 8.99e9;
export const EPS_0 = 1 / (4 * Math.PI * COULOMB_K);
export const FIELD_DURATION = 5;

export type ElectricMode = "point" | "dipole" | "gauss" | "pith" | "equipotential";

export type ElectricParams = {
  Q_uC: number;
  q_nC: number;
  r0_cm: number;
  r1_cm: number;
  d_cm: number;
  R_cm?: number;
  pithM?: number;
  pithL_cm?: number;
  g?: number;
};

export type ElectricSample = {
  t: number;
  r: number;
  q: number;
  Q: number;
  E: number;
  Ex: number;
  V: number;
  F: number;
  theta: number;
  flux: number;
  Qenc: number;
};

export const DEFAULT_ELECTRIC: ElectricParams = {
  Q_uC: 2,
  q_nC: 1.5,
  r0_cm: 12,
  r1_cm: 28,
  d_cm: 8,
  R_cm: 10,
  pithM: 0.004,
  pithL_cm: 50,
  g: 9.81,
};

function probeRadius(params: ElectricParams, t: number) {
  const tc = Math.min(Math.max(0, t), FIELD_DURATION);
  const r0 = params.r0_cm / 100;
  const r1 = params.r1_cm / 100;
  return r0 + ((r1 - r0) * tc) / FIELD_DURATION;
}

function extraZeros() {
  return { theta: 0, flux: 0, Qenc: 0 };
}

export function pithSeparation(params: ElectricParams) {
  const q = Math.abs(params.Q_uC) * 1e-6;
  const m = params.pithM ?? 0.004;
  const L = (params.pithL_cm ?? 50) / 100;
  const g = params.g ?? 9.81;
  const mg = m * g;
  if (q < 1e-18 || L <= 1e-6 || mg <= 1e-12) {
    return 0;
  }
  let lo = 1e-4;
  let hi = 2 * L * 0.999;
  for (let i = 0; i < 48; i += 1) {
    const r = 0.5 * (lo + hi);
    const half = r / 2 / L;
    const theta = Math.asin(Math.min(1, half));
    const F = (COULOMB_K * q * q) / (r * r);
    const need = mg * Math.tan(theta);
    if (F > need) {
      lo = r;
    } else {
      hi = r;
    }
  }
  return 0.5 * (lo + hi);
}

export function sampleAt(
  params: ElectricParams,
  t: number,
  mode: ElectricMode = "point",
): ElectricSample {
  const time = Math.min(Math.max(0, t), FIELD_DURATION);
  if (mode === "pith") {
    const q = params.Q_uC * 1e-6;
    const r = pithSeparation(params);
    const L = (params.pithL_cm ?? 50) / 100;
    const theta = Math.asin(Math.min(1, r / (2 * L)));
    const F = r > 1e-12 ? (COULOMB_K * q * q) / (r * r) : 0;
    const E = r > 1e-12 ? (COULOMB_K * Math.abs(q)) / (r * r) : 0;
    const V = r > 1e-12 ? (COULOMB_K * q) / r : 0;
    return {
      t: time,
      r,
      q,
      Q: q,
      E,
      Ex: E,
      V,
      F,
      theta,
      flux: 0,
      Qenc: q,
    };
  }
  const r = probeRadius(params, t);
  const Q = params.Q_uC * 1e-6;
  const q = params.q_nC * 1e-9;
  if (mode === "gauss") {
    const R = (params.R_cm ?? 10) / 100;
    const inside = r < R;
    const Qenc = inside ? 0 : Q;
    const E = r > 1e-12 && !inside ? (COULOMB_K * Math.abs(Q)) / (r * r) : 0;
    const flux = Qenc / EPS_0;
    const V = inside
      ? (COULOMB_K * Q) / R
      : r > 1e-12
        ? (COULOMB_K * Q) / r
        : 0;
    return {
      t: time,
      r,
      q,
      Q,
      E,
      Ex: Q >= 0 ? E : -E,
      V,
      F: q * (Q >= 0 ? E : -E),
      theta: 0,
      flux,
      Qenc,
    };
  }
  if (mode === "dipole") {
    const d = params.d_cm / 100;
    const plus = (COULOMB_K * Q) / (r + d / 2) ** 2;
    const minus = (COULOMB_K * Q) / (r - d / 2) ** 2;
    const Ex = plus - minus;
    const Vplus = (COULOMB_K * Q) / (r + d / 2);
    const Vminus = (-COULOMB_K * Q) / (r - d / 2);
    return {
      t: time,
      r,
      q,
      Q,
      E: Math.abs(Ex),
      Ex,
      V: Vplus + Vminus,
      F: q * Ex,
      ...extraZeros(),
    };
  }
  const E = (COULOMB_K * Math.abs(Q)) / (r * r);
  const V = (COULOMB_K * Q) / r;
  return {
    t: time,
    r,
    q,
    Q,
    E,
    Ex: Q >= 0 ? E : -E,
    V,
    F: q * E,
    ...extraZeros(),
  };
}
