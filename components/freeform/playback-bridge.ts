export type PlaybackBridge = {
  getTime: () => number;
  getPoint: () => [number, number, number] | null;
  getVelocity: () => { vx: number; vy: number; vz: number } | null;
  pause: () => void;
  reset: () => void;
};

let current: PlaybackBridge | null = null;

export function registerPlayback(bridge: PlaybackBridge) {
  current = bridge;
  return () => {
    if (current === bridge) {
      current = null;
    }
  };
}

export function readPlayback() {
  return current;
}

export function velocityOf(sample: unknown) {
  if (!sample || typeof sample !== "object") {
    return null;
  }
  const record = sample as Record<string, unknown>;
  const vx = numberOrNull(record.vx);
  const vy = numberOrNull(record.vy);
  const vz = numberOrNull(record.vz);
  if (vx !== null || vy !== null || vz !== null) {
    return { vx: vx ?? 0, vy: vy ?? 0, vz: vz ?? 0 };
  }
  const speed = numberOrNull(record.v) ?? numberOrNull(record.speed);
  if (speed === null) {
    return null;
  }
  return { vx: speed, vy: 0, vz: 0 };
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
