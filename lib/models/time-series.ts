export type TimeSample = { t: number };

const SAMPLE_EPS = 1e-4;
const SERIES_CAP = 800;

// Keeps the first and latest samples, drops samples closer than `interval`,
// and halves the middle once the series exceeds SERIES_CAP.
export function appendTimeSample<T extends TimeSample>(
  prev: T[],
  sample: T,
  interval = 1 / 30,
): T[] {
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
