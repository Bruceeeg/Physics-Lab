"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ParameterControl } from "@/components/parameter-control";
import { ProjectileMeasurementBoard } from "@/components/projectile-measurement-board";
import { ProjectilePredictionPanel } from "@/components/projectile-prediction-panel";
import type { SceneTarget, TrailPoint2D } from "@/components/projectile-scene";
import {
  apexHeight,
  flightTime,
  range,
  sampleAt,
  type ProjectileParams,
  type ProjectileSample,
} from "@/lib/models/projectile";
import {
  canLaunch,
  createPrediction,
  placeTarget,
  predictionParams,
  recordLanding,
  retryPrediction,
  setHeight,
  setTheta,
  setV0,
  type PredictionState,
} from "@/lib/models/projectile-prediction";
import { formatLabNumber } from "@/lib/models/lab-format";
import { appendTimeSample } from "@/lib/models/time-series";

const SceneCanvas = dynamic(() => import("@/components/projectile-canvas"), {
  ssr: false,
});

type LabMode = "params" | "predict";

const DEFAULT_PARAMS: ProjectileParams = { v0: 5, thetaDeg: 30, h: 1, g: 9.81, m: 0.2 };

const PARAMETER_DEFINITIONS: {
  key: keyof ProjectileParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "v0", label: "初速度", symbol: "v₀", unit: "m/s", min: 0.5, max: 12, step: 0.1 },
  { key: "thetaDeg", label: "发射角", symbol: "θ", unit: "°", min: 0, max: 80, step: 1 },
  { key: "h", label: "发射高度", symbol: "h", unit: "m", min: 0, max: 3, step: 0.05 },
  { key: "m", label: "质量", symbol: "m", unit: "kg", min: 0.05, max: 2, step: 0.05 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

const TRAIL_MAX_POINTS = 400;

function formatNumber(value: number) {
  return formatLabNumber(value);
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="min-w-0 border-l border-line pl-3">
      <p className="text-[10px] text-quiet">{label}</p>
      <p className="truncate font-mono text-base tabular-nums text-ink">
        {value} <span className="text-[10px] text-quiet">{unit}</span>
      </p>
    </div>
  );
}

function ModeSwitch({ mode, onChange }: { mode: LabMode; onChange: (mode: LabMode) => void }) {
  return (
    <div className="mode-switch" role="group" aria-label="实验模式">
      <button type="button" aria-pressed={mode === "params"} onClick={() => onChange("params")}>
        参数实验
      </button>
      <button type="button" aria-pressed={mode === "predict"} onClick={() => onChange("predict")}>
        预估落点
      </button>
    </div>
  );
}

export function ProjectileLab() {
  const [mode, setMode] = useState<LabMode>("params");
  const [paramsA, setParamsA] = useState<ProjectileParams>(DEFAULT_PARAMS);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [landed, setLanded] = useState(false);
  const [trail, setTrail] = useState<TrailPoint2D[]>([]);
  const [series, setSeries] = useState<ProjectileSample[]>([]);

  const activeParams = useMemo<ProjectileParams>(
    () => (mode === "predict" && prediction ? predictionParams(prediction) : paramsA),
    [mode, paramsA, prediction],
  );

  const paramsRef = useRef(activeParams);
  const modeRef = useRef<LabMode>("params");
  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const frameRef = useRef(0);
  const lastStampRef = useRef(0);

  useEffect(() => {
    paramsRef.current = activeParams;
  }, [activeParams]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
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

  const clearFlight = () => {
    pause();
    timeRef.current = 0;
    lastStampRef.current = 0;
    setTime(0);
    setLanded(false);
    setTrail([]);
    setSeries([]);
  };

  const startLoop = () => {
    if (playingRef.current) {
      return;
    }
    const params = paramsRef.current;
    if (timeRef.current >= flightTime(params)) {
      timeRef.current = 0;
      setTime(0);
      setLanded(false);
      setTrail([]);
      setSeries([]);
    }

    playingRef.current = true;
    setIsPlaying(true);
    lastStampRef.current = 0;
    setSeries((current) =>
      current.length === 0 ? [sampleAt(params, timeRef.current)] : current,
    );

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
      const p = paramsRef.current;
      const limit = flightTime(p);
      const next = Math.min(limit, timeRef.current + dt);
      timeRef.current = next;
      const sample = sampleAt(p, next);
      setTime(next);
      setSeries((current) => appendTimeSample(current, sample));
      const minGap = Math.max(0.02, range(p) / 300);
      setTrail((current) => {
        const last = current[current.length - 1];
        if (last && Math.hypot(last.x - sample.x, last.y - sample.y) < minGap) {
          return current;
        }
        const appended = [...current, { x: sample.x, y: sample.y }];
        return appended.length > TRAIL_MAX_POINTS
          ? appended.slice(-TRAIL_MAX_POINTS)
          : appended;
      });

      if (next >= limit) {
        playingRef.current = false;
        frameRef.current = 0;
        setIsPlaying(false);
        setLanded(true);
        if (modeRef.current === "predict") {
          setPrediction((current) => (current ? recordLanding(current, sample.x) : current));
        }
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    clearFlight();
    if (mode === "predict") {
      setPrediction((current) => (current ? retryPrediction(current) : current));
    }
  };

  const updateParamA = (key: keyof ProjectileParams, value: number) => {
    clearFlight();
    setParamsA((current) => ({ ...current, [key]: value }));
  };

  const switchMode = (next: LabMode) => {
    if (next === mode) {
      return;
    }
    clearFlight();
    if (next === "predict") {
      setPrediction((current) => current ?? createPrediction(paramsA.v0, paramsA.h, paramsA.thetaDeg));
    }
    setMode(next);
  };

  const updatePrediction = (updater: (state: PredictionState) => PredictionState) => {
    setPrediction((current) => (current ? updater(current) : current));
  };

  const handleHeight = (h: number) => {
    clearFlight();
    updatePrediction((state) => setHeight(state, h));
  };

  const handleTheta = (thetaDeg: number) => {
    clearFlight();
    updatePrediction((state) => setTheta(state, thetaDeg));
  };

  const handleV0 = (v0: number) => {
    clearFlight();
    updatePrediction((state) => setV0(state, v0));
  };

  const handlePlaceTarget = (x: number) => {
    updatePrediction((state) => placeTarget(state, x));
  };

  const handleRetry = () => {
    clearFlight();
    updatePrediction(retryPrediction);
  };

  const sample = useMemo(() => sampleAt(activeParams, time), [activeParams, time]);
  const tLand = flightTime(activeParams);
  const chartSeries =
    series.length > 0 && Math.abs(series[series.length - 1].t - sample.t) < 1e-4
      ? series
      : [...series, sample];

  const target: SceneTarget | null =
    mode === "predict" && prediction && prediction.xPredicted !== null
      ? {
          x: prediction.xPredicted,
          state: prediction.outcome ? (prediction.outcome.hit ? "hit" : "miss") : "pending",
          deltaX: prediction.outcome?.deltaX ?? null,
        }
      : null;

  const launchBlocked = mode === "predict" && (!prediction || !canLaunch(prediction));
  const startLabel = mode === "predict" ? "发射" : time > 0 && !landed ? "继续" : "开始";
  const predictOk = Boolean(prediction?.outcome?.hit);
  const predictFail = Boolean(prediction?.outcome && !prediction.outcome.hit);

  let status: string;
  if (mode === "predict" && prediction) {
    if (prediction.outcome) {
      status = `${prediction.outcome.hit ? "正确" : "失败"}，相对误差 ${formatNumber(
        prediction.outcome.relativeError * 100,
      )}%`;
    } else if (isPlaying) {
      status = `抛体在空中，t = ${formatNumber(time)} s`;
    } else if (landed && prediction.lastLandingX !== null) {
      status = `已落地，R = ${formatNumber(prediction.lastLandingX)} m`;
    } else if (prediction.xPredicted !== null) {
      status = `预估 x = ${formatNumber(prediction.xPredicted)} m，按发射`;
    } else {
      status = "设定 v₀、发射角和预估落点后按发射";
    }
  } else if (tLand === 0) {
    status = "初速度水平且高度为 0，抛体立刻落地";
  } else if (landed) {
    status = `已落地，x = ${formatNumber(sample.x)} m，E = ${formatNumber(sample.E)} J`;
  } else if (isPlaying) {
    status = `抛体在空中，t = ${formatNumber(time)} s`;
  } else if (time > 0) {
    status = `已暂停，t = ${formatNumber(time)} s`;
  } else {
    status = `调整参数后按开始。预测射程 R = ${formatNumber(range(activeParams))} m`;
  }

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
            抛体落点实验台
          </p>
          <p className="font-mono text-[10px] text-quiet">Physics Lab / Unit 1 运动学</p>
        </div>
        <ModeSwitch mode={mode} onChange={switchMode} />
        <div className="grid min-w-0 grid-cols-3">
          <Stat label="时间 t" value={formatNumber(time)} unit="s" />
          <Stat label="水平 x" value={formatNumber(sample.x)} unit="m" />
          <Stat label="机械能 E" value={formatNumber(sample.E)} unit="J" />
        </div>
        <p
          role="status"
          className={`min-w-0 truncate text-xs ${
            predictOk ? "text-emerald-700" : predictFail ? "text-red-700" : "text-quiet"
          }`}
          title={status}
        >
          {status}
        </p>
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={startLoop}
            disabled={isPlaying || launchBlocked}
            className="h-8 min-w-16 cursor-pointer bg-navy px-3 text-[13px] font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {startLabel}
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
        <aside className="lab-parameters min-h-0 overflow-y-auto border border-line bg-surface">
          {mode === "params" ? (
            <>
              <div className="border-b border-line px-2.5 py-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-ink">参数设置</h2>
                  <span className="font-mono text-[10px] text-quiet">SI</span>
                </div>
                <p className="mt-0.5 text-[11px] text-quiet">
                  改任一参数即回到 t = 0。发射角、初速度可调。数字输入按 Enter 确认。
                </p>
              </div>

              <div className="space-y-1 px-1.5 py-1.5">
                {PARAMETER_DEFINITIONS.map((item) => (
                  <ParameterControl
                    key={item.key}
                    id={item.key}
                    label={item.label}
                    symbol={item.symbol}
                    unit={item.unit}
                    value={paramsA[item.key] ?? 0.2}
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    onChange={(value) => updateParamA(item.key, value)}
                  />
                ))}
              </div>

              <section className="mx-2 mt-2 border-t border-line pt-2">
                <h2 className="text-[13px] font-medium text-ink">公式与能量</h2>
                <div className="mt-1 space-y-1 font-mono text-[11px] leading-5">
                  <p className="text-quiet">x = v₀cosθ·t　　y = h + v₀sinθ·t − ½gt²</p>
                  <p>t_L = {formatNumber(tLand)} s　　R = {formatNumber(range(activeParams))} m</p>
                  <p>y_max = {formatNumber(apexHeight(activeParams))} m</p>
                  <p className="text-navy">K = {formatNumber(sample.K)} J　　U = {formatNumber(sample.U)} J</p>
                  <p>E = K + U = {formatNumber(sample.E)} J</p>
                </div>
              </section>
            </>
          ) : prediction ? (
            <ProjectilePredictionPanel
              state={prediction}
              onHeightChange={handleHeight}
              onThetaChange={handleTheta}
              onV0Change={handleV0}
              onPlaceTarget={handlePlaceTarget}
              onRetry={handleRetry}
            />
          ) : null}
        </aside>

        <section className="lab-scene min-h-0 border border-line bg-surface">
          <div className="flex h-8 items-center justify-between border-b border-line px-2.5">
            <h2 className="text-xs font-medium text-ink">三维轨迹与速度</h2>
            <p className="font-mono text-[10px] text-quiet">
              {mode === "params" ? "虚线 预测轨迹　实线 v　拖动旋转" : "金色标牌为预估落点　拖动旋转"}
            </p>
          </div>
          <div className="relative min-h-[280px] flex-1">
            <div className="absolute inset-0">
              <SceneCanvas
                params={activeParams}
                sample={sample}
                trail={trail}
                showPrediction={mode === "params"}
                showVelocity
                landingX={landed ? sample.x : null}
                target={target}
                frameParams={activeParams}
                allowRefit={time === 0}
              />
            </div>
          </div>
          <dl className="grid h-12 grid-cols-5 border-t border-line font-mono text-[11px] tabular-nums">
            {[
              ["x", sample.x, "m"],
              ["y", sample.y, "m"],
              ["K", sample.K, "J"],
              ["U", sample.U, "J"],
              ["E", sample.E, "J"],
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

        {mode === "params" ? (
          <aside className="lab-charts min-h-0">
            <TimeSeriesChart
              title="水平位移-时间"
              quantity="x"
              unit="m"
              strokeColor="#1E3A5F"
              valueKey="x"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.x}
              minDuration={Math.max(flightTime(activeParams), 1)}
            />
            <TimeSeriesChart
              title="高度-时间"
              quantity="y"
              unit="m"
              strokeColor="#A16207"
              valueKey="y"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.y}
              minDuration={Math.max(flightTime(activeParams), 1)}
            />
            <TimeSeriesChart
              title="动能"
              quantity="K"
              unit="J"
              strokeColor="#2563EB"
              valueKey="K"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.K}
              minDuration={Math.max(flightTime(activeParams), 1)}
            />
            <TimeSeriesChart
              title="机械能"
              quantity="E"
              unit="J"
              strokeColor="#6D28D9"
              valueKey="E"
              points={chartSeries}
              currentTime={time}
              currentValue={sample.E}
              minDuration={Math.max(flightTime(activeParams), 1)}
            />
          </aside>
        ) : (
          <aside className="lab-board min-h-0">
            {prediction ? <ProjectileMeasurementBoard state={prediction} sample={sample} /> : null}
          </aside>
        )}
      </main>
    </div>
  );
}
