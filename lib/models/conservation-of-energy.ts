export type EnergyMode = "launch" | "attached";

export type EnergyParams = {
  k: number;
  A: number;
  m: number;
  thetaDeg: number;
  g: number;
};

export type EnergySample = {
  t: number;
  s: number;
  v: number;
  y: number;
  K: number;
  Us: number;
  Ug: number;
  E: number;
  connected: boolean;
};

export const DEFAULT_ENERGY: EnergyParams = {
  k: 200,
  A: 0.15,
  m: 0.5,
  thetaDeg: 25,
  g: 9.81,
};

export const CART_HEIGHT = 0.14;
export const CART_SIZE: [number, number, number] = [0.22, CART_HEIGHT, 0.18];
export const TRACK_SURFACE_Y = 0.02;
export const RAMP_THICKNESS = 0.04;

export function cartPlacement(s: number, thetaDeg: number): {
  position: [number, number, number];
  tilt: number;
} {
  const half = CART_HEIGHT / 2;
  if (s <= 0) {
    return { position: [s, TRACK_SURFACE_Y + half, 0], tilt: 0 };
  }
  const theta = (thetaDeg * Math.PI) / 180;
  const nx = -Math.sin(theta);
  const ny = Math.cos(theta);
  const surfaceX = s * Math.cos(theta);
  const surfaceY = TRACK_SURFACE_Y + s * Math.sin(theta);
  return {
    position: [surfaceX + nx * half, surfaceY + ny * half, 0],
    tilt: theta,
  };
}

export function rampMeshPlacement(rampLen: number, thetaDeg: number): {
  position: [number, number, number];
  tilt: number;
} {
  const theta = (thetaDeg * Math.PI) / 180;
  const half = RAMP_THICKNESS / 2;
  const mid = rampLen / 2;
  const nx = -Math.sin(theta);
  const ny = Math.cos(theta);
  const surfaceX = mid * Math.cos(theta);
  const surfaceY = TRACK_SURFACE_Y + mid * Math.sin(theta);
  return {
    position: [surfaceX - nx * half, surfaceY - ny * half, 0],
    tilt: theta,
  };
}

export function cartOnRampLocal(s: number, rampLen: number): [number, number, number] {
  return [s - rampLen / 2, RAMP_THICKNESS / 2 + CART_HEIGHT / 2, 0];
}

function omega(params: EnergyParams) {
  return Math.sqrt(params.k / params.m);
}

function sinTheta(params: EnergyParams) {
  return Math.sin((params.thetaDeg * Math.PI) / 180);
}

export function launchSpeed(params: EnergyParams) {
  return params.A * omega(params);
}

export function springTime(params: EnergyParams) {
  return Math.PI / (2 * omega(params));
}

export function climbTime(params: EnergyParams) {
  const accel = params.g * sinTheta(params);
  if (accel <= 1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  return launchSpeed(params) / accel;
}

export function cyclePeriod(params: EnergyParams) {
  return 2 * (springTime(params) + climbTime(params));
}

export function maxHeight(params: EnergyParams) {
  return (0.5 * params.k * params.A * params.A) / (params.m * params.g);
}

export function attachedDelta(params: EnergyParams) {
  return (params.m * params.g * sinTheta(params)) / params.k;
}

export function attachedSMax(params: EnergyParams) {
  const delta = attachedDelta(params);
  return Math.hypot(params.A, delta) - delta;
}

export function attachedMaxHeight(params: EnergyParams) {
  return attachedSMax(params) * sinTheta(params);
}

export function peakHeight(params: EnergyParams, mode: EnergyMode) {
  return mode === "attached" ? attachedMaxHeight(params) : maxHeight(params);
}

export function attachedLoopPeriod(params: EnergyParams) {
  const w = omega(params);
  const psi = Math.atan2(-params.A, attachedDelta(params));
  return Math.PI / w + (-2 * psi) / w;
}

function energies(
  params: EnergyParams,
  t: number,
  s: number,
  v: number,
  springLoaded: boolean,
): EnergySample {
  const Us = springLoaded ? 0.5 * params.k * s * s : 0;
  const y = s > 0 ? s * sinTheta(params) : 0;
  const Ug = params.m * params.g * y;
  const K = 0.5 * params.m * v * v;
  return {
    t: Math.max(0, t),
    s,
    v,
    y,
    K,
    Us,
    Ug,
    E: K + Us + Ug,
    connected: springLoaded,
  };
}

function sampleLaunch(params: EnergyParams, t: number): EnergySample {
  const period = cyclePeriod(params);
  const tau = Number.isFinite(period) ? ((t % period) + period) % period : Math.max(0, t);
  const tSpring = springTime(params);
  const tClimb = climbTime(params);
  const w = omega(params);
  const vl = launchSpeed(params);
  const accel = params.g * sinTheta(params);

  let s: number;
  let v: number;
  if (tau <= tSpring) {
    s = -params.A * Math.cos(w * tau);
    v = params.A * w * Math.sin(w * tau);
  } else if (tau <= tSpring + tClimb) {
    const tr = tau - tSpring;
    s = vl * tr - 0.5 * accel * tr * tr;
    v = vl - accel * tr;
  } else if (tau <= tSpring + 2 * tClimb) {
    const tr = tau - tSpring - tClimb;
    const sMax = (vl * vl) / (2 * accel);
    s = sMax - 0.5 * accel * tr * tr;
    v = -accel * tr;
  } else {
    const tc = tau - tSpring - 2 * tClimb;
    s = -params.A * Math.sin(w * tc);
    v = -params.A * w * Math.cos(w * tc);
  }

  return energies(params, t, s, v, s <= 0);
}

function sampleAttached(params: EnergyParams, t: number): EnergySample {
  const w = omega(params);
  const A = params.A;
  const delta = attachedDelta(params);
  const B = Math.hypot(A, delta);
  const psi = Math.atan2(-A, delta);
  const t1 = Math.PI / (2 * w);
  const tRamp = -2 * psi / w;
  const tFlat = Math.PI / w;
  const loop = tRamp + tFlat;
  const time = Math.max(0, t);

  let s: number;
  let v: number;
  if (time <= t1) {
    s = -A * Math.cos(w * time);
    v = A * w * Math.sin(w * time);
  } else {
    const tau = loop > 1e-12 ? (time - t1) % loop : 0;
    if (tRamp > 1e-12 && tau <= tRamp) {
      const phase = w * tau + psi;
      s = B * Math.cos(phase) - delta;
      v = -B * w * Math.sin(phase);
    } else {
      const tr = Math.max(0, tau - tRamp);
      s = -A * Math.sin(w * tr);
      v = -A * w * Math.cos(w * tr);
    }
  }

  return energies(params, t, s, v, true);
}

export function sampleAt(
  params: EnergyParams,
  t: number,
  mode: EnergyMode = "launch",
): EnergySample {
  return mode === "attached" ? sampleAttached(params, t) : sampleLaunch(params, t);
}
