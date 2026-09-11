export type Vec3 = [number, number, number];

export type SpringFrame2 = {
  x: number;
  y: number;
  nx: number;
  ny: number;
};

export type SpringFrame3 = {
  point: Vec3;
  tangent: Vec3;
  normal: Vec3;
};

export const SPRING_HOOK = 0.08;

export function coilRadiusAt(u: number, radius: number, hook = SPRING_HOOK) {
  const t = Math.min(Math.max(u, 0), 1);
  if (t < hook) {
    return radius * (t / hook);
  }
  if (t > 1 - hook) {
    return radius * ((1 - t) / hook);
  }
  return radius;
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  if (length < 1e-12) {
    return [1, 0, 0];
  }
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function orthonormal(tangent: Vec3, hint: Vec3): { normal: Vec3; binormal: Vec3 } {
  const T = normalize(tangent);
  const aligned = T[0] * hint[0] + T[1] * hint[1] + T[2] * hint[2];
  let raw: Vec3 = [hint[0] - T[0] * aligned, hint[1] - T[1] * aligned, hint[2] - T[2] * aligned];
  if (Math.hypot(raw[0], raw[1], raw[2]) < 1e-8) {
    const fallback: Vec3 = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1];
    const again = T[0] * fallback[0] + T[1] * fallback[1] + T[2] * fallback[2];
    raw = [fallback[0] - T[0] * again, fallback[1] - T[1] * again, fallback[2] - T[2] * again];
  }
  const N = normalize(raw);
  return { normal: N, binormal: normalize(cross(T, N)) };
}

export function helicalSpringAlongFrames(
  frames: SpringFrame3[],
  coils: number,
  radius: number,
): Vec3[] {
  if (frames.length === 0) {
    return [];
  }
  const last = frames.length - 1;
  return frames.map((frame, index) => {
    const u = last === 0 ? 0 : index / last;
    const theta = 2 * Math.PI * coils * u;
    const { normal, binormal } = orthonormal(frame.tangent, frame.normal);
    const R = coilRadiusAt(u, radius);
    return [
      frame.point[0] + R * (normal[0] * Math.cos(theta) + binormal[0] * Math.sin(theta)),
      frame.point[1] + R * (normal[1] * Math.cos(theta) + binormal[1] * Math.sin(theta)),
      frame.point[2] + R * (normal[2] * Math.cos(theta) + binormal[2] * Math.sin(theta)),
    ];
  });
}

export function helicalSpringPoints({
  start,
  end,
  coils = 10,
  radius = 0.035,
  pointsPerCoil = 16,
}: {
  start: Vec3;
  end: Vec3;
  coils?: number;
  radius?: number;
  pointsPerCoil?: number;
}): Vec3[] {
  const axis: Vec3 = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
  const steps = Math.max(2, Math.round(coils * pointsPerCoil));
  const frames: SpringFrame3[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const u = index / steps;
    frames.push({
      point: [
        start[0] + axis[0] * u,
        start[1] + axis[1] * u,
        start[2] + axis[2] * u,
      ],
      tangent: axis,
      normal: [0, 1, 0],
    });
  }
  return helicalSpringAlongFrames(frames, coils, radius);
}

export function helixWire2D(
  start: { x: number; y: number },
  end: { x: number; y: number },
  coils = 10,
  radius = 5.4,
  samplesPerCoil = 18,
  foreshorten = 0.48,
): { x: number; y: number }[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6 || coils < 1) {
    return [start, end];
  }
  const tx = dx / len;
  const ty = dy / len;
  const nx = -ty;
  const ny = tx;
  const samples = Math.max(2, Math.round(coils * samplesPerCoil));
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const u = index / samples;
    const theta = 2 * Math.PI * coils * u;
    const along = u * len;
    const R = coilRadiusAt(u, radius);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    points.push({
      x: start.x + tx * along + nx * R * cos + tx * R * sin * foreshorten,
      y: start.y + ty * along + ny * R * cos + ty * R * sin * foreshorten,
    });
  }
  return points;
}

export function zigzagSpring2D(
  start: { x: number; y: number },
  end: { x: number; y: number },
  coils: number,
  amplitude: number,
): { x: number; y: number }[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6 || coils < 1) {
    return [start, end];
  }
  const tx = dx / len;
  const ty = dy / len;
  const nx = -ty;
  const ny = tx;
  const hook = Math.min(len * 0.14, Math.max(5, len * 0.08));
  const usable = Math.max(len - 2 * hook, 1e-6);
  const pitch = usable / coils;
  const amp = Math.min(amplitude, Math.max(2.2, pitch * 0.85));
  const points: { x: number; y: number }[] = [
    { x: start.x, y: start.y },
    { x: start.x + tx * hook, y: start.y + ty * hook },
  ];
  const peaks = coils * 2;
  for (let index = 0; index < peaks; index += 1) {
    const u = (index + 0.5) / peaks;
    const along = hook + u * usable;
    const side = amp * (index % 2 === 0 ? 1 : -1);
    points.push({
      x: start.x + tx * along + nx * side,
      y: start.y + ty * along + ny * side,
    });
  }
  points.push({ x: end.x - tx * hook, y: end.y - ty * hook });
  points.push({ x: end.x, y: end.y });
  return points;
}

export function helicalSpring2D(
  frames: SpringFrame2[],
  coils: number,
  amplitude: number,
): { x: number; y: number }[] {
  if (frames.length === 0) {
    return [];
  }
  return helixWire2D(frames[0], frames[frames.length - 1], coils, amplitude);
}

export type CoilLoop2D = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angle: number;
};

export function coilSpring2D(
  start: { x: number; y: number },
  end: { x: number; y: number },
  coils = 8,
  radius = 5,
): {
  hooks: [{ x: number; y: number }, { x: number; y: number }][];
  loops: CoilLoop2D[];
} {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6 || coils < 1) {
    return { hooks: [[start, end]], loops: [] };
  }
  const tx = dx / len;
  const ty = dy / len;
  const hook = Math.min(9, Math.max(3.5, len * 0.09));
  const usable = Math.max(len - 2 * hook, 1e-6);
  const pitch = usable / coils;
  const rx = Math.min(6.2, Math.max(1.15, pitch * 0.72));
  const ry = radius;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const loops: CoilLoop2D[] = [];
  for (let index = 0; index < coils; index += 1) {
    const along = hook + (index + 0.5) * pitch;
    loops.push({
      cx: start.x + tx * along,
      cy: start.y + ty * along,
      rx,
      ry,
      angle,
    });
  }
  const hookA: [{ x: number; y: number }, { x: number; y: number }] = [
    start,
    { x: start.x + tx * hook, y: start.y + ty * hook },
  ];
  const hookB: [{ x: number; y: number }, { x: number; y: number }] = [
    { x: end.x - tx * hook, y: end.y - ty * hook },
    end,
  ];
  return { hooks: [hookA, hookB], loops };
}
