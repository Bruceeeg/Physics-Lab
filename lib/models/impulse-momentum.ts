export type ImpulseMode = "collision" | "explosion";

export type ImpulseParams = {
  m1: number;
  v1: number;
  m2: number;
  v2: number;
  e: number;
  U?: number;
};

export type ImpulseSample = {
  t: number;
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  F: number;
  p1: number;
  p2: number;
  pTotal: number;
};

export const CART_HALF = 0.12;
export const CONTACT_DURATION = 0.08;
export const X1_0 = -0.8;
export const X2_0 = 0.8;

export const DEFAULT_IMPULSE: ImpulseParams = {
  m1: 1,
  v1: 1.8,
  m2: 1,
  v2: 0,
  e: 1,
  U: 0.8,
};

export function explosionVelocities(params: ImpulseParams) {
  const U = Math.max(0, params.U ?? 0.8);
  const { m1, m2 } = params;
  const sum = m1 + m2;
  const v1f = -Math.sqrt((2 * U * m2) / (m1 * sum));
  const v2f = Math.sqrt((2 * U * m1) / (m2 * sum));
  return { v1f, v2f };
}

export function contactTime(params: ImpulseParams) {
  const gap = X2_0 - X1_0 - 2 * CART_HALF;
  const closing = params.v1 - params.v2;
  if (closing <= 1e-9) {
    return Number.POSITIVE_INFINITY;
  }
  return gap / closing;
}

export function postVelocities(params: ImpulseParams) {
  const { m1, m2, v1, v2, e } = params;
  const sum = m1 + m2;
  const v1f = (m1 * v1 + m2 * v2 + m2 * e * (v2 - v1)) / sum;
  const v2f = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / sum;
  return { v1f, v2f };
}

export function impulseOn2(params: ImpulseParams) {
  return params.m2 * (postVelocities(params).v2f - params.v2);
}

function pulseFraction(tau: number, duration: number) {
  return 0.5 * (1 - Math.cos((Math.PI * tau) / duration));
}

function displacementDuringPulse(vi: number, vf: number, tau: number, duration: number) {
  return vi * tau + (vf - vi) * 0.5 * (tau - (duration / Math.PI) * Math.sin((Math.PI * tau) / duration));
}

export function sampleAt(
  params: ImpulseParams,
  t: number,
  mode: ImpulseMode = "collision",
): ImpulseSample {
  if (mode === "explosion") {
    const time = Math.max(0, t);
    const duration = CONTACT_DURATION;
    const { v1f, v2f } = explosionVelocities(params);
    const J = params.m2 * v2f;
    const x1c = -CART_HALF;
    const x2c = CART_HALF;
    let x1: number;
    let x2: number;
    let u1: number;
    let u2: number;
    let F = 0;
    if (time < duration) {
      const frac = pulseFraction(time, duration);
      u1 = v1f * frac;
      u2 = v2f * frac;
      x1 = x1c + displacementDuringPulse(0, v1f, time, duration);
      x2 = x2c + displacementDuringPulse(0, v2f, time, duration);
      F = J * (Math.PI / (2 * duration)) * Math.sin((Math.PI * time) / duration);
    } else {
      u1 = v1f;
      u2 = v2f;
      x1 = x1c + displacementDuringPulse(0, v1f, duration, duration) + v1f * (time - duration);
      x2 = x2c + displacementDuringPulse(0, v2f, duration, duration) + v2f * (time - duration);
    }
    return {
      t: time,
      x1,
      x2,
      v1: u1,
      v2: u2,
      F,
      p1: params.m1 * u1,
      p2: params.m2 * u2,
      pTotal: params.m1 * u1 + params.m2 * u2,
    };
  }
  const time = Math.max(0, t);
  const tc = contactTime(params);
  const duration = CONTACT_DURATION;
  const { v1f, v2f } = postVelocities(params);
  const J = impulseOn2(params);

  let x1: number;
  let x2: number;
  let u1: number;
  let u2: number;
  let F = 0;

  if (!Number.isFinite(tc) || time <= tc) {
    u1 = params.v1;
    u2 = params.v2;
    x1 = X1_0 + params.v1 * time;
    x2 = X2_0 + params.v2 * time;
  } else if (time < tc + duration) {
    const tau = time - tc;
    const frac = pulseFraction(tau, duration);
    u1 = params.v1 + (v1f - params.v1) * frac;
    u2 = params.v2 + (v2f - params.v2) * frac;
    const x1c = X1_0 + params.v1 * tc;
    const x2c = X2_0 + params.v2 * tc;
    x1 = x1c + displacementDuringPulse(params.v1, v1f, tau, duration);
    x2 = x2c + displacementDuringPulse(params.v2, v2f, tau, duration);
    F = J * (Math.PI / (2 * duration)) * Math.sin((Math.PI * tau) / duration);
  } else {
    u1 = v1f;
    u2 = v2f;
    const x1c = X1_0 + params.v1 * tc;
    const x2c = X2_0 + params.v2 * tc;
    const span = duration;
    x1 = x1c + displacementDuringPulse(params.v1, v1f, span, duration) + v1f * (time - tc - duration);
    x2 = x2c + displacementDuringPulse(params.v2, v2f, span, duration) + v2f * (time - tc - duration);
  }

  return {
    t: time,
    x1,
    x2,
    v1: u1,
    v2: u2,
    F,
    p1: params.m1 * u1,
    p2: params.m2 * u2,
    pTotal: params.m1 * u1 + params.m2 * u2,
  };
}
