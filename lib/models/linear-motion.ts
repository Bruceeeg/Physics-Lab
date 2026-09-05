export type MotionSample = {
  t: number;
  x: number;
  v: number;
};

const LIVE_EPS = 1e-9;
export const DEFAULT_TRAIL_STEPS = 80;
export const TIME_MIN = 0;
export const TIME_MAX = 60;

export function clampTime(value: number) {
  if (!Number.isFinite(value)) {
    return TIME_MIN;
  }
  return Math.min(TIME_MAX, Math.max(TIME_MIN, value));
}

export function positionAt(x0: number, v0: number, a: number, t: number) {
  return x0 + v0 * t + 0.5 * a * t * t;
}

export function velocityAt(v0: number, a: number, t: number) {
  return v0 + a * t;
}

export function motionSample(x0: number, v0: number, a: number, t: number): MotionSample {
  return {
    t,
    x: positionAt(x0, v0, a, t),
    v: velocityAt(v0, a, t),
  };
}

export function predictedSamples(
  x0: number,
  v0: number,
  a: number,
  duration: number,
  stepCount = DEFAULT_TRAIL_STEPS,
): MotionSample[] {
  const nextPoints: MotionSample[] = [];

  for (let index = 0; index <= stepCount; index += 1) {
    const sampleTime = (duration * index) / stepCount;
    nextPoints.push(motionSample(x0, v0, a, sampleTime));
  }

  return nextPoints;
}

export function elapsedTrail(
  predicted: readonly MotionSample[],
  live: MotionSample,
): { markers: MotionSample[]; path: MotionSample[] } {
  if (live.t <= 0) {
    return { markers: [], path: [] };
  }

  const markers = predicted.filter((point) => point.t <= live.t + LIVE_EPS);
  const last = markers[markers.length - 1];
  const path = last && live.t - last.t <= LIVE_EPS ? markers : [...markers, live];

  return { markers, path };
}
