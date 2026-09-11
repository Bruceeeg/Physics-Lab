export type FluidParams = {
  H: number;
  holeY: number;
  g: number;
};

export type FluidSample = {
  t: number;
  depth: number;
  v: number;
  R: number;
  flight: number;
  R1: number;
  R2: number;
  R3: number;
};

export type JetPoint = { x: number; y: number };

export const DEFAULT_FLUID: FluidParams = {
  H: 0.8,
  holeY: 0.25,
  g: 9.81,
};

export function depth(params: FluidParams) {
  return Math.max(0, params.H - params.holeY);
}

export function exitSpeed(params: FluidParams) {
  return Math.sqrt(2 * params.g * depth(params));
}

export function flightTime(params: FluidParams) {
  if (params.holeY <= 0 || params.g <= 0) {
    return 0;
  }
  return Math.sqrt((2 * params.holeY) / params.g);
}

export function range(params: FluidParams) {
  return exitSpeed(params) * flightTime(params);
}

export function jetAt(params: FluidParams, tau: number): JetPoint {
  const limit = flightTime(params);
  const t = Math.min(Math.max(0, tau), limit);
  return {
    x: exitSpeed(params) * t,
    y: params.holeY - 0.5 * params.g * t * t,
  };
}

export function jetPath(params: FluidParams, steps = 48): JetPoint[] {
  const limit = flightTime(params);
  const points: JetPoint[] = [];
  for (let index = 0; index <= steps; index += 1) {
    points.push(jetAt(params, (limit * index) / steps));
  }
  return points;
}

export function droplets(params: FluidParams, t: number, count = 8): JetPoint[] {
  const limit = flightTime(params);
  if (limit <= 1e-9) {
    return [];
  }
  const points: JetPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const tau = ((t + (index * limit) / count) % limit + limit) % limit;
    points.push(jetAt(params, tau));
  }
  return points;
}

export type FluidMode = "single" | "three";

export function threeHoleYs(H: number): [number, number, number] {
  return [0.22 * H, 0.5 * H, 0.78 * H];
}

export function holeYs(params: FluidParams, mode: FluidMode): number[] {
  if (mode === "three") {
    return [...threeHoleYs(params.H)];
  }
  return [params.holeY];
}

export function paramsAtHole(params: FluidParams, holeY: number): FluidParams {
  return { ...params, holeY };
}

export function sampleAt(params: FluidParams, t: number, mode: FluidMode = "single"): FluidSample {
  const holes = holeYs(params, mode);
  const primaryY = holes[Math.min(1, holes.length - 1)] ?? params.holeY;
  const primary = paramsAtHole(params, primaryY);
  const ranges = holes.map((holeY) => range(paramsAtHole(params, holeY)));
  return {
    t: Math.max(0, t),
    depth: depth(primary),
    v: exitSpeed(primary),
    R: range(primary),
    flight: flightTime(primary),
    R1: ranges[0] ?? 0,
    R2: ranges[1] ?? ranges[0] ?? 0,
    R3: ranges[2] ?? ranges[0] ?? 0,
  };
}
