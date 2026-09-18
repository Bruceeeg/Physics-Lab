import { integrateMotion } from "./rk4.ts";

export type VariableForceMode = "fx" | "ft" | "rocket" | "pulley";

export type VariableForceParams = {
  m: number;
  g: number;
  c: number;
  n: number;
  A: number;
  alpha: number;
  beta: number;
  v0: number;
  K: number;
  Lcoeff: number;
  tBurn: number;
  T: number;
  H: number;
  x0: number;
  muK: number;
};

export type VariableForceSample = {
  t: number;
  x: number;
  y: number;
  v: number;
  a: number;
  F: number;
  Fx: number;
  Fy: number;
  N: number;
  f: number;
  J: number;
  W: number;
  K: number;
  U: number;
  E: number;
};

export const DEFAULT_VARIABLE_FORCE: VariableForceParams = {
  m: 0.5,
  g: 9.81,
  c: 40,
  n: 1,
  A: 0.2,
  alpha: 3200,
  beta: -500,
  v0: 3,
  K: 9,
  Lcoeff: 0.25,
  tBurn: 6,
  T: 8,
  H: 0.4,
  x0: 1.2,
  muK: 0.1,
};

export function restoringForce(params: VariableForceParams, x: number) {
  const mag = params.c * Math.pow(Math.abs(x), Math.max(0, params.n));
  if (x === 0) {
    return params.n === 0 ? params.c : 0;
  }
  return params.n === 0 ? params.c : -Math.sign(x) * mag;
}

export function workFromA(params: VariableForceParams, x: number) {
  const n = Math.max(0, params.n);
  if (n === 0) {
    return params.c * (params.A - x);
  }
  return (params.c / (n + 1)) * (Math.pow(params.A, n + 1) - Math.pow(Math.abs(x), n + 1));
}

export function forceTime(params: VariableForceParams, t: number) {
  const time = Math.max(0, t);
  return params.alpha * time * time + params.beta * time;
}

export function contactEnd(params: VariableForceParams) {
  if (params.alpha === 0) {
    return params.beta === 0 ? 0 : Number.POSITIVE_INFINITY;
  }
  const root = -params.beta / params.alpha;
  return root > 1e-9 ? root : Number.POSITIVE_INFINITY;
}

export function impulseFt(params: VariableForceParams, t: number) {
  const tc = Math.min(Math.max(0, t), contactEnd(params));
  return (params.alpha * tc * tc * tc) / 3 + (params.beta * tc * tc) / 2;
}

export function rocketAccel(params: VariableForceParams, t: number) {
  return t < params.tBurn - 1e-12 ? params.K - params.Lcoeff * t * t : -params.g;
}

export function rocketVelocity(params: VariableForceParams, t: number): number {
  const time = Math.max(0, t);
  if (time <= params.tBurn) {
    return params.K * time - (params.Lcoeff * time * time * time) / 3;
  }
  const vBurn = params.K * params.tBurn - (params.Lcoeff * params.tBurn * params.tBurn * params.tBurn) / 3;
  return vBurn - params.g * (time - params.tBurn);
}

export function rocketHeight(params: VariableForceParams, t: number): number {
  const time = Math.max(0, t);
  if (time <= params.tBurn) {
    return (params.K * time * time) / 2 - (params.Lcoeff * time * time * time * time) / 12;
  }
  const dt = time - params.tBurn;
  const vB = rocketVelocity(params, params.tBurn);
  const yBurn = (params.K * params.tBurn * params.tBurn) / 2 - (params.Lcoeff * params.tBurn ** 4) / 12;
  return yBurn + vB * dt - 0.5 * params.g * dt * dt;
}

export function rocketApexTime(params: VariableForceParams) {
  const vB = rocketVelocity(params, params.tBurn);
  if (vB <= 0) {
    return params.tBurn;
  }
  return params.tBurn + vB / params.g;
}

export function rocketLandTime(params: VariableForceParams) {
  const yB = rocketHeight(params, params.tBurn);
  const vB = rocketVelocity(params, params.tBurn);
  const disc = vB * vB + 2 * params.g * yB;
  if (disc < 0) {
    return rocketApexTime(params);
  }
  return params.tBurn + (vB + Math.sqrt(disc)) / params.g;
}

export function pulleyRadius(params: VariableForceParams, x: number) {
  return Math.hypot(x, params.H);
}

export function pulleyComponents(params: VariableForceParams, x: number) {
  const r = Math.max(pulleyRadius(params, x), 1e-9);
  const Fx = (-params.T * x) / r;
  const Fy = (params.T * params.H) / r;
  const N = params.m * params.g - Fy;
  return { r, Fx, Fy, N };
}

export function durationOf(params: VariableForceParams, mode: VariableForceMode) {
  if (mode === "ft") {
    const end = contactEnd(params);
    return Number.isFinite(end) ? end + 0.8 : 2;
  }
  if (mode === "rocket") {
    return rocketLandTime(params);
  }
  if (mode === "pulley") {
    return 2.4;
  }
  if (params.n === 1 && params.c > 0) {
    return 2 * Math.PI * Math.sqrt(params.m / params.c);
  }
  return 2.2;
}

function sampleFx(params: VariableForceParams, t: number): VariableForceSample {
  const time = Math.max(0, t);
  if (params.n === 1 && params.c > 0) {
    const w = Math.sqrt(params.c / params.m);
    const x = params.A * Math.cos(w * time);
    const v = -params.A * w * Math.sin(w * time);
    const F = -params.c * x;
    const K = 0.5 * params.m * v * v;
    const U = 0.5 * params.c * x * x;
    return {
      t: time,
      x,
      y: 0,
      v,
      a: F / params.m,
      F,
      Fx: F,
      Fy: 0,
      N: params.m * params.g,
      f: 0,
      J: params.m * (v - 0),
      W: 0.5 * params.c * (params.A * params.A - x * x),
      K,
      U,
      E: K + U,
    };
  }
  const acc = (x: number) => restoringForce(params, x) / params.m;
  const state = integrateMotion(params.A, 0, time, (x, _v) => acc(x));
  const F = restoringForce(params, state.x);
  const K = 0.5 * params.m * state.v * state.v;
  const U = workFromA(params, state.x);
  return {
    t: time,
    x: state.x,
    y: 0,
    v: state.v,
    a: F / params.m,
    F,
    Fx: F,
    Fy: 0,
    N: params.m * params.g,
    f: 0,
    J: params.m * state.v,
    W: workFromA(params, state.x),
    K,
    U: 0.5 * params.c * params.A * params.A - U,
    E: K + (0.5 * params.c * params.A * params.A - U),
  };
}

function sampleFt(params: VariableForceParams, t: number): VariableForceSample {
  const time = Math.max(0, t);
  const tEnd = contactEnd(params);
  const tc = Number.isFinite(tEnd) ? Math.min(time, tEnd) : time;
  const F = time <= tEnd + 1e-12 ? forceTime(params, tc) : 0;
  const J = impulseFt(params, tc);
  const vCoast = params.v0 + J / params.m;
  const xDuring =
    params.v0 * tc + (1 / params.m) * ((params.alpha * tc ** 4) / 12 + (params.beta * tc ** 3) / 6);
  const x =
    time <= tEnd + 1e-12 ? xDuring : xDuring + vCoast * (time - tEnd);
  const v = time <= tEnd + 1e-12 ? params.v0 + J / params.m : vCoast;
  const a = F / params.m;
  const K = 0.5 * params.m * v * v;
  return {
    t: time,
    x,
    y: 0,
    v,
    a,
    F,
    Fx: F,
    Fy: 0,
    N: params.m * params.g,
    f: 0,
    J,
    W: J * ((params.v0 + v) / 2),
    K,
    U: 0,
    E: K,
  };
}

function sampleRocket(params: VariableForceParams, t: number): VariableForceSample {
  const land = rocketLandTime(params);
  const time = Math.min(Math.max(0, t), land);
  const y = Math.max(0, rocketHeight(params, time));
  const v = y <= 1e-9 && time >= land - 1e-6 ? 0 : rocketVelocity(params, time);
  const a = y <= 1e-9 && time >= land - 1e-6 ? 0 : rocketAccel(params, time);
  const Fnet = params.m * a;
  const K = 0.5 * params.m * v * v;
  const U = params.m * params.g * y;
  return {
    t: time,
    x: 0,
    y,
    v,
    a,
    F: Fnet,
    Fx: 0,
    Fy: Fnet,
    N: 0,
    f: 0,
    J: params.m * v,
    W: K + U,
    K,
    U,
    E: K + U,
  };
}

function samplePulley(params: VariableForceParams, t: number): VariableForceSample {
  const acc = (x: number, v: number) => {
    if (x <= 0.08) {
      return 0;
    }
    const { Fx, N } = pulleyComponents(params, x);
    if (N <= 0) {
      return Fx / params.m;
    }
    const f = params.muK * N * (Math.abs(v) < 1e-4 ? (Fx < 0 ? 1 : -1) : Math.sign(v));
    return (Fx - f) / params.m;
  };
  const state = integrateMotion(params.x0, 0, Math.max(0, t), acc, 0.002, (x) => x <= 0.08);
  const x = Math.max(0.08, state.x);
  const { Fx, Fy, N } = pulleyComponents(params, x);
  const stopped = x <= 0.0805;
  const v = stopped ? 0 : state.v;
  const f = N > 0 ? params.muK * N * (Math.abs(v) < 1e-4 ? 1 : Math.sign(v)) : 0;
  const a = stopped ? 0 : (Fx - f) / params.m;
  const W = params.T * (pulleyRadius(params, params.x0) - pulleyRadius(params, x));
  const K = 0.5 * params.m * v * v;
  return {
    t: state.t,
    x,
    y: 0,
    v,
    a,
    F: params.T,
    Fx,
    Fy,
    N: Math.max(0, N),
    f,
    J: params.m * v,
    W,
    K,
    U: 0,
    E: K,
  };
}

export function sampleAt(
  params: VariableForceParams,
  t: number,
  mode: VariableForceMode = "fx",
): VariableForceSample {
  if (mode === "ft") {
    return sampleFt(params, t);
  }
  if (mode === "rocket") {
    return sampleRocket(params, t);
  }
  if (mode === "pulley") {
    return samplePulley(params, t);
  }
  return sampleFx(params, t);
}
