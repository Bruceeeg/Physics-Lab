"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SamplePoint = {
  t: number;
  x: number;
  v: number;
};

function formatNumber(value: number) {
  return value.toFixed(2);
}

function positionAt(x0: number, v0: number, a: number, t: number) {
  return x0 + v0 * t + 0.5 * a * t * t;
}

function velocityAt(v0: number, a: number, t: number) {
  return v0 + a * t;
}

function buildLinePath(
  points: SamplePoint[],
  valueKey: "x" | "v",
  width: number,
  height: number,
  valueMin: number,
  valueMax: number,
  duration: number,
) {
  if (points.length === 0) {
    return "";
  }

  const range = valueMax - valueMin || 1;
  const timeSpan = duration || 1;

  return points
    .map((point, index) => {
      const px = (point.t / timeSpan) * width;
      const py = height - ((point[valueKey] - valueMin) / range) * height;
      return `${index === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
    })
    .join(" ");
}

function playbackStatus(isPlaying: boolean, time: number, duration: number) {
  if (isPlaying) {
    return "正在播放";
  }
  if (time > 0 && time < duration) {
    return "已暂停";
  }
  if (time >= duration && duration > 0) {
    return "已结束";
  }
  return "待开始";
}

function MotionChart({
  title,
  quantity,
  strokeColor,
  points,
  trailPoints,
  valueKey,
  unit,
  currentTime,
  currentValue,
  duration,
}: {
  title: string;
  quantity: string;
  strokeColor: string;
  points: SamplePoint[];
  trailPoints: SamplePoint[];
  valueKey: "x" | "v";
  unit: string;
  currentTime: number;
  currentValue: number;
  duration: number;
}) {
  const values = points.map((point) => point[valueKey]);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const range = max - min || 1;
  const predictedPath = useMemo(
    () => buildLinePath(points, valueKey, 320, 160, min, max, duration),
    [points, valueKey, min, max, duration],
  );
  const trailPath = useMemo(
    () => buildLinePath(trailPoints, valueKey, 320, 160, min, max, duration),
    [trailPoints, valueKey, min, max, duration],
  );
  const markerX = duration > 0 ? (currentTime / duration) * 320 : 0;
  const markerY = 160 - ((currentValue - min) / range) * 160;
  const zeroY = min < 0 && max > 0 ? 160 - ((0 - min) / range) * 160 : null;

  return (
    <figure className="border border-line bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <figcaption>
          <h2 className="text-base font-medium text-ink">{title}</h2>
          <p className="mt-0.5 font-mono text-xs text-quiet">
            {quantity}({formatNumber(currentTime)} s)
          </p>
        </figcaption>
        <p className="font-mono text-lg font-medium tabular-nums" style={{ color: strokeColor }}>
          {formatNumber(currentValue)}{" "}
          <span className="text-sm font-normal text-quiet">{unit}</span>
        </p>
      </div>

      <svg
        viewBox="0 0 320 160"
        className="h-44 w-full bg-paper"
        role="img"
        aria-label={`${title}，当前 ${formatNumber(currentValue)} ${unit}`}
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={`h-${fraction}`}
            x1="0"
            y1={160 * fraction}
            x2="320"
            y2={160 * fraction}
            stroke="#E9EEF5"
            strokeWidth="1"
          />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((fraction) => (
          <line
            key={`v-${fraction}`}
            x1={320 * fraction}
            y1="0"
            x2={320 * fraction}
            y2="160"
            stroke="#E9EEF5"
            strokeWidth="1"
          />
        ))}
        {zeroY !== null ? (
          <line x1="0" y1={zeroY} x2="320" y2={zeroY} stroke="#CBD5E1" strokeWidth="1" />
        ) : null}
        <line x1="0" y1="0" x2="0" y2="160" stroke="#1E3A5F" strokeWidth="1" />
        <line x1="0" y1="160" x2="320" y2="160" stroke="#1E3A5F" strokeWidth="1" />
        {points.length >= 2 ? (
          <path
            d={predictedPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.25"
            strokeOpacity="0.28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {trailPoints.length >= 2 ? (
          <path
            d={trailPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        <line
          x1={markerX}
          y1="0"
          x2={markerX}
          y2="160"
          stroke="#1E3A5F"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        <circle cx={markerX} cy={markerY} r="3.5" fill={strokeColor} />
      </svg>

      <div className="mt-2 flex justify-between font-mono text-[11px] tabular-nums text-quiet">
        <span>
          min {formatNumber(min)} {unit}
        </span>
        <span>t / s</span>
        <span>
          max {formatNumber(max)} {unit}
        </span>
      </div>
    </figure>
  );
}

const PARAMS = [
  { key: "x0", label: "初始位置 x₀", min: -10, max: 10, step: 0.5, unit: "m" },
  { key: "v0", label: "初速度 v₀", min: -10, max: 10, step: 0.5, unit: "m/s" },
  { key: "a", label: "加速度 a", min: -5, max: 5, step: 0.5, unit: "m/s²" },
  { key: "duration", label: "总时长 T", min: 1, max: 10, step: 0.5, unit: "s" },
] as const;

export function LinearMotionLab() {
  const [x0, setX0] = useState(0);
  const [v0, setV0] = useState(4);
  const [a, setA] = useState(2);
  const [duration, setDuration] = useState(5);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const timeRef = useRef(0);
  const durationRef = useRef(duration);
  const playingRef = useRef(false);
  const frameRef = useRef(0);
  const originWallRef = useRef(0);
  const originTimeRef = useRef(0);

  durationRef.current = duration;

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, []);

  const stopLoop = () => {
    playingRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  };

  const startLoop = () => {
    if (playingRef.current) {
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);
    originWallRef.current = performance.now();
    originTimeRef.current = timeRef.current;

    const tick = (now: number) => {
      if (!playingRef.current) {
        frameRef.current = 0;
        return;
      }

      const elapsed = Math.max(0, (now - originWallRef.current) / 1000);
      const nextTime = Math.min(durationRef.current, originTimeRef.current + elapsed);
      timeRef.current = nextTime;
      setTime(nextTime);

      if (nextTime >= durationRef.current) {
        stopLoop();
        setIsPlaying(false);
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const currentPosition = positionAt(x0, v0, a, time);
  const currentVelocity = velocityAt(v0, a, time);
  const displacement = currentPosition - x0;
  const progress = duration > 0 ? (time / duration) * 100 : 0;

  const samples = useMemo(() => {
    const stepCount = 80;
    const nextPoints: SamplePoint[] = [];

    for (let index = 0; index <= stepCount; index += 1) {
      const sampleTime = (duration * index) / stepCount;
      nextPoints.push({
        t: sampleTime,
        x: positionAt(x0, v0, a, sampleTime),
        v: velocityAt(v0, a, sampleTime),
      });
    }

    return nextPoints;
  }, [a, duration, v0, x0]);

  const trailPoints = useMemo(() => {
    if (time <= 0) {
      return [];
    }

    const stepCount = Math.max(2, Math.ceil((time / Math.max(duration, 0.001)) * 80));
    const nextPoints: SamplePoint[] = [];

    for (let index = 0; index <= stepCount; index += 1) {
      const sampleTime = (time * index) / stepCount;
      nextPoints.push({
        t: sampleTime,
        x: positionAt(x0, v0, a, sampleTime),
        v: velocityAt(v0, a, sampleTime),
      });
    }

    return nextPoints;
  }, [a, duration, time, v0, x0]);

  const trackBounds = useMemo(() => {
    const xs = samples.map((point) => point.x);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 0);
    const span = Math.max(maxX - minX, 4);
    const padding = span * 0.12;
    return {
      min: minX - padding,
      max: maxX + padding,
    };
  }, [samples]);

  const toTrackPercent = (x: number) => {
    const span = trackBounds.max - trackBounds.min || 1;
    return ((x - trackBounds.min) / span) * 100;
  };

  const trackTrailPath = useMemo(() => {
    if (trailPoints.length === 0) {
      return "";
    }

    return trailPoints
      .map((point, index) => {
        const left = Math.max(0, Math.min(100, toTrackPercent(point.x)));
        const command = index === 0 ? "M" : "L";
        return `${command} ${left} 50`;
      })
      .join(" ");
  }, [trailPoints, trackBounds.max, trackBounds.min]);

  const handleStart = () => {
    if (timeRef.current >= durationRef.current) {
      timeRef.current = 0;
      setTime(0);
    }
    startLoop();
  };

  const handlePause = () => {
    stopLoop();
    setIsPlaying(false);
  };

  const handleReset = () => {
    stopLoop();
    timeRef.current = 0;
    setIsPlaying(false);
    setTime(0);
  };

  const handleDurationChange = (value: number) => {
    setDuration(value);
    if (timeRef.current > value) {
      timeRef.current = value;
      setTime(value);
      stopLoop();
      setIsPlaying(false);
    }
  };

  const paramValues = {
    x0,
    v0,
    a,
    duration,
  };

  const paramSetters = {
    x0: setX0,
    v0: setV0,
    a: setA,
    duration: handleDurationChange,
  };

  const originPercent = Math.max(0, Math.min(100, toTrackPercent(0)));
  const particlePercent = Math.max(0, Math.min(100, toTrackPercent(currentPosition)));
  const status = playbackStatus(isPlaying, time, duration);

  return (
    <div className="min-h-[100dvh] bg-paper px-4 py-6 text-ink md:px-8 md:py-8">
      <a
        href="#lab-bench"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-navy focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-navy"
      >
        跳到实验台
      </a>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-4">
        <header className="border border-line bg-surface">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-quiet">Physics Lab / 运动学</p>
              <h1 className="mt-1 text-2xl font-medium tracking-tight text-ink md:text-[1.75rem]">
                匀变速直线运动
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-quiet">
                调节初值后按真实时间推进。位置与速度由
                <span className="mx-1 font-mono text-ink">
                  x = x<sub>0</sub> + v<sub>0</sub>t + ½at<sup>2</sup>
                </span>
                与
                <span className="mx-1 font-mono text-ink">
                  v = v<sub>0</sub> + at
                </span>
                给出。单位为 SI：m、m/s、m/s²、s。
              </p>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="font-mono text-2xl tabular-nums text-ink">
                  t = {formatNumber(time)} / {formatNumber(duration)}{" "}
                  <span className="text-sm text-quiet">s</span>
                </p>
                <p className="text-sm text-quiet">{status}</p>
              </div>
              <div
                className="mt-3 h-0.5 bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={Number(time.toFixed(2))}
                aria-label="实验时间进度"
              >
                <div className="h-0.5 bg-navy" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStart}
                disabled={isPlaying}
                className="min-h-10 cursor-pointer bg-navy px-4 py-2 text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                {time > 0 && time < duration ? "继续" : "开始"}
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={!isPlaying}
                className="min-h-10 cursor-pointer border border-navy bg-surface px-4 py-2 text-sm font-medium text-navy transition-colors duration-150 hover:bg-muted active:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                暂停
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="min-h-10 cursor-pointer border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-muted active:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                重置
              </button>
            </div>
          </div>
        </header>

        <div id="lab-bench" className="grid gap-4 lg:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)]">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
            <section className="border border-line bg-surface p-5">
              <h2 className="text-base font-medium text-ink">参数</h2>
              <p className="mt-1 text-xs text-quiet">滑动条改变初值，曲线与轨道立即按公式重算。</p>
              <div className="mt-5 space-y-5">
                {PARAMS.map((item) => (
                  <label key={item.key} className="block">
                    <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink">{item.label}</span>
                      <span className="font-mono tabular-nums text-navy">
                        {formatNumber(paramValues[item.key])} {item.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={paramValues[item.key]}
                      onChange={(event) => paramSetters[item.key](Number(event.target.value))}
                      aria-valuetext={`${formatNumber(paramValues[item.key])} ${item.unit}`}
                    />
                    <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-quiet">
                      <span>
                        {item.min} {item.unit}
                      </span>
                      <span>
                        {item.max} {item.unit}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="border border-line bg-surface p-5">
              <h2 className="text-base font-medium text-ink">瞬时读数</h2>
              <dl className="mt-4 divide-y divide-line border-t border-line">
                <div className="flex items-baseline justify-between gap-3 py-3">
                  <dt className="text-sm text-quiet">x(t)</dt>
                  <dd className="font-mono text-lg tabular-nums text-navy">
                    {formatNumber(currentPosition)} m
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-3">
                  <dt className="text-sm text-quiet">Δx = x - x₀</dt>
                  <dd className="font-mono text-lg tabular-nums text-ink">
                    {formatNumber(displacement)} m
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-3">
                  <dt className="text-sm text-quiet">v(t)</dt>
                  <dd className="font-mono text-lg tabular-nums text-gold">
                    {formatNumber(currentVelocity)} m/s
                  </dd>
                </div>
              </dl>
            </section>

            <section className="border border-line bg-surface p-5">
              <h2 className="text-base font-medium text-ink">公式代入</h2>
              <div className="mt-3 space-y-3 font-mono text-xs leading-6 text-ink">
                <p>
                  x = {formatNumber(x0)} + {formatNumber(v0)} × {formatNumber(time)} + ½ ×{" "}
                  {formatNumber(a)} × {formatNumber(time)}²
                </p>
                <p className="text-navy">x = {formatNumber(currentPosition)} m</p>
                <p>
                  v = {formatNumber(v0)} + {formatNumber(a)} × {formatNumber(time)}
                </p>
                <p className="text-gold">v = {formatNumber(currentVelocity)} m/s</p>
              </div>
            </section>
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <section className="border border-line bg-surface p-5">
              <h2 className="text-base font-medium text-ink">运动示意</h2>
              <p className="mt-1 text-sm text-quiet">
                质点按真实时间沿一维轨道运动。淡轨迹为已走过路径，竖线为 x = 0。
              </p>

              <div className="relative mt-5 overflow-hidden border border-line bg-paper px-4 py-8">
                <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-line" />
                <div className="relative h-28">
                  <div
                    className="pointer-events-none absolute inset-y-0 w-px bg-navy/35"
                    style={{ left: `${originPercent}%` }}
                  />
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                    {trailPoints.length >= 2 && trackTrailPath ? (
                      <path
                        d={trackTrailPath}
                        fill="none"
                        stroke="#1E3A5F"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.85"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null}
                  </svg>
                  {trailPoints.map((point, index) => {
                    if (index % 3 !== 0 && index !== trailPoints.length - 1) {
                      return null;
                    }
                    const left = toTrackPercent(point.x);
                    const trailProgress = trailPoints.length <= 1 ? 1 : index / (trailPoints.length - 1);
                    return (
                      <div
                        key={`${point.t}-${index}`}
                        className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-navy"
                        style={{
                          left: `${Math.max(0, Math.min(100, left))}%`,
                          opacity: 0.2 + trailProgress * 0.5,
                        }}
                      />
                    );
                  })}
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 border-2 border-navy bg-surface"
                    style={{ left: `${particlePercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="relative mt-3 h-4 font-mono text-[11px] tabular-nums text-quiet">
                  <span className="absolute left-0">{formatNumber(trackBounds.min)} m</span>
                  {originPercent > 12 && originPercent < 88 ? (
                    <span className="absolute -translate-x-1/2" style={{ left: `${originPercent}%` }}>
                      0
                    </span>
                  ) : null}
                  <span className="absolute right-0">{formatNumber(trackBounds.max)} m</span>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <MotionChart
                title="位置-时间"
                quantity="x"
                strokeColor="#1E3A5F"
                points={samples}
                trailPoints={trailPoints}
                valueKey="x"
                unit="m"
                currentTime={time}
                currentValue={currentPosition}
                duration={duration}
              />
              <MotionChart
                title="速度-时间"
                quantity="v"
                strokeColor="#A16207"
                points={samples}
                trailPoints={trailPoints}
                valueKey="v"
                unit="m/s"
                currentTime={time}
                currentValue={currentVelocity}
                duration={duration}
              />
            </section>

            <section className="border border-line bg-surface p-5">
              <h2 className="text-base font-medium text-ink">物理观察</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-quiet">
                <li>当 a &gt; 0 时，速度-时间图是一条斜率为正的直线。</li>
                <li>当 a = 0 时，退化为匀速直线运动，位置-时间图变成直线。</li>
                <li>当 v0 和 a 方向相反时，物体会先减速，再反向加速。</li>
                <li>位置-时间图是抛物线，曲率由加速度大小决定。</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
