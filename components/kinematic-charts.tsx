"use client";

import { memo, useMemo } from "react";

import { paddedValueRange, sliceTimeWindow } from "@/lib/models/chart-range";
import { formatLabNumber, formatLabSci } from "@/lib/models/lab-format";

const WIDTH = 320;
const HEIGHT = 90;

export type TimeSeriesPoint = { t: number };

type NumericKeys<T> = { [K in keyof T]-?: T[K] extends number ? K : never }[keyof T];

export type SeriesValueKey<T extends TimeSeriesPoint> = Exclude<NumericKeys<T>, "t">;

function valueOf<T extends TimeSeriesPoint>(point: T, key: SeriesValueKey<T>): number {
  return point[key] as unknown as number;
}

function buildLinePath<T extends TimeSeriesPoint>(
  points: readonly T[],
  valueKey: SeriesValueKey<T>,
  valueMin: number,
  valueMax: number,
  timeStart: number,
  timeEnd: number,
) {
  if (points.length === 0) {
    return "";
  }

  const range = valueMax - valueMin || 1;
  const timeSpan = timeEnd - timeStart || 1;

  return points
    .map((point, index) => {
      const px = ((point.t - timeStart) / timeSpan) * WIDTH;
      const py = HEIGHT - ((valueOf(point, valueKey) - valueMin) / range) * HEIGHT;
      return `${index === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(" ");
}

type TimeSeriesChartProps<T extends TimeSeriesPoint> = {
  title: string;
  quantity: string;
  unit: string;
  strokeColor: string;
  valueKey: SeriesValueKey<T>;
  points: readonly T[];
  currentTime: number;
  currentValue: number;
  minDuration?: number;
  windowDuration?: number;
};

function TimeSeriesChartInner<T extends TimeSeriesPoint>({
  title,
  quantity,
  unit,
  strokeColor,
  valueKey,
  points,
  currentTime,
  currentValue,
  minDuration = 10,
  windowDuration,
}: TimeSeriesChartProps<T>) {
  const window = useMemo(
    () => sliceTimeWindow(points, currentTime, windowDuration ?? minDuration),
    [currentTime, minDuration, points, windowDuration],
  );
  const visiblePoints = useMemo(
    () => window.points.filter((point) => point.t >= window.start - 1e-9),
    [window.points, window.start],
  );
  const { min, max, range } = useMemo(() => {
    const values = [...visiblePoints.map((point) => valueOf(point, valueKey)), currentValue];
    const next = paddedValueRange(values);
    return { ...next, range: next.max - next.min || 1 };
  }, [currentValue, valueKey, visiblePoints]);

  const linePath = useMemo(
    () => buildLinePath(window.points, valueKey, min, max, window.start, window.end),
    [max, min, valueKey, window.end, window.points, window.start],
  );

  const markerX =
    ((currentTime - window.start) / Math.max(window.end - window.start, 1e-9)) * WIDTH;
  const markerY = HEIGHT - ((currentValue - min) / range) * HEIGHT;
  const zeroY = min < 0 && max > 0 ? HEIGHT - ((0 - min) / range) * HEIGHT : null;

  return (
    <figure className="flex min-h-0 flex-col border border-line bg-surface p-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <figcaption>
          <h3 className="text-[13px] font-medium text-ink">{title}</h3>
          <p className="font-mono text-[11px] text-quiet">
            {quantity}({formatLabNumber(currentTime)} s)
          </p>
        </figcaption>
        <p className="font-mono text-[15px] font-medium tabular-nums" style={{ color: strokeColor }}>
          {formatLabSci(currentValue)}{" "}
          <span className="text-[11px] font-normal text-quiet">{unit}</span>
        </p>
      </div>

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-h-0 flex-1 w-full bg-paper"
        role="img"
        aria-label={`${title}，当前 ${formatLabSci(currentValue)} ${unit}`}
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={`h-${fraction}`}
            x1="0"
            y1={HEIGHT * fraction}
            x2={WIDTH}
            y2={HEIGHT * fraction}
            stroke="#E9EEF5"
            strokeWidth="1"
          />
        ))}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={`v-${fraction}`}
            x1={WIDTH * fraction}
            y1="0"
            x2={WIDTH * fraction}
            y2={HEIGHT}
            stroke="#E9EEF5"
            strokeWidth="1"
          />
        ))}
        {zeroY !== null ? (
          <line x1="0" y1={zeroY} x2={WIDTH} y2={zeroY} stroke="#CBD5E1" strokeWidth="1" />
        ) : null}
        <line x1="0" y1="0" x2="0" y2={HEIGHT} stroke="#1E3A5F" strokeWidth="1" />
        <line x1="0" y1={HEIGHT} x2={WIDTH} y2={HEIGHT} stroke="#1E3A5F" strokeWidth="1" />
        {window.points.length >= 2 ? (
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        <line
          x1={markerX}
          y1="0"
          x2={markerX}
          y2={HEIGHT}
          stroke="#1E3A5F"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        <circle cx={markerX} cy={markerY} r="3.5" fill={strokeColor} />
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-quiet">
        <span>
          min {formatLabSci(min)} {unit}
        </span>
        <span>
          {formatLabNumber(window.start)}-{formatLabNumber(window.end)} s
        </span>
        <span>
          max {formatLabSci(max)} {unit}
        </span>
      </div>
    </figure>
  );
}

export const TimeSeriesChart = memo(TimeSeriesChartInner) as typeof TimeSeriesChartInner;
