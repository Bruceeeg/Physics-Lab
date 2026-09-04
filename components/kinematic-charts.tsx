"use client";

import { memo, useMemo } from "react";

import type { KinematicSample } from "@/lib/models/pull-friction";

const WIDTH = 320;
const HEIGHT = 90;

function formatNumber(value: number) {
  return value.toFixed(2);
}

function axisRange(values: number[]) {
  if (values.length === 0) {
    return { min: -1, max: 1 };
  }
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (min === max) {
    return { min: -1, max: 1 };
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function buildLinePath(
  points: KinematicSample[],
  valueKey: keyof Omit<KinematicSample, "t">,
  valueMin: number,
  valueMax: number,
  timeMax: number,
) {
  if (points.length === 0) {
    return "";
  }

  const range = valueMax - valueMin || 1;
  const timeSpan = timeMax || 1;

  return points
    .map((point, index) => {
      const px = (point.t / timeSpan) * WIDTH;
      const py = HEIGHT - ((point[valueKey] - valueMin) / range) * HEIGHT;
      return `${index === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(" ");
}

export const TimeSeriesChart = memo(function TimeSeriesChart({
  title,
  quantity,
  unit,
  strokeColor,
  valueKey,
  points,
  currentTime,
  currentValue,
}: {
  title: string;
  quantity: string;
  unit: string;
  strokeColor: string;
  valueKey: keyof Omit<KinematicSample, "t">;
  points: KinematicSample[];
  currentTime: number;
  currentValue: number;
}) {
  const timeMax = Math.max(10, currentTime);
  const { min, max, range } = useMemo(() => {
    const values = [...points.map((point) => point[valueKey]), currentValue];
    const next = axisRange(values);
    return { ...next, range: next.max - next.min || 1 };
  }, [currentValue, points, valueKey]);

  const linePath = useMemo(
    () => buildLinePath(points, valueKey, min, max, timeMax),
    [max, min, points, timeMax, valueKey],
  );

  const markerX = (currentTime / timeMax) * WIDTH;
  const markerY = HEIGHT - ((currentValue - min) / range) * HEIGHT;
  const zeroY = min < 0 && max > 0 ? HEIGHT - ((0 - min) / range) * HEIGHT : null;

  return (
    <figure className="flex min-h-0 flex-col border border-line bg-surface p-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <figcaption>
          <h3 className="text-[13px] font-medium text-ink">{title}</h3>
          <p className="font-mono text-[11px] text-quiet">
            {quantity}({formatNumber(currentTime)} s)
          </p>
        </figcaption>
        <p className="font-mono text-[15px] font-medium tabular-nums" style={{ color: strokeColor }}>
          {formatNumber(currentValue)}{" "}
          <span className="text-[11px] font-normal text-quiet">{unit}</span>
        </p>
      </div>

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-h-0 flex-1 w-full bg-paper"
        role="img"
        aria-label={`${title}，当前 ${formatNumber(currentValue)} ${unit}`}
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
        {points.length >= 2 ? (
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
          min {formatNumber(min)} {unit}
        </span>
        <span>0-{formatNumber(timeMax)} s</span>
        <span>
          max {formatNumber(max)} {unit}
        </span>
      </div>
    </figure>
  );
});
