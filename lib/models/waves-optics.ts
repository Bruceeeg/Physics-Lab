export type WavesMode = "standing" | "doubleslit";

export type WavesParams = {
  L: number;
  n: number;
  tension: number;
  mu: number;
  A: number;
  lambda_nm: number;
  d_mm: number;
  screen_m: number;
};

export type WavesSample = {
  t: number;
  v: number;
  lambda: number;
  f: number;
  y: number;
  deltaY: number;
  I: number;
  I0: number;
};

export const DEFAULT_WAVES: WavesParams = {
  L: 0.8,
  n: 2,
  tension: 40,
  mu: 0.01,
  A: 0.03,
  lambda_nm: 600,
  d_mm: 0.25,
  screen_m: 1.2,
};

export function standingWave(params: WavesParams, x: number, t: number) {
  const v = Math.sqrt(params.tension / params.mu);
  const lambda = (2 * params.L) / params.n;
  const f = v / lambda;
  return 2 * params.A * Math.sin((params.n * Math.PI * x) / params.L) * Math.cos(2 * Math.PI * f * t);
}

export function sampleAt(
  params: WavesParams,
  t: number,
  mode: WavesMode = "standing",
): WavesSample {
  const time = Math.max(0, t);
  if (mode === "doubleslit") {
    const lambda = params.lambda_nm * 1e-9;
    const d = params.d_mm * 1e-3;
    const I0 = 1;
    const y = 0;
    const theta = Math.atan(y / params.screen_m);
    const I = I0 * Math.cos((Math.PI * d * Math.sin(theta)) / lambda) ** 2;
    return {
      t: time,
      v: 0,
      lambda,
      f: 0,
      y,
      deltaY: (lambda * params.screen_m) / d,
      I,
      I0,
    };
  }
  const v = Math.sqrt(params.tension / params.mu);
  const lambda = (2 * params.L) / params.n;
  const f = v / lambda;
  return {
    t: time,
    v,
    lambda,
    f,
    y: standingWave(params, params.L / (2 * params.n), time),
    deltaY: 0,
    I: 0,
    I0: 0,
  };
}

export function standingShape(params: WavesParams, t: number, steps = 48) {
  const points: [number, number][] = [];
  for (let index = 0; index <= steps; index += 1) {
    const x = (params.L * index) / steps;
    points.push([x, standingWave(params, x, t)]);
  }
  return points;
}

export function fringeIntensities(params: WavesParams, count = 41) {
  const lambda = params.lambda_nm * 1e-9;
  const d = params.d_mm * 1e-3;
  const span = 4 * ((lambda * params.screen_m) / d);
  const values: { y: number; I: number }[] = [];
  for (let index = 0; index < count; index += 1) {
    const y = -span + (2 * span * index) / (count - 1);
    const theta = Math.atan(y / params.screen_m);
    const I = Math.cos((Math.PI * d * Math.sin(theta)) / lambda) ** 2;
    values.push({ y, I });
  }
  return values;
}
