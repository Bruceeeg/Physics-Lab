export type InertiaShape = "disk" | "hoop" | "rod";

export type RotationN2Params = {
  shape: InertiaShape;
  M: number;
  R: number;
  L: number;
  m: number;
  r: number;
  g: number;
  travel: number;
};

export type RotationN2Sample = {
  t: number;
  s: number;
  y: number;
  v: number;
  a: number;
  alpha: number;
  omega: number;
  phi: number;
  T: number;
  tau: number;
  I: number;
  Iexp: number;
};

export const INERTIA_SHAPES: readonly { id: InertiaShape; label: string }[] = [
  { id: "disk", label: "圆盘 ½MR²" },
  { id: "hoop", label: "细环 MR²" },
  { id: "rod", label: "细杆 ML²/12" },
];

export const DEFAULT_ROTATION_N2: RotationN2Params = {
  shape: "disk",
  M: 1.2,
  R: 0.18,
  L: 0.6,
  m: 0.25,
  r: 0.025,
  g: 9.81,
  travel: 0.55,
};

export function theoryI(params: RotationN2Params) {
  if (params.shape === "hoop") {
    return params.M * params.R * params.R;
  }
  if (params.shape === "rod") {
    return (params.M * params.L * params.L) / 12;
  }
  return 0.5 * params.M * params.R * params.R;
}

export function linearAccel(params: RotationN2Params) {
  const I = theoryI(params);
  const denom = I + params.m * params.r * params.r;
  return denom > 1e-12 ? (params.m * params.g * params.r * params.r) / denom : 0;
}

export function timeToFloor(params: RotationN2Params) {
  const a = linearAccel(params);
  if (a <= 1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.sqrt((2 * params.travel) / a);
}

export function sampleAt(params: RotationN2Params, t: number): RotationN2Sample {
  const tEnd = timeToFloor(params);
  const landed = Number.isFinite(tEnd) && t >= tEnd - 1e-9;
  const tc = landed ? tEnd : Math.max(0, t);
  const a = linearAccel(params);
  const s = 0.5 * a * tc * tc;
  const v = a * tc;
  const alpha = params.r > 1e-12 ? a / params.r : 0;
  const omega = params.r > 1e-12 ? v / params.r : 0;
  const I = theoryI(params);
  const T = params.m * (params.g - a);
  const tau = T * params.r;
  const Iexp = Math.abs(alpha) > 1e-9 ? tau / alpha : I;
  return {
    t: tc,
    s,
    y: -s,
    v,
    a: landed ? 0 : a,
    alpha: landed ? 0 : alpha,
    omega,
    phi: omega * tc * 0.5,
    T,
    tau,
    I,
    Iexp,
  };
}
