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

function MotionChart({
  title,
  strokeColor,
  valueClassName,
  points,
  trailPoints,
  valueKey,
  unit,
  currentTime,
  currentValue,
  duration,
}: {
  title: string;
  strokeColor: string;
  valueClassName: string;
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
  const trailPath = useMemo(
    () => buildLinePath(trailPoints, valueKey, 320, 160, min, max, duration),
    [trailPoints, valueKey, min, max, duration],
  );
  const markerX = duration > 0 ? (currentTime / duration) * 320 : 0;
  const markerY = 160 - ((currentValue - min) / range) * 160;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-slate-400">{title}</p>
          <p className="text-xs text-slate-500">横轴: 时间 t (s) · 纵轴单位: {unit}</p>
        </div>
        <p className={`text-2xl font-semibold ${valueClassName}`}>{formatNumber(currentValue)}</p>
      </div>

      <svg viewBox="0 0 320 160" className="h-44 w-full overflow-visible">
        <line x1="0" y1="0" x2="0" y2="160" stroke="#334155" strokeWidth="1" />
        <line x1="0" y1="160" x2="320" y2="160" stroke="#334155" strokeWidth="1" />
        {trailPoints.length >= 2 ? (
          <path d={trailPath} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        <circle cx={markerX} cy={markerY} r="5" fill={strokeColor} />
      </svg>

      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>min {formatNumber(min)}</span>
        <span>max {formatNumber(max)}</span>
      </div>
    </div>
  );
}

export default function Home() {
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

  return (
    <main className="min-h-screen px-6 py-10 text-slate-100 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-sky-500/20 bg-slate-950/60 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Physics Lab</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                匀变速直线运动
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                用一个最小可交互页面展示
                <span className="mx-1 rounded bg-slate-900 px-2 py-1 text-sky-200">x = x0 + v0t + 1/2 at^2</span>
                和
                <span className="mx-1 rounded bg-slate-900 px-2 py-1 text-emerald-200">v = v0 + at</span>
                。拖动参数后，点开始、暂停或重置，光点会按真实时间沿轨道运动。
              </p>
            </div>

            <div className="grid min-w-[260px] gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
              <div>
                <p className="text-sm text-slate-400">当前时刻</p>
                <p className="mt-1 text-3xl font-semibold">
                  {formatNumber(time)} / {formatNumber(duration)} s
                </p>
              </div>
              <div className="h-4 rounded-full bg-slate-800">
                <div
                  className="h-4 rounded-full bg-sky-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {isPlaying ? "正在播放" : time > 0 && time < duration ? "已暂停" : time >= duration && duration > 0 ? "已结束" : "待开始"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">参数面板</h2>
              <p className="mt-2 text-sm text-slate-400">单位统一采用 SI 制：m、m/s、m/s²、s</p>
            </div>

            <div className="space-y-6">
              {[
                { label: "初始位置 x0", value: x0, min: -10, max: 10, step: 0.5, setter: setX0, unit: "m" },
                { label: "初速度 v0", value: v0, min: -10, max: 10, step: 0.5, setter: setV0, unit: "m/s" },
                { label: "加速度 a", value: a, min: -5, max: 5, step: 0.5, setter: setA, unit: "m/s²" },
                { label: "总时长 T", value: duration, min: 1, max: 10, step: 0.5, setter: handleDurationChange, unit: "s" },
              ].map((item) => (
                <label key={item.label} className="block">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 font-medium text-sky-200">
                      {formatNumber(item.value)} {item.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={item.value}
                    onChange={(event) => item.setter(Number(event.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6">
              <p className="text-sm text-slate-400">当前位置 x(t)</p>
              <p className="mt-2 text-4xl font-semibold text-sky-300">{formatNumber(currentPosition)} m</p>
              <p className="mt-2 text-sm text-slate-500">相对位移: {formatNumber(displacement)} m</p>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6">
              <p className="text-sm text-slate-400">当前速度 v(t)</p>
              <p className="mt-2 text-4xl font-semibold text-emerald-300">{formatNumber(currentVelocity)} m/s</p>
              <p className="mt-2 text-sm text-slate-500">速度随时间线性变化</p>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-slate-400">公式代入结果</p>
              <div className="mt-4 space-y-3 font-mono text-sm text-slate-200">
                <p>
                  x = {formatNumber(x0)} + {formatNumber(v0)} x {formatNumber(time)} + 1/2 x {formatNumber(a)} x {formatNumber(time)}²
                </p>
                <p className="text-sky-200">x = {formatNumber(currentPosition)} m</p>
                <p>
                  v = {formatNumber(v0)} + {formatNumber(a)} x {formatNumber(time)}
                </p>
                <p className="text-emerald-200">v = {formatNumber(currentVelocity)} m/s</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">运动示意</h2>
                <p className="mt-2 text-sm text-slate-400">
                  光点按真实时间运动，走过的路径会留下轨迹。暂停停在当前位置，重置回到起点并清空轨迹。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isPlaying}
                  className="rounded-full bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {time > 0 && time < duration ? "继续" : "开始"}
                </button>
                <button
                  type="button"
                  onClick={handlePause}
                  disabled={!isPlaying}
                  className="rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  暂停
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100"
                >
                  重置
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
              <div className="absolute inset-x-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-700" />
              <div className="relative h-40">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  {trailPoints.length >= 2 && trackTrailPath ? (
                    <path
                      d={trackTrailPath}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.4"
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
                  const progress = trailPoints.length <= 1 ? 1 : index / (trailPoints.length - 1);
                  return (
                    <div
                      key={`${point.t}-${index}`}
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300"
                      style={{
                        left: `${Math.max(0, Math.min(100, left))}%`,
                        opacity: 0.25 + progress * 0.55,
                      }}
                    />
                  );
                })}
                <div
                  className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-sky-200 bg-sky-400"
                  style={{ left: `${Math.max(0, Math.min(100, toTrackPercent(currentPosition)))}%` }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs text-slate-500">
                <span>{formatNumber(trackBounds.min)} m</span>
                <span>0 m</span>
                <span>{formatNumber(trackBounds.max)} m</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-2xl font-semibold text-white">物理观察</h2>
            <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              <li>当 a &gt; 0 时，速度-时间图是一条斜率为正的直线。</li>
              <li>当 a = 0 时，退化为匀速直线运动，位置-时间图变成直线。</li>
              <li>当 v0 和 a 方向相反时，物体会先减速，再反向加速。</li>
              <li>位置-时间图是抛物线，曲率由加速度大小决定。</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <MotionChart
            title="位置 - 时间图 x(t)"
            strokeColor="#38bdf8"
            valueClassName="text-sky-300"
            points={samples}
            trailPoints={trailPoints}
            valueKey="x"
            unit="m"
            currentTime={time}
            currentValue={currentPosition}
            duration={duration}
          />
          <MotionChart
            title="速度 - 时间图 v(t)"
            strokeColor="#34d399"
            valueClassName="text-emerald-300"
            points={samples}
            trailPoints={trailPoints}
            valueKey="v"
            unit="m/s"
            currentTime={time}
            currentValue={currentVelocity}
            duration={duration}
          />
        </section>
      </div>
    </main>
  );
}
