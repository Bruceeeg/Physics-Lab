export function integrateMotion(
  x0: number,
  v0: number,
  t: number,
  acc: (x: number, v: number, time: number) => number,
  dt = 0.002,
  stop?: (x: number, v: number, time: number) => boolean,
): { x: number; v: number; t: number } {
  let x = x0;
  let v = v0;
  let time = 0;
  const limit = Math.max(0, t);
  while (time < limit - 1e-12) {
    const step = Math.min(dt, limit - time);
    if (stop?.(x, v, time)) {
      return { x, v, t: time };
    }
    const a1 = acc(x, v, time);
    const x2 = x + v * (step / 2);
    const v2 = v + a1 * (step / 2);
    const a2 = acc(x2, v2, time + step / 2);
    const x3 = x + v2 * (step / 2);
    const v3 = v + a2 * (step / 2);
    const a3 = acc(x3, v3, time + step / 2);
    const x4 = x + v3 * step;
    const v4 = v + a3 * step;
    const a4 = acc(x4, v4, time + step);
    x += (step / 6) * (v + 2 * v2 + 2 * v3 + v4);
    v += (step / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
    time += step;
  }
  return { x, v, t: time };
}
