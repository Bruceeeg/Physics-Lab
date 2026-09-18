export type RodDensityMode = "linear" | "quadratic" | "turbine";

export type NonuniformRodParams = {
  M: number;
  L: number;
  g: number;
  theta0Deg: number;
  bladeCount: number;
};

export type NonuniformRodSample = {
  t: number;
  theta: number;
  omega: number;
  I: number;
  xcm: number;
  T: number;
  K: number;
  Ug: number;
  E: number;
};

export const DEFAULT_NONUNIFORM_ROD: NonuniformRodParams = {
  M: 1.2,
  L: 0.8,
  g: 9.81,
  theta0Deg: 18,
  bladeCount: 3,
};

export function densityGamma(params: NonuniformRodParams, mode: RodDensityMode) {
  if (mode === "quadratic") {
    return (3 * params.M) / Math.pow(params.L, 3);
  }
  if (mode === "linear") {
    return (2 * params.M) / (params.L * params.L);
  }
  return 0;
}

export function centerOfMass(params: NonuniformRodParams, mode: RodDensityMode) {
  if (mode === "turbine") {
    return params.L / 3;
  }
  if (mode === "quadratic") {
    return (3 / 4) * params.L;
  }
  return (2 / 3) * params.L;
}

export function endInertia(params: NonuniformRodParams, mode: RodDensityMode) {
  if (mode === "turbine") {
    const Icm = (params.M * params.L * params.L) / 18;
    const d = params.L / 3;
    return params.bladeCount * (Icm + params.M * d * d);
  }
  if (mode === "quadratic") {
    return (3 / 5) * params.M * params.L * params.L;
  }
  return 0.5 * params.M * params.L * params.L;
}

export function period(params: NonuniformRodParams, mode: RodDensityMode) {
  const I = endInertia(params, mode);
  const d = centerOfMass(params, mode);
  const mass = mode === "turbine" ? params.bladeCount * params.M : params.M;
  return I > 0 && d > 0 ? 2 * Math.PI * Math.sqrt(I / (mass * params.g * d)) : Number.POSITIVE_INFINITY;
}

export function sampleAt(
  params: NonuniformRodParams,
  t: number,
  mode: RodDensityMode = "linear",
): NonuniformRodSample {
  const time = Math.max(0, t);
  const I = endInertia(params, mode);
  const d = centerOfMass(params, mode);
  const mass = mode === "turbine" ? params.bladeCount * params.M : params.M;
  const T = period(params, mode);
  const w = T > 0 && Number.isFinite(T) ? (2 * Math.PI) / T : 0;
  const th0 = (params.theta0Deg * Math.PI) / 180;
  const theta = mode === "turbine" ? w * time : th0 * Math.cos(w * time);
  const omega = mode === "turbine" ? w : -th0 * w * Math.sin(w * time);
  const K = 0.5 * I * omega * omega;
  const Ug = mass * params.g * d * (1 - Math.cos(mode === "turbine" ? 0 : theta));
  return {
    t: time,
    theta,
    omega,
    I,
    xcm: d,
    T,
    K,
    Ug,
    E: K + Ug,
  };
}
