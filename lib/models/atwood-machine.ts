export type AtwoodMode = "classic" | "modified";

export type AtwoodParams = {
  m1: number;
  m2: number;
  g: number;
  travel: number;
  mu?: number;
};

export type AtwoodSample = {
  t: number;
  s: number;
  y1: number;
  y2: number;
  v1: number;
  v2: number;
  a: number;
  T: number;
};

export const DEFAULT_ATWOOD: AtwoodParams = {
  m1: 1.0,
  m2: 1.2,
  g: 9.81,
  travel: 0.55,
  mu: 0,
};

function friction(params: AtwoodParams) {
  return params.mu ?? 0;
}

export function acceleration(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const sum = params.m1 + params.m2;
  if (sum <= 1e-12) {
    return 0;
  }
  if (mode === "modified") {
    const drive = params.m2 * params.g - friction(params) * params.m1 * params.g;
    return drive > 0 ? drive / sum : 0;
  }
  return (params.g * (params.m2 - params.m1)) / sum;
}

export function tension(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const a = acceleration(params, mode);
  if (mode === "modified") {
    return params.m2 * (params.g - a);
  }
  return (2 * params.m1 * params.m2 * params.g) / (params.m1 + params.m2);
}

export function timeToStop(params: AtwoodParams, mode: AtwoodMode = "classic") {
  const a = Math.abs(acceleration(params, mode));
  if (a <= 1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.sqrt((2 * params.travel) / a);
}

export function sampleAt(params: AtwoodParams, t: number, mode: AtwoodMode = "classic"): AtwoodSample {
  const tEnd = timeToStop(params, mode);
  const tc = Number.isFinite(tEnd) ? Math.min(Math.max(0, t), tEnd) : Math.max(0, t);
  const a = acceleration(params, mode);
  const s = 0.5 * a * tc * tc;
  const v = a * tc;
  return {
    t: tc,
    s,
    y1: s,
    y2: -s,
    v1: mode === "modified" ? v : -v,
    v2: v,
    a,
    T: tension(params, mode),
  };
}
