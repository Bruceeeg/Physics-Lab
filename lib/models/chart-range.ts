export type TimePoint = { t: number };

export function paddedValueRange(values: readonly number[]) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) {
    return { min: -1, max: 1 };
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === 0 && max === 0) {
    return { min: -1, max: 1 };
  }
  const span = max - min;
  const pad =
    span > 1e-12
      ? span * 0.08
      : Math.max(Math.abs(min) * 0.08, 1e-6);
  return { min: min - pad, max: max + pad };
}

export function sliceTimeWindow<T extends TimePoint>(
  points: readonly T[],
  currentTime: number,
  duration: number,
) {
  const safeDuration = Math.max(duration, 1e-6);
  const end = Math.max(safeDuration, currentTime);
  const start = Math.max(0, currentTime - safeDuration);
  const firstVisible = points.findIndex((point) => point.t >= start);
  const startIndex =
    firstVisible < 0
      ? Math.max(0, points.length - 1)
      : Math.max(0, firstVisible - 1);
  const windowPoints = points
    .slice(startIndex)
    .filter((point) => point.t <= end + 1e-9);
  return { start, end, points: windowPoints };
}
