export type PullParams = {
  F: number;
  thetaDeg: number;
  m: number;
  muS: number;
  muK: number;
  g: number;
};

export type PullState = {
  t: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
};

export type PullForces = {
  Fx: number;
  Fz: number;
  N: number;
  f: number;
  G: number;
};

export type PullMode = "static" | "sliding" | "liftoff" | "airborne";

export type PullAlert = "stuck" | "moving-plus" | "moving-minus" | "will-lift" | "airborne";

export type PullDerived = {
  mode: PullMode;
  forces: PullForces;
  ax: number;
  az: number;
  alert: PullAlert;
};

export type PullParamIssue = {
  fields: ("F" | "thetaDeg")[];
  message: string;
};

const EPS = 1e-4;
const HEIGHT_EPS = 1e-6;

export function clampMuK(muS: number, muK: number) {
  return Math.min(muK, muS);
}

export function initialState(): PullState {
  return { t: 0, x: 0, z: 0, vx: 0, vz: 0 };
}

export function validatePullParams(params: PullParams): PullParamIssue | null {
  if (params.F > 0 && params.thetaDeg > 90) {
    return {
      fields: ["F", "thetaDeg"],
      message: "F > 0 时，θ 必须在 0°-90° 内。",
    };
  }
  if (params.F < 0 && params.thetaDeg < 90) {
    return {
      fields: ["F", "thetaDeg"],
      message: "F < 0 时，θ 必须在 90°-180° 内。",
    };
  }
  return null;
}

function components(params: PullParams) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  const magnitude = Math.abs(params.F);
  const Fx = magnitude * Math.cos(theta);
  const Fz = magnitude * Math.sin(theta);
  const G = params.m * params.g;
  return { Fx, Fz, G };
}

export function derive(params: PullParams, state: PullState): PullDerived {
  const muK = clampMuK(params.muS, params.muK);
  const { Fx, Fz, G } = components(params);
  const Ncontact = G - Fz;
  const airborne = state.z > HEIGHT_EPS;

  if (Ncontact <= 0 || airborne) {
    const ax = Fx / params.m;
    const az = (Fz - G) / params.m;
    const mode: PullMode = airborne ? "airborne" : "liftoff";
    const alert: PullAlert = airborne ? "airborne" : "will-lift";
    return {
      mode,
      forces: { Fx, Fz, N: 0, f: 0, G },
      ax,
      az,
      alert,
    };
  }

  const N = Ncontact;
  const nearlyRest = Math.abs(state.vx) < EPS && Math.abs(state.vz) < EPS;

  if (nearlyRest && Math.abs(Fx) <= params.muS * N + 1e-12) {
    return {
      mode: "static",
      forces: { Fx, Fz, N, f: -Fx, G },
      ax: 0,
      az: 0,
      alert: "stuck",
    };
  }

  const motionSign = nearlyRest ? Math.sign(Fx) || 1 : Math.sign(state.vx) || 1;
  const f = -muK * N * motionSign;
  return {
    mode: "sliding",
    forces: { Fx, Fz, N, f, G },
    ax: (Fx + f) / params.m,
    az: 0,
    alert: motionSign < 0 ? "moving-minus" : "moving-plus",
  };
}

export function step(params: PullParams, state: PullState, dt: number): PullState {
  if (dt <= 0) {
    return state;
  }

  const derived = derive(params, state);

  if (derived.mode === "static") {
    return {
      t: state.t + dt,
      x: state.x,
      z: 0,
      vx: 0,
      vz: 0,
    };
  }

  let vx = state.vx + derived.ax * dt;
  let vz = derived.mode === "sliding" ? 0 : state.vz + derived.az * dt;
  let x = state.x + vx * dt;
  let z = derived.mode === "sliding" ? 0 : state.z + vz * dt;

  if (derived.mode !== "sliding" && z <= 0 && vz <= 0) {
    z = 0;
    vz = 0;
    const landed = derive(params, { t: state.t + dt, x, z, vx, vz });
    if (landed.mode === "static") {
      vx = 0;
    } else if (landed.mode === "sliding" && vx * (vx + landed.ax * 0) < 0) {
      vx = 0;
    }
  }

  if (derived.mode === "sliding" && state.vx * vx < 0) {
    const atRest = derive(params, { t: state.t + dt, x: state.x, z: 0, vx: 0, vz: 0 });
    if (atRest.mode === "static") {
      return { t: state.t + dt, x: state.x, z: 0, vx: 0, vz: 0 };
    }
  }

  return { t: state.t + dt, x, z, vx, vz };
}

export type KinematicSample = {
  t: number;
  x: number;
  vx: number;
  ax: number;
  fxNet: number;
  dx: number;
};

export function kinematicSample(
  derived: PullDerived,
  state: PullState,
  originX = 0,
): KinematicSample {
  return {
    t: state.t,
    x: state.x,
    vx: state.vx,
    ax: derived.ax,
    fxNet: derived.forces.Fx + derived.forces.f,
    dx: state.x - originX,
  };
}

export function projectKinematics(
  params: PullParams,
  from: PullState,
  untilT: number,
  dt: number,
): KinematicSample[] {
  const samples: KinematicSample[] = [
    kinematicSample(derive(params, from), from, from.x),
  ];
  if (dt <= 0 || untilT <= from.t) {
    return samples;
  }

  let state = from;
  while (state.t < untilT - 1e-12) {
    const stepDt = Math.min(dt, untilT - state.t);
    state = step(params, state, stepDt);
    samples.push(kinematicSample(derive(params, state), state, from.x));
  }
  return samples;
}

const SAMPLE_EPS = 1e-4;
const SERIES_CAP = 800;

export function appendKinematicSample(
  prev: KinematicSample[],
  sample: KinematicSample,
  interval = 1 / 30,
): KinematicSample[] {
  if (prev.length === 0) {
    return [sample];
  }

  const last = prev[prev.length - 1];
  if (Math.abs(sample.t - last.t) < SAMPLE_EPS) {
    return [...prev.slice(0, -1), sample];
  }
  if (sample.t - last.t < interval) {
    return prev;
  }

  const next = [...prev, sample];
  if (next.length <= SERIES_CAP) {
    return next;
  }

  const compacted = [next[0]];
  for (let index = 2; index < next.length - 1; index += 2) {
    compacted.push(next[index]);
  }
  compacted.push(next[next.length - 1]);
  return compacted;
}
