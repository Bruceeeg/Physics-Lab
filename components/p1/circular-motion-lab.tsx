"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { CircularMotionScene } from "@/components/p1/circular-motion-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  canLoop,
  circularTitle,
  conicalEquilibriumSpeed,
  DEFAULT_CIRCULAR,
  equilibriumPeriod,
  loopSpeed,
  modeFromSlug,
  period,
  sampleAt,
  type CircularMode,
  type CircularParams,
} from "@/lib/models/circular-motion";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const CIRCULAR_MODES = [
  { id: "conical" as const, label: "圆锥摆" },
  { id: "horizontal" as const, label: "水平圆周" },
  { id: "vertical" as const, label: "竖直圆周" },
];

function initialParams(mode: CircularMode): CircularParams {
  if (mode === "conical") {
    return { ...DEFAULT_CIRCULAR, v0: conicalEquilibriumSpeed(DEFAULT_CIRCULAR) };
  }
  return { ...DEFAULT_CIRCULAR };
}

export function CircularMotionLab({ slug }: { slug?: string }) {
  const locked = slug === "conical-pendulum" || slug === "horizontal-circular" || slug === "vertical-circular";
  const initialMode = modeFromSlug(slug);
  const [params, setParams] = useState(() => initialParams(initialMode));
  const [mode, setMode] = useState<CircularMode>(initialMode);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    const lift = mode === "conical" ? params.L + 0.08 : mode === "vertical" ? params.r + 0.08 : 0.08;
    return { sample: next, point: [next.x, lift + next.y, next.z] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute);
  const T = period(params, mode);
  const n = formatLabNumber;
  const vEq = conicalEquilibriumSpeed(params);
  const Teq = equilibriumPeriod(params);
  const theta = sample.polar;
  const Tstring = sample.tension;
  const Tsin = Tstring * Math.sin(theta);
  const looping = canLoop(params);
  const vLoop = loopSpeed(params);
  const chartDuration = Math.max(Number.isFinite(T) ? T : 2, 2);
  const chartWindow =
    mode === "vertical"
      ? 6
      : Math.min(15, Math.max(6, Number.isFinite(T) ? T * 3 : 10));

  const set = (key: keyof CircularParams, value: number) => {
    reset();
    setParams((current) => ({ ...current, [key]: value }));
  };

  const title = circularTitle(mode);
  const omega = params.r > 0 ? params.v0 / params.r : 0;
  const FcNeed = params.r > 0 ? (params.m * params.v0 * params.v0) / params.r : 0;
  const periodStep = params.v0 > 0 ? (2 * Math.PI * params.r) / params.v0 : Number.POSITIVE_INFINITY;

  const status = useMemo(() => {
    if (mode === "horizontal") {
      return `向心力 Fc = mv²/r = ${n(sample.Fc)} N。周期 T = 2πr/v = ${n(T)} s。`;
    }
    if (mode === "vertical") {
      if (sample.phase === "projectile") {
        return `绳张力降到 0，小球已在 t = ${n(sample.detachment?.t ?? sample.t)} s 脱轨并进入抛体运动。`;
      }
      return looping
        ? `v₀ ≥ √(5gR) = ${n(vLoop)} m/s，可以过顶。T = mv²/R + mg cosφ。`
        : sample.detachment
          ? `v₀ < √(5gR) = ${n(vLoop)} m/s，将在 T = 0 时脱离圆周。`
          : `速度较低且绳保持拉紧，小球在圆弧上往返摆动。`;
    }
    const balanced = Math.abs(params.v0 - vEq) <= 0.02 * Math.max(vEq, 0.2);
    return balanced
      ? `圆锥摆平衡：v₀ ≈ veq = ${n(vEq)} m/s。T sinθ = mv²/r。`
      : `非平衡圆锥摆：θ(t) = ${n((sample.polar * 180) / Math.PI)}°，θ̇ = ${n(sample.polarVelocity)} rad/s。`;
  }, [mode, looping, n, params.v0, sample.detachment, sample.phase, sample.polar, sample.polarVelocity, sample.t, sample.Fc, T, vEq, vLoop]);

  return (
    <LabFrame
      title={title}
      subtitle="Physics Lab / 力与平动"
      modes={
        locked ? undefined : (
          <ModeSwitch
            value={mode}
            options={CIRCULAR_MODES}
            onChange={(next) => {
              reset();
              setMode(next);
              setParams(initialParams(next));
            }}
          />
        )
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "角速度 ω", value: n(sample.omega), unit: "rad/s" },
        { label: mode === "vertical" ? "速率 v" : "周期 T", value: mode === "vertical" ? n(sample.speed) : n(T), unit: mode === "vertical" ? "m/s" : "s" },
      ]}
      status={status}
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        mode === "conical" ? (
          <>
            <ParameterControl id="L" label="摆长" symbol="L" unit="m" value={params.L} min={0.4} max={2} step={0.01} onChange={(value) => set("L", value)} />
            <ParameterControl id="thetaDeg" label="张角" symbol="θ" unit="°" value={params.thetaDeg} min={8} max={55} step={1} onChange={(value) => set("thetaDeg", value)} />
            <ParameterControl id="v0" label="水平切向速度" symbol="v₀" unit="m/s" value={params.v0} min={0.2} max={8} step={0.05} onChange={(value) => set("v0", value)} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => set("m", value)} />
            <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => set("g", value)} />
          </>
        ) : (
          <>
            <ParameterControl id="r" label="半径" symbol="R" unit="m" value={params.r} min={0.2} max={1.2} step={0.02} onChange={(value) => set("r", value)} />
            <ParameterControl id="v0" label={mode === "vertical" ? "底端速率" : "速率"} symbol="v₀" unit="m/s" value={params.v0} min={0.4} max={8} step={0.05} onChange={(value) => set("v0", value)} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => set("m", value)} />
            <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => set("g", value)} />
          </>
        )
      }
      formula={
        mode === "horizontal" ? (
          <>
            <p className="text-quiet">水平面：N = mg，竖直平衡。绳拉力提供向心力。</p>
            <p>1. Fc = mv²/r = ({n(params.m)})({n(params.v0)})² / {n(params.r)}</p>
            <p className="text-navy">Fc = {n(FcNeed)} N</p>
            <p>2. T绳 = Fc = {n(sample.tension)} N</p>
            <p>3. ω = v/r = {n(omega)} rad/s</p>
            <p>4. 周期 T = 2πr/v = 2π/ω = {n(periodStep)} s</p>
          </>
        ) : mode === "vertical" ? (
          <>
            <p className="text-quiet">绳拉紧时半径为 R。T 降到 0 后绳松弛，小球转为抛体。</p>
            <p>φ̈ = −(g/R) sinφ</p>
            <p>过顶需 v₀ ≥ √(5gR) = {n(vLoop)} m/s</p>
            <p>
              {sample.phase === "projectile"
                ? `t脱 = ${n(sample.detachment?.t ?? 0)} s，之后 ax = 0、ay = −g。`
                : looping
                  ? "当前可以过顶。"
                  : sample.detachment
                    ? "当前将在张力归零时脱轨。"
                    : "当前绳保持拉紧并往返摆动。"}
            </p>
            <p className="text-navy">T = mv²/R + mg cosφ = {n(sample.tension)} N</p>
            <p>Fc = mv²/R = {n(sample.Fc)} N　v = {n(sample.speed)} m/s</p>
          </>
        ) : (
          <>
            <p className="text-quiet">θ 与 φ 按球摆方程随时间变化；设定张角与速度是初始条件。</p>
            <p>θ̈ = sinθ cosθ φ̇² − (g/L)sinθ</p>
            <p>φ̈ = −2cotθ θ̇φ̇</p>
            <p>θ(t) = {n((sample.polar * 180) / Math.PI)}°　θ̇ = {n(sample.polarVelocity)} rad/s</p>
            <p>r = L sinθ = {n(sample.r)} m</p>
            <p>平衡切向速度 veq = √(g L sin²θ / cosθ) = {n(vEq)} m/s</p>
            <p>当前 v₀ = {n(params.v0)} m/s</p>
            <p>T = mL(θ̇² + sin²θ φ̇²) + mg cosθ = {n(Tstring)} N</p>
            <p>T sinθ = {n(Tsin)} N</p>
            <p className="text-navy">方位向心项 mrφ̇² = {n(sample.Fc)} N</p>
            <p>平衡周期 Teq = 2π√(L cosθ / g) = {n(Teq)} s</p>
          </>
        )
      }
      sceneTitle={`三维${title}`}
      sceneCaption={
        mode === "horizontal"
          ? "实线 T / mg / N　T 在水平面指向圆心　拖动旋转"
          : mode === "vertical"
            ? "绳拉紧时显示 T；脱轨后按抛体运动　拖动旋转"
            : "动态 θ(t)　实线 T / mg　虚线方位向心项"
      }
      scene={
        <SceneCanvas camera={[2.4, 1.7, 3.6]}>
          <CircularMotionScene params={params} sample={sample} trail={trail} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: mode === "vertical" ? "φ" : mode === "conical" ? "θ" : "r", value: n(mode === "vertical" ? sample.phi : mode === "conical" ? (sample.polar * 180) / Math.PI : sample.r), unit: mode === "vertical" ? "rad" : mode === "conical" ? "°" : "m" },
        { label: "v", value: n(sample.speed), unit: "m/s" },
        { label: "T绳", value: n(sample.tension), unit: "N" },
        { label: "Fc", value: n(sample.Fc), unit: "N" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="水平位移 x" quantity="x" unit="m" strokeColor="#1E3A5F" valueKey="x" points={series} currentTime={time} currentValue={sample.x} minDuration={chartDuration} windowDuration={chartWindow} />
          <TimeSeriesChart title="竖直位移 y" quantity="y" unit="m" strokeColor="#A16207" valueKey="y" points={series} currentTime={time} currentValue={sample.y} minDuration={chartDuration} windowDuration={chartWindow} />
          <TimeSeriesChart title={mode === "horizontal" ? "向心力" : "角速度"} quantity={mode === "horizontal" ? "Fc" : "ω"} unit={mode === "horizontal" ? "N" : "rad/s"} strokeColor="#2563EB" valueKey={mode === "horizontal" ? "Fc" : "omega"} points={series} currentTime={time} currentValue={mode === "horizontal" ? sample.Fc : sample.omega} minDuration={chartDuration} windowDuration={chartWindow} />
          <TimeSeriesChart title={mode === "vertical" ? "绳张力" : "速率"} quantity={mode === "vertical" ? "T" : "v"} unit={mode === "vertical" ? "N" : "m/s"} strokeColor="#6D28D9" valueKey={mode === "vertical" ? "tension" : "speed"} points={series} currentTime={time} currentValue={mode === "vertical" ? sample.tension : sample.speed} minDuration={chartDuration} windowDuration={chartWindow} />
        </>
      }
    />
  );
}
