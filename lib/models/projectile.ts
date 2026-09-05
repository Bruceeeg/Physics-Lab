export type ProjectileParams = {
  v0: number;
  thetaDeg: number;
  h: number;
  g: number;
};

export type ProjectileSample = {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export type ViewExtent = { extentX: number; extentY: number; scale: number };

export type RulerSteps = { major: number; minor: number };

const TIME_EPS = 1e-9;

function launchComponents(params: ProjectileParams) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  return {
    vx0: params.v0 * Math.cos(theta),
    vy0: params.v0 * Math.sin(theta),
  };
}

export function flightTime(params: ProjectileParams): number {
  const { vy0 } = launchComponents(params);
  const h = Math.max(0, params.h);
  const discriminant = vy0 * vy0 + 2 * params.g * h;
  const t = (vy0 + Math.sqrt(Math.max(0, discriminant))) / params.g;
  return t > TIME_EPS ? t : 0;
}

export function range(params: ProjectileParams): number {
  return launchComponents(params).vx0 * flightTime(params);
}

export function apexHeight(params: ProjectileParams): number {
  const { vy0 } = launchComponents(params);
  if (vy0 <= 0) {
    return params.h;
  }
  return params.h + (vy0 * vy0) / (2 * params.g);
}

export function sampleAt(params: ProjectileParams, t: number): ProjectileSample {
  const tLand = flightTime(params);
  const clamped = Math.min(tLand, Math.max(0, t));
  const { vx0, vy0 } = launchComponents(params);
  const y = params.h + vy0 * clamped - 0.5 * params.g * clamped * clamped;
  return {
    t: clamped,
    x: vx0 * clamped,
    y: clamped >= tLand ? 0 : Math.max(0, y),
    vx: vx0,
    vy: vy0 - params.g * clamped,
  };
}

export function trajectory(params: ProjectileParams, steps = 80): ProjectileSample[] {
  const tLand = flightTime(params);
  const samples: ProjectileSample[] = [];
  for (let index = 0; index <= steps; index += 1) {
    samples.push(sampleAt(params, (tLand * index) / steps));
  }
  return samples;
}

// Horizontal launch only: R = v0 * sqrt(2h/g)  =>  v0 = R * sqrt(g/2h).
export function inferV0FromRange(rangeX: number, h: number, g: number): number {
  if (!(h > 0) || !(g > 0)) {
    return Number.NaN;
  }
  return rangeX * Math.sqrt(g / (2 * h));
}

// Stage box the 3D camera frames. `scale` multiplies every decorative size
// (ball radius, labels, arrows) so a 100 m throw reads like a 2 m throw.
export function viewExtent(params: ProjectileParams): ViewExtent {
  const extentX = Math.max(1.5, range(params));
  const extentY = Math.max(1, apexHeight(params), params.h);
  return { extentX, extentY, scale: Math.max(1, extentX / 4) };
}

export function rulerSteps(extentX: number): RulerSteps {
  const major =
    extentX <= 6 ? 1 : extentX <= 15 ? 2 : extentX <= 40 ? 5 : extentX <= 100 ? 10 : 20;
  return { major, minor: major / 2 };
}
