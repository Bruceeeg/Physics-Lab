export type DragMode = "linear" | "quadratic";

export type DragParams = {
  m: number;
  g: number;
  b: number;
};

export type DragSample = {
  t: number;
  y: number;
  v: number;
  a: number;
  Fd: number;
  N: number;
  vt: number;
};

export const DEFAULT_DRAG: DragParams = {
  m: 0.12,
  g: 9.81,
  b: 0.35,
};

export function terminalSpeed(params: DragParams, mode: DragMode = "linear") {
  if (params.b <= 1e-12) {
    return Number.POSITIVE_INFINITY;
  }
  if (mode === "quadratic") {
    return Math.sqrt((params.m * params.g) / params.b);
  }
  return (params.m * params.g) / params.b;
}

export function dragTau(params: DragParams, mode: DragMode = "linear") {
  const vt = terminalSpeed(params, mode);
  if (!Number.isFinite(vt) || params.g <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return mode === "quadratic" ? vt / params.g : params.m / params.b;
}

export function dragForce(params: DragParams, v: number, mode: DragMode = "linear") {
  const speed = Math.abs(v);
  if (mode === "quadratic") {
    return params.b * speed * speed;
  }
  return params.b * speed;
}

export function sampleAt(params: DragParams, t: number, mode: DragMode = "linear"): DragSample {
  const time = Math.max(0, t);
  const vt = terminalSpeed(params, mode);
  const tau = dragTau(params, mode);
  let v: number;
  let y: number;
  if (!Number.isFinite(vt) || !Number.isFinite(tau) || tau <= 1e-12) {
    v = params.g * time;
    y = 0.5 * params.g * time * time;
  } else if (mode === "quadratic") {
    const u = time / tau;
    v = vt * Math.tanh(u);
    y = (vt * vt / params.g) * Math.log(Math.cosh(u));
  } else {
    const decay = Math.exp(-time / tau);
    v = vt * (1 - decay);
    y = vt * time - vt * tau * (1 - decay);
  }
  const Fd = dragForce(params, v, mode);
  const a = params.g - Fd / params.m;
  return {
    t: time,
    y,
    v,
    a,
    Fd,
    N: 0,
    vt: Number.isFinite(vt) ? vt : 0,
  };
}

export function durationOf(params: DragParams, mode: DragMode) {
  const tau = dragTau(params, mode);
  return Number.isFinite(tau) ? Math.min(8, 5 * tau) : 4;
}
