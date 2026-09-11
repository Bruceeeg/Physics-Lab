export type InclineParams = {
  m: number;
  thetaDeg: number;
  muS: number;
  muK: number;
  g: number;
  travel: number;
  plane: number;
};

export type InclineSample = {
  t: number;
  s: number;
  sRamp: number;
  sPlane: number;
  v: number;
  a: number;
  N: number;
  f: number;
  x: number;
  y: number;
  stuck: boolean;
  onPlane: boolean;
  landed: boolean;
};

export const DEFAULT_INCLINE: InclineParams = {
  m: 0.8,
  thetaDeg: 30,
  muS: 0.4,
  muK: 0.3,
  g: 9.81,
  travel: 0.9,
  plane: 1,
};

export const BLOCK_SIZE: [number, number, number] = [0.16, 0.12, 0.14];
export const BLOCK_HEIGHT = BLOCK_SIZE[1];
export const RAMP_WIDTH = 0.7;
export const TABLE_THICKNESS = 0.05;
export const SURFACE_Y = 0.02;

export function clampMuK(muS: number, muK: number) {
  return Math.min(muK, muS);
}

export function thetaRad(params: InclineParams) {
  return (params.thetaDeg * Math.PI) / 180;
}

export function stuck(params: InclineParams) {
  const theta = thetaRad(params);
  const rise = Math.tan(theta);
  return rise <= params.muS + 1e-12;
}

export function acceleration(params: InclineParams) {
  if (stuck(params)) {
    return 0;
  }
  const theta = thetaRad(params);
  const muK = clampMuK(params.muS, params.muK);
  return params.g * (Math.sin(theta) - muK * Math.cos(theta));
}

export function planeAccel(params: InclineParams) {
  return -clampMuK(params.muS, params.muK) * params.g;
}

export function rampNormalForce(params: InclineParams) {
  return params.m * params.g * Math.cos(thetaRad(params));
}

export function planeNormalForce(params: InclineParams) {
  return params.m * params.g;
}

export function normalForce(params: InclineParams) {
  return rampNormalForce(params);
}

export function frictionForce(params: InclineParams) {
  const N = rampNormalForce(params);
  if (stuck(params)) {
    return params.m * params.g * Math.sin(thetaRad(params));
  }
  return clampMuK(params.muS, params.muK) * N;
}

export function timeToBottom(params: InclineParams) {
  const a = acceleration(params);
  if (a <= 1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.sqrt((2 * params.travel) / a);
}

export function speedAtBottom(params: InclineParams) {
  const a = acceleration(params);
  if (a <= 1e-12) {
    return 0;
  }
  return Math.sqrt(2 * a * params.travel);
}

export function planeStopDistance(params: InclineParams) {
  const v = speedAtBottom(params);
  const a = planeAccel(params);
  if (v <= 1e-12) {
    return 0;
  }
  if (a >= -1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  return (v * v) / (-2 * a);
}

function planeRun(params: InclineParams) {
  const dStop = planeStopDistance(params);
  return Math.min(Math.max(0, params.plane), dStop);
}

export function timeOnPlane(params: InclineParams) {
  const v = speedAtBottom(params);
  const a = planeAccel(params);
  const run = planeRun(params);
  if (v <= 1e-12 || run <= 1e-12) {
    return 0;
  }
  if (a >= -1e-12) {
    return run / v;
  }
  const disc = Math.max(0, v * v + 2 * a * run);
  return (-v + Math.sqrt(disc)) / a;
}

export function timeToLimit(params: InclineParams) {
  if (stuck(params)) {
    return Number.POSITIVE_INFINITY;
  }
  return timeToBottom(params) + timeOnPlane(params);
}

export function surfaceAt(params: InclineParams, sRamp: number): [number, number, number] {
  const theta = thetaRad(params);
  const s = Math.min(Math.max(0, sRamp), params.travel);
  return [s * Math.cos(theta), SURFACE_Y + (params.travel - s) * Math.sin(theta), 0];
}

export function toeX(params: InclineParams) {
  return params.travel * Math.cos(thetaRad(params));
}

export function visualRampS(params: InclineParams, sRamp: number) {
  const half = BLOCK_SIZE[0] / 2;
  return Math.min(Math.max(sRamp, half), params.travel);
}

export function blockPlacement(
  params: InclineParams,
  sample: InclineSample,
): { position: [number, number, number]; tilt: number } {
  const half = BLOCK_HEIGHT / 2;
  if (sample.onPlane || (sample.landed && !sample.stuck)) {
    return {
      position: [toeX(params) + sample.sPlane, SURFACE_Y + half, 0],
      tilt: 0,
    };
  }
  const theta = thetaRad(params);
  const s = visualRampS(params, sample.sRamp);
  const surface = surfaceAt(params, s);
  return {
    position: [surface[0] + Math.sin(theta) * half, surface[1] + Math.cos(theta) * half, 0],
    tilt: -theta,
  };
}

export function sampleAt(params: InclineParams, t: number): InclineSample {
  const aRamp = acceleration(params);
  const isStuck = stuck(params);
  const theta = thetaRad(params);
  const tRamp = timeToBottom(params);
  const tEnd = timeToLimit(params);
  const time = Math.max(0, t);
  const muK = clampMuK(params.muS, params.muK);

  if (isStuck) {
    const top = surfaceAt(params, 0);
    return {
      t: time,
      s: 0,
      sRamp: 0,
      sPlane: 0,
      v: 0,
      a: 0,
      N: rampNormalForce(params),
      f: params.m * params.g * Math.sin(theta),
      x: top[0],
      y: top[1],
      stuck: true,
      onPlane: false,
      landed: false,
    };
  }

  if (!Number.isFinite(tRamp) || time <= tRamp + 1e-12) {
    const tc = Number.isFinite(tRamp) ? Math.min(time, tRamp) : 0;
    const sRamp = 0.5 * aRamp * tc * tc;
    const v = aRamp * tc;
    const point = surfaceAt(params, sRamp);
    return {
      t: time,
      s: sRamp,
      sRamp,
      sPlane: 0,
      v,
      a: aRamp,
      N: rampNormalForce(params),
      f: muK * rampNormalForce(params),
      x: point[0],
      y: point[1],
      stuck: false,
      onPlane: false,
      landed: false,
    };
  }

  const tFlat = Math.min(time - tRamp, timeOnPlane(params));
  const v0 = speedAtBottom(params);
  const aFlat = planeAccel(params);
  const sPlane = Math.min(params.plane, Math.max(0, v0 * tFlat + 0.5 * aFlat * tFlat * tFlat));
  const finished = Number.isFinite(tEnd) && time >= tEnd - 1e-9;
  const sliding = !finished;
  const v = sliding ? Math.max(0, v0 + aFlat * tFlat) : 0;
  return {
    t: time,
    s: params.travel + sPlane,
    sRamp: params.travel,
    sPlane,
    v,
    a: sliding ? aFlat : 0,
    N: planeNormalForce(params),
    f: sliding ? muK * planeNormalForce(params) : 0,
    x: toeX(params) + sPlane,
    y: SURFACE_Y,
    stuck: false,
    onPlane: true,
    landed: finished,
  };
}
