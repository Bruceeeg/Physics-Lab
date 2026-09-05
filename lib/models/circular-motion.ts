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
  x: number;
  y: number;
  z: number;
  r: number;
  omega: number;
  T: number;
  speed: number;
  tension: number;
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

export function angularSpeed(params: CircularParams, mode: CircularMode = "conical") {
  if (mode === "horizontal") {
    return params.r > 0 ? params.v0 / params.r : 0;
  }
  if (mode === "vertical") {
    return params.r > 0 ? params.v0 / params.r : 0;
  }
  const cos = Math.cos(coneAngle(params));
  if (cos <= 1e-9 || params.L <= 0 || params.g <= 0) {
    return 0;
  }
  return Math.sqrt(params.g / (params.L * cos));
}

export function period(params: CircularParams, mode: CircularMode = "conical") {
  if (mode === "vertical") {
    return Number.POSITIVE_INFINITY;
  }
  const omega = angularSpeed(params, mode);
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

function verticalPhi(params: CircularParams, t: number) {
  const R = params.r;
  let phi = 0;
  let time = 0;
  const dt = 0.002;
  const limit = Math.max(0, t);
  while (time < limit) {
    const v2 = params.v0 * params.v0 - 2 * params.g * R * (1 - Math.cos(phi));
    if (v2 <= 1e-9) {
      break;
    }
    const step = Math.min(dt, limit - time);
    phi += (Math.sqrt(v2) / R) * step;
    time += step;
  }
  return phi;
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
    return {
      t: time,
      phi,
      x: r * Math.cos(phi),
      y: 0,
      z: r * Math.sin(phi),
      r,
      omega,
      T: period(params, mode),
      speed: params.v0,
      tension: tension(params, mode),
    };
  }
  if (mode === "vertical") {
    const R = params.r;
    const phi = verticalPhi(params, time);
    const v2 = Math.max(0, params.v0 * params.v0 - 2 * params.g * R * (1 - Math.cos(phi)));
    const speed = Math.sqrt(v2);
    const omega = R > 0 ? speed / R : 0;
    return {
      t: time,
      phi,
      x: R * Math.sin(phi),
      y: -R * Math.cos(phi),
      z: 0,
      r: R,
      omega,
      T: period(params, mode),
      speed,
      tension: params.m * (v2 / R + params.g * Math.cos(phi)),
    };
  }
  const theta = coneAngle(params);
  const r = orbitRadius(params);
  const omega = angularSpeed(params);
  const phi = omega * time;
  return {
    t: time,
    phi,
    x: r * Math.cos(phi),
    y: -params.L * Math.cos(theta),
    z: r * Math.sin(phi),
    r,
    omega,
    T: period(params),
    speed: omega * r,
    tension: tension(params),
  };
}
