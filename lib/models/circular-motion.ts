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
  phi: number;
  polar: number;
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

function verticalState(params: CircularParams, t: number) {
  const R = Math.max(params.r, 1e-9);
  const gOverR = params.g / R;
  let phi = 0;
  let omega = params.v0 / R;
  let time = 0;
  const dt = 0.002;
  const limit = Math.max(0, t);
  while (time < limit) {
    const step = Math.min(dt, limit - time);
    const a1 = -gOverR * Math.sin(phi);
    const phiMid = phi + omega * (step / 2);
    const omegaMid = omega + a1 * (step / 2);
    const a2 = -gOverR * Math.sin(phiMid);
    phi += omegaMid * step;
    omega += a2 * step;
    time += step;
  }
  return { phi, omega };
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
      phi,
      polar: Math.PI / 2,
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
    };
  }
  if (mode === "vertical") {
    const R = params.r;
    const { phi, omega } = verticalState(params, time);
    const speed = Math.abs(omega) * R;
    const v2 = speed * speed;
    return {
      t: time,
      phi,
      polar: phi,
      x: R * Math.sin(phi),
      y: -R * Math.cos(phi),
      z: 0,
      r: R,
      omega,
      T: period(params, mode),
      speed,
      tension: params.m * (R > 1e-9 ? v2 / R : 0) + params.m * params.g * Math.cos(phi),
      Fc: centripetalForce(params, mode, speed),
      looping: canLoop(params),
    };
  }
  const theta = coneAngle(params);
  const r = orbitRadius(params, "conical");
  const omega = angularSpeed(params, "conical");
  const phi = omega * time;
  const speed = Math.abs(omega) * r;
  return {
    t: time,
    phi,
    polar: theta,
    x: r * Math.cos(phi),
    y: -params.L * Math.cos(theta),
    z: r * Math.sin(phi),
    r,
    omega,
    T: period(params, "conical"),
    speed,
    tension: tension(params, "conical"),
    Fc: centripetalForce(params, "conical", speed),
    looping: true,
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
