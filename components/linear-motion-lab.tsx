"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ModeSwitch } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import {
  clampTime,
  elapsedTrail,
  motionSample,
  motionSamplePhased,
  predictedSamples,
  predictedSamplesPhased,
  TIME_MAX,
  TIME_MIN,
} from "@/lib/models/linear-motion";
import type { KinematicSample } from "@/lib/models/pull-friction";

const PARAMETER_DEFINITIONS = [
  { key: "x0", label: "初位置", symbol: "x₀", unit: "m", min: -10, max: 10, step: 0.1 },
  { key: "v0", label: "初速度", symbol: "v₀", unit: "m/s", min: -10, max: 10, step: 0.1 },
  { key: "a", label: "加速度", symbol: "a", unit: "m/s²", min: -5, max: 5, step: 0.1 },
  {
    key: "t",
    label: "时间",
    symbol: "t",
    unit: "s",
    min: TIME_MIN,
    max: TIME_MAX,
    step: 0.01,
  },
] as const;

type ParamKey = (typeof PARAMETER_DEFINITIONS)[number]["key"];

function formatNumber(value: number) {
  return value.toFixed(2);
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="min-w-0 border-l border-line pl-3">
      <p className="text-[10px] text-quiet">{label}</p>
      <p className="truncate font-mono text-base tabular-nums text-ink">
        {value} <span className="text-[10px] text-quiet">{unit}</span>
      </p>
    </div>
  );
}

function toChartSample(
  sample: { t: number; x: number; v: number },
  x0: number,
  a: number,
): KinematicSample {
  return {
    t: sample.t,
    x: sample.x,
    vx: sample.v,
    ax: a,
    fxNet: a,
    dx: sample.x - x0,
  };
}

export function LinearMotionLab() {
  const [mode, setMode] = useState<"single" | "two-phase">("single");
  const [x0, setX0] = useState(0);
  const [v0, setV0] = useState(4);
  const [a, setA] = useState(2);
  const [tSwitch, setTSwitch] = useState(2);
  const [a2, setA2] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const frameRef = useRef(0);
  const lastStampRef = useRef(0);

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

  const pause = () => {
    stopLoop();
    setIsPlaying(false);
  };

  const setClock = (value: number) => {
    const next = clampTime(value);
    timeRef.current = next;
    setTime(next);
    return next;
  };

  const applyTime = (value: number) => {
    const next = setClock(value);
    lastStampRef.current = 0;
    return next;
  };

  const startLoop = () => {
    if (playingRef.current) {
      return;
    }
    playingRef.current = true;
    setIsPlaying(true);
    lastStampRef.current = 0;

    const tick = (now: number) => {
      if (!playingRef.current) {
        frameRef.current = 0;
        return;
      }

      if (lastStampRef.current === 0) {
        lastStampRef.current = now;
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(0.05, Math.max(0, (now - lastStampRef.current) / 1000));
      lastStampRef.current = now;
      setClock(timeRef.current + dt);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    pause();
    applyTime(TIME_MIN);
  };

  const updateParam = (key: ParamKey, value: number) => {
    if (key === "t") {
      applyTime(value);
      return;
    }
    if (key === "x0") {
      setX0(value);
      return;
    }
    if (key === "v0") {
      setV0(value);
      return;
    }
    setA(value);
  };

  const twoPhase = mode === "two-phase";
  const live = twoPhase
    ? motionSamplePhased(x0, v0, a, tSwitch, a2, time)
    : motionSample(x0, v0, a, time);
  const currentA = twoPhase && time > tSwitch ? a2 : a;
  const currentPosition = live.x;
  const currentVelocity = live.v;
  const displacement = currentPosition - x0;
  const chartDomain = Math.max(10, time);
  const samples = useMemo(
    () =>
      twoPhase
        ? predictedSamplesPhased(x0, v0, a, tSwitch, a2, chartDomain)
        : predictedSamples(x0, v0, a, chartDomain),
    [a, a2, chartDomain, tSwitch, twoPhase, v0, x0],
  );
  const trail = elapsedTrail(samples, live);
  const trailPoints = trail.path;
  const chartSeries = samples.map((sample) =>
    toChartSample(sample, x0, twoPhase && sample.t > tSwitch ? a2 : a),
  );

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

  const span = trackBounds.max - trackBounds.min || 1;
  const trackTrailPath =
    trailPoints.length === 0
      ? ""
      : trailPoints
          .map((point, index) => {
            const left = Math.max(
              0,
              Math.min(100, ((point.x - trackBounds.min) / span) * 100),
            );
            return `${index === 0 ? "M" : "L"} ${left} 50`;
          })
          .join(" ");

  const paramValues: Record<ParamKey, number> = { x0, v0, a, t: time };
  const originPercent = Math.max(0, Math.min(100, toTrackPercent(0)));
  const particlePercent = Math.max(0, Math.min(100, toTrackPercent(currentPosition)));
  const status = isPlaying ? "正在播放" : time > 0 ? "已暂停" : "待开始";

  return (
    <div className="lab-shell bg-paper text-ink">
      <header className="lab-commandbar lab-commandbar--modes border-b border-line bg-surface">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">
            <Link
              href="/"
              className="mr-2 text-[11px] font-normal text-quiet hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              目录
            </Link>
            匀变速直线运动
          </p>
          <p className="font-mono text-[10px] text-quiet">Physics Lab / Unit 1 运动学</p>
        </div>
        <ModeSwitch
          value={mode}
          options={[
            { id: "single" as const, label: "单段加速" },
            { id: "two-phase" as const, label: "两段运动" },
          ]}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
        <div className="grid min-w-0 grid-cols-3">
          <Stat label="时间 t" value={formatNumber(time)} unit="s" />
          <Stat label="速度 v" value={formatNumber(currentVelocity)} unit="m/s" />
          <Stat label="位移 Δx" value={formatNumber(displacement)} unit="m" />
        </div>
        <p role="status" className="min-w-0 truncate text-xs text-quiet" title={status}>
          {status}
        </p>
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={startLoop}
            disabled={isPlaying}
            className="h-8 min-w-16 cursor-pointer bg-navy px-3 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {time > 0 ? "继续" : "开始"}
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!isPlaying}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            暂停
          </button>
          <button
            type="button"
            onClick={reset}
            className="h-8 min-w-16 cursor-pointer border border-line bg-surface px-3 text-[13px] font-medium text-ink"
          >
            重置
          </button>
        </div>
      </header>

      <main className="lab-workspace">
        <aside className="lab-parameters min-h-0 border border-line bg-surface">
          <div className="border-b border-line px-2.5 py-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">参数设置</h2>
              <span className="font-mono text-[10px] text-quiet">SI</span>
            </div>
            <p className="mt-0.5 text-[11px] text-quiet">
              数字输入可按 Enter 确认，滑条立即生效。时间可手动设定。
            </p>
          </div>

          <div className="space-y-1 px-1.5 py-1.5">
            {PARAMETER_DEFINITIONS.map((item) => (
              <ParameterControl
                key={item.key}
                id={item.key}
                label={item.key === "a" && twoPhase ? "第一段加速度" : item.label}
                symbol={item.key === "a" && twoPhase ? "a₁" : item.symbol}
                unit={item.unit}
                value={paramValues[item.key]}
                min={item.min}
                max={item.max}
                step={item.step}
                onChange={(value) => updateParam(item.key, value)}
              />
            ))}
            {twoPhase ? (
              <>
                <ParameterControl
                  id="tSwitch"
                  label="换段时刻"
                  symbol="t₁"
                  unit="s"
                  value={tSwitch}
                  min={0.2}
                  max={20}
                  step={0.1}
                  onChange={setTSwitch}
                />
                <ParameterControl
                  id="a2"
                  label="第二段加速度"
                  symbol="a₂"
                  unit="m/s²"
                  value={a2}
                  min={-5}
                  max={5}
                  step={0.1}
                  onChange={setA2}
                />
              </>
            ) : null}
          </div>

          <div className="mx-2 min-h-8 border border-line bg-paper px-2 py-1.5 text-[11px] leading-4 text-quiet">
            滑条 {TIME_MIN}–{TIME_MAX} s，数字框可超出。播放按真实时间推进。
          </div>

          <section className="mx-2 mt-2 border-t border-line pt-2">
            <h2 className="text-[13px] font-medium text-ink">公式代入</h2>
            <div className="mt-1 space-y-1 font-mono text-[11px] leading-5">
              {twoPhase ? (
                <>
                  <p className="text-quiet">t ≤ t₁ 用 a₁，之后用 a₂。a₂ = 0 即匀速。</p>
                  <p>
                    t₁ = {formatNumber(tSwitch)} s，a₂ = {formatNumber(a2)} m/s²
                  </p>
                </>
              ) : (
                <p>
                  x = {formatNumber(x0)} + {formatNumber(v0)}t + ½{formatNumber(a)}t²
                </p>
              )}
              <p className="text-navy">x = {formatNumber(currentPosition)} m</p>
              <p className="text-gold">v = {formatNumber(currentVelocity)} m/s</p>
              <p>当前 a = {formatNumber(currentA)} m/s²</p>
            </div>
          </section>
        </aside>

        <section className="lab-scene min-h-0 border border-line bg-surface">
          <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
            <h2 className="text-xs font-medium text-ink">一维运动轨道</h2>
            <p className="font-mono text-[10px] text-quiet">竖线为 x = 0</p>
          </div>
          <div className="relative min-h-0 flex-1 bg-paper px-5 py-8">
            <div className="absolute inset-x-5 top-1/2 h-px -translate-y-1/2 bg-line" />
            <div className="relative h-full min-h-40">
              <div
                className="pointer-events-none absolute inset-y-8 w-px bg-navy/35"
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
              {trail.markers.map((point, index) => {
                if (index % 3 !== 0) {
                  return null;
                }
                const left = toTrackPercent(point.x);
                const trailProgress = chartDomain > 0 ? point.t / chartDomain : 1;
                return (
                  <div
                    key={point.t}
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
          <dl className="grid h-12 grid-cols-4 border-t border-line font-mono text-[11px] tabular-nums">
            {[
              ["x", currentPosition, "m"],
              ["v", currentVelocity, "m/s"],
              ["a", currentA, "m/s²"],
              ["Δx", displacement, "m"],
            ].map(([label, value, unit]) => (
              <div key={String(label)} className="border-r border-line px-2 py-1 last:border-r-0">
                <dt className="text-quiet">{label}</dt>
                <dd className="truncate text-ink">
                  {formatNumber(Number(value))} {unit}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="lab-charts min-h-0">
          <TimeSeriesChart
            title="位置-时间"
            quantity="x"
            unit="m"
            strokeColor="#1E3A5F"
            valueKey="x"
            points={chartSeries}
            currentTime={time}
            currentValue={currentPosition}
          />
          <TimeSeriesChart
            title="速度-时间"
            quantity="v"
            unit="m/s"
            strokeColor="#A16207"
            valueKey="vx"
            points={chartSeries}
            currentTime={time}
            currentValue={currentVelocity}
          />
          <TimeSeriesChart
            title="加速度-时间"
            quantity="a"
            unit="m/s²"
            strokeColor="#475569"
            valueKey="ax"
            points={chartSeries}
            currentTime={time}
            currentValue={currentA}
          />
          <TimeSeriesChart
            title="位移-时间"
            quantity="Δx"
            unit="m"
            strokeColor="#0F172A"
            valueKey="dx"
            points={chartSeries}
            currentTime={time}
            currentValue={displacement}
          />
        </aside>
      </main>
    </div>
  );
}
