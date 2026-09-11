export const OPTICS_DURATION = 6;

export type OpticsMode = "convex" | "concave";

export type OpticsParams = {
  f_cm: number;
  s_cm: number;
  h_cm: number;
};

export type OpticsSample = {
  t: number;
  s: number;
  f: number;
  sp: number;
  m: number;
  hp: number;
  real: boolean;
  fMeas: number;
  infinite: boolean;
};

export const DEFAULT_OPTICS: OpticsParams = {
  f_cm: 20,
  s_cm: 50,
  h_cm: 4,
};

export function imageDistance(focal: number, objectDistance: number) {
  const denom = objectDistance - focal;
  if (Math.abs(denom) < 1e-9) {
    return Number.NaN;
  }
  return (objectDistance * focal) / denom;
}

export function sampleAt(
  params: OpticsParams,
  t: number,
  mode: OpticsMode = "convex",
): OpticsSample {
  const time = Math.max(0, t);
  const s = params.s_cm / 100;
  const f = (mode === "concave" ? -params.f_cm : params.f_cm) / 100;
  const h = params.h_cm / 100;
  const infinite = Math.abs(s - f) < 1e-4;
  const sp = infinite ? Number.NaN : imageDistance(f, s);
  const m = infinite || !Number.isFinite(sp) ? Number.NaN : -sp / s;
  const hp = Number.isFinite(m) ? m * h : Number.NaN;
  const fMeas =
    Number.isFinite(sp) && s !== 0 && sp !== 0 ? 1 / (1 / s + 1 / sp) : Number.NaN;
  return {
    t: time,
    s,
    f,
    sp,
    m,
    hp,
    real: Number.isFinite(sp) && sp > 0,
    fMeas,
    infinite,
  };
}
