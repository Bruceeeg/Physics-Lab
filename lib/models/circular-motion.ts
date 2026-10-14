import {
  sphericalPendulumAt,
  verticalRopeAt,
  type VerticalDetachment,
} from "./pendulum-dynamics.ts";

export type CircularMode = "conical" | "horizontal" | "vertical";

export type CircularParams = {
  L: number;
  thetaDeg: number;
  m: number;
  g: number;
  r: number;
  v0: number;
};

export type CircularSample = {
  t: number;
  phase: "constrained" | "projectile";
  phi: number;
  polar: number;
  polarVelocity: number;
  x: number;
  y: number;
  z: number;
  r: number;
  omega: number;
  T: number;
  speed: number;
  tension: number;
  Fc: number;
  looping: boolean;
  detachment: VerticalDetachment | null;
};

export const DEFAULT_CIRCULAR: CircularParams = {
  L: 1.2,
  thetaDeg: 25,
  m: 0.4,
  g: 9.81,
  r: 0.55,
  v0: 2.8,
};

function coneAngle(params: CircularParams) {
  return (params.thetaDeg * Math.PI) / 180;
}

export function orbitRadius(params: CircularParams, mode: CircularMode = "conical") {
  if (mode === "conical") {
    return params.L * Math.sin(coneAngle(params));
  }
  return params.r;
}

export function equilibriumAngularSpeed(params: CircularParams) {
  const cos = Math.cos(coneAngle(params));
  if (cos <= 1e-9 || params.L <= 0 || params.g <= 0) {
    return 0;
  }
  return Math.sqrt(params.g / (params.L * cos));
}

export function conicalEquilibriumSpeed(params: CircularParams) {
  return equilibriumAngularSpeed(params) * orbitRadius(params, "conical");
}

export function angularSpeed(params: CircularParams, mode: CircularMode = "conical") {
  if (mode === "horizontal") {
    return params.r > 0 ? params.v0 / params.r : 0;
  }
  if (mode === "vertical") {
    return params.r > 0 ? params.v0 / params.r : 0;
  }
  const r = orbitRadius(params, "conical");
  return r > 0 ? params.v0 / r : 0;
}

export function period(params: CircularParams, mode: CircularMode = "conical") {
  if (mode === "vertical") {
    return Number.POSITIVE_INFINITY;
  }
  const omega = angularSpeed(params, mode);
  return omega > 0 ? (2 * Math.PI) / omega : Number.POSITIVE_INFINITY;
}

export function equilibriumPeriod(params: CircularParams) {
  const omega = equilibriumAngularSpeed(params);
  return omega > 0 ? (2 * Math.PI) / omega : Number.POSITIVE_INFINITY;
}

export function tension(params: CircularParams, mode: CircularMode = "conical") {
  if (mode === "horizontal") {
    return params.r > 0 ? (params.m * params.v0 * params.v0) / params.r : 0;
  }
  const cos = Math.cos(coneAngle(params));
  if (cos <= 1e-9) {
    return Number.POSITIVE_INFINITY;
  }
  return (params.m * params.g) / cos;
}

export function centripetalForce(params: CircularParams, mode: CircularMode, speed: number) {
  const r = orbitRadius(params, mode);
  return r > 1e-9 ? (params.m * speed * speed) / r : 0;
}

export function loopSpeed(params: CircularParams) {
  return Math.sqrt(Math.max(0, 5 * params.g * params.r));
}

export function canLoop(params: CircularParams) {
  return params.v0 + 1e-9 >= loopSpeed(params);
}

export function sampleAt(
  params: CircularParams,
  t: number,
  mode: CircularMode = "conical",
): CircularSample {
  const time = Math.max(0, t);
  if (mode === "horizontal") {
    const r = params.r;
    const omega = angularSpeed(params, mode);
    const phi = omega * time;
    const speed = params.v0;
    return {
      t: time,
      phase: "constrained",
      phi,
      polar: Math.PI / 2,
      polarVelocity: 0,
      x: r * Math.cos(phi),
      y: 0,
      z: r * Math.sin(phi),
      r,
      omega,
      T: period(params, mode),
      speed,
      tension: tension(params, mode),
      Fc: centripetalForce(params, mode, speed),
      looping: true,
      detachment: null,
    };
  }
  if (mode === "vertical") {
    const R = params.r;
    const state = verticalRopeAt(params, time);
    return {
      t: time,
      phase: state.phase,
      phi: state.phi,
      polar: state.phi,
      polarVelocity: state.omega,
      x: state.x,
      y: state.y,
      z: 0,
      r: R,
      omega: state.omega,
      T: period(params, mode),
      speed: state.speed,
      tension: state.tension,
      Fc:
        state.phase === "constrained"
          ? centripetalForce(params, mode, state.speed)
          : 0,
      looping: canLoop(params),
      detachment: state.detachment,
    };
  }
  const state = sphericalPendulumAt(params, time);
  const theta = state.theta;
  const r = params.L * Math.sin(theta);
  const phi = state.phi;
  const azimuthalSpeed = r * state.phiVelocity;
  const speed =
    params.L *
    Math.hypot(state.thetaVelocity, Math.sin(theta) * state.phiVelocity);
  const dynamicTension =
    params.m *
      params.L *
      (state.thetaVelocity * state.thetaVelocity +
        Math.sin(theta) ** 2 * state.phiVelocity * state.phiVelocity) +
    params.m * params.g * Math.cos(theta);
  return {
    t: time,
    phase: "constrained",
    phi,
    polar: theta,
    polarVelocity: state.thetaVelocity,
    x: r * Math.cos(phi),
    y: -params.L * Math.cos(theta),
    z: r * Math.sin(phi),
    r,
    omega: state.phiVelocity,
    T: period(params, "conical"),
    speed,
    tension: Math.max(0, dynamicTension),
    Fc: r > 1e-9 ? (params.m * azimuthalSpeed * azimuthalSpeed) / r : 0,
    looping: true,
    detachment: null,
  };
}

export function modeFromSlug(slug?: string): CircularMode {
  if (slug === "horizontal-circular") {
    return "horizontal";
  }
  if (slug === "vertical-circular") {
    return "vertical";
  }
  return "conical";
}

export function circularTitle(mode: CircularMode) {
  if (mode === "horizontal") {
    return "水平圆周";
  }
  if (mode === "vertical") {
    return "竖直圆周";
  }
  return "圆锥摆";
}
