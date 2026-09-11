"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ImpulseMomentumScene } from "@/components/p1/impulse-momentum-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  ballisticMaxAngle,
  ballisticVelocityAfter,
  contactTime,
  DEFAULT_IMPULSE,
  explosionVelocities,
  hitTime,
  impulseOn2,
  sampleAt,
  type ImpulseMode,
  type ImpulseParams,
} from "@/lib/models/impulse-momentum";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: keyof ImpulseParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "m1", label: "小车 1 质量", symbol: "m₁", unit: "kg", min: 0.2, max: 3, step: 0.05 },
  { key: "v1", label: "小车 1 初速度", symbol: "v₁", unit: "m/s", min: -3, max: 4, step: 0.05 },
  { key: "m2", label: "小车 2 质量", symbol: "m₂", unit: "kg", min: 0.2, max: 3, step: 0.05 },
  { key: "v2", label: "小车 2 初速度", symbol: "v₂", unit: "m/s", min: -3, max: 4, step: 0.05 },
  { key: "e", label: "恢复系数", symbol: "e", unit: "", min: 0, max: 1, step: 0.05 },
];

const BALLISTIC_DEFAULTS: ImpulseParams = {
  m1: 0.02,
  v1: 80,
  m2: 0.8,
  v2: 0,
  e: 0,
  U: 0.8,
  L: 0.8,
  g: 9.81,
};

export function ImpulseMomentumLab({ slug }: { slug?: string } = {}) {
  const [params, setParams] = useState(slug === "ballistic-pendulum" ? BALLISTIC_DEFAULTS : DEFAULT_IMPULSE);
  const [mode, setMode] = useState<ImpulseMode>(slug === "ballistic-pendulum" ? "ballistic" : "collision");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [next.x1, 0.1, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute);
  const explosion = mode === "explosion";
  const ballistic = mode === "ballistic";
  const tc = explosion ? 0 : ballistic ? hitTime(params) : contactTime(params);
  const J = explosion
    ? params.m2 * explosionVelocities(params).v2f
    : ballistic
      ? params.m1 * params.v1
      : impulseOn2(params);
  const n = formatLabNumber;
  const closing = explosion || ballistic || Number.isFinite(tc);

  return (
    <LabFrame
      title={ballistic ? "弹道摆" : "冲量与动量"}
      subtitle={ballistic ? "Physics Lab / mv = (M+m)V" : "Physics Lab / 线动量"}
      modes={
        <ModeSwitch
          value={mode}
          options={[
            { id: "collision" as const, label: "对心碰撞" },
            { id: "explosion" as const, label: "爆炸分离" },
            { id: "ballistic" as const, label: "弹道摆" },
          ]}
          onChange={(next) => {
            reset();
            setMode(next);
            if (next === "ballistic") {
              setParams(BALLISTIC_DEFAULTS);
            } else if (mode === "ballistic") {
              setParams(DEFAULT_IMPULSE);
            }
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "总动量 p", value: n(sample.pTotal), unit: "kg·m/s" },
        { label: "接触力 F", value: n(sample.F), unit: "N" },
      ]}
      status={
        explosion
          ? `静止两车被弹簧推开。总动量保持 0，½m₁v₁² + ½m₂v₂² = U。`
          : ballistic
            ? `碰撞后 V = ${n(ballisticVelocityAfter(params))} m/s，最大摆角 ${n((ballisticMaxAngle(params) * 180) / Math.PI)}°。`
          : closing
            ? `t = ${n(tc)} s 接触。J = Δp₂ = ${n(J)} N·s，总动量保持 ${n(sample.pTotal)} kg·m/s。`
            : "两车没有相互靠近，不会碰撞。增大 v₁ 或减小 v₂。"
      }
      statusError={!closing}
      isPlaying={isPlaying}
      time={time}
      startDisabled={!closing}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={(explosion
        ? [
            PARAMETER_DEFINITIONS[0],
            PARAMETER_DEFINITIONS[2],
            { key: "U" as const, label: "储存能量", symbol: "U", unit: "J", min: 0.1, max: 3, step: 0.05 },
          ]
        : ballistic
          ? [
              { key: "m1" as const, label: "弹丸质量", symbol: "m", unit: "kg", min: 0.01, max: 0.08, step: 0.005 },
              { key: "v1" as const, label: "弹丸速度", symbol: "v", unit: "m/s", min: 20, max: 120, step: 1 },
              { key: "m2" as const, label: "摆块质量", symbol: "M", unit: "kg", min: 0.2, max: 2, step: 0.05 },
              { key: "L" as const, label: "摆长", symbol: "L", unit: "m", min: 0.4, max: 1.2, step: 0.02 },
              { key: "g" as const, label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
            ]
        : PARAMETER_DEFINITIONS
      ).map((item) => (
        <ParameterControl
          key={item.key}
          id={item.key}
          label={item.label}
          symbol={item.symbol}
          unit={item.unit}
          value={
            item.key === "U"
              ? (params.U ?? 0.8)
              : item.key === "L"
                ? (params.L ?? 0.8)
                : item.key === "g"
                  ? (params.g ?? 9.81)
                  : params[item.key]
          }
          min={item.min}
          max={item.max}
          step={item.step}
          onChange={(value) => {
            reset();
            setParams((current) => ({ ...current, [item.key]: value }));
          }}
        />
      ))}
      formula={
        explosion ? (
          <>
            <p className="text-quiet">p₁ + p₂ = 0，½m₁v₁² + ½m₂v₂² = U</p>
            <p>U = {n(params.U ?? 0.8)} J</p>
            <p className="text-navy">J₂ = {n(J)} N·s</p>
            <p>Σp = {n(sample.pTotal)} kg·m/s</p>
            <p>y = 0.00 m　vy = 0.00 m/s　ay = 0.00 m/s²</p>
          </>
        ) : ballistic ? (
          <>
            <p className="text-quiet">mv = (M+m)V，½(M+m)V² = (M+m)gh</p>
            <p>V = {n(ballisticVelocityAfter(params))} m/s</p>
            <p>θ_max = {n((ballisticMaxAngle(params) * 180) / Math.PI)} °</p>
            <p className="text-navy">h = {n(sample.y)} m</p>
          </>
        ) : (
          <>
            <p className="text-quiet">J = ∫F dt = Δp</p>
            <p>p₁ + p₂ = {n(sample.pTotal)} kg·m/s</p>
            <p className="text-navy">J₂ = {n(J)} N·s</p>
            <p>e = {n(params.e)}</p>
            <p>y = 0.00 m　vy = 0.00 m/s　ay = 0.00 m/s²</p>
          </>
        )
      }
      sceneTitle={ballistic ? "三维弹道摆" : "三维轨道碰撞"}
      sceneCaption={ballistic ? "非弹性碰撞后上摆　拖动旋转" : "对心碰撞沿水平轨道　y = 0.00 m　vy = 0.00 m/s"}
      scene={
        <SceneCanvas camera={ballistic ? [0.4, 1.2, 2.6] : [0.2, 1.4, 3.2]}>
          <ImpulseMomentumScene sample={sample} trail={trail} mode={mode} params={params} />
        </SceneCanvas>
      }
      readouts={[
        { label: "p₁", value: n(sample.p1), unit: "kg·m/s" },
        { label: "p₂", value: n(sample.p2), unit: "kg·m/s" },
        { label: "F", value: n(sample.F), unit: "N" },
        { label: "Σp", value: n(sample.pTotal), unit: "kg·m/s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title={ballistic ? "弹丸动量" : "小车 1 动量"} quantity={ballistic ? "p_m" : "p₁"} unit="kg·m/s" strokeColor="#1E3A5F" valueKey="p1" points={series} currentTime={time} currentValue={sample.p1} />
          <TimeSeriesChart title={ballistic ? "摆块动量" : "小车 2 动量"} quantity={ballistic ? "p_M" : "p₂"} unit="kg·m/s" strokeColor="#A16207" valueKey="p2" points={series} currentTime={time} currentValue={sample.p2} />
          <TimeSeriesChart title="接触力" quantity="F" unit="N" strokeColor="#2563EB" valueKey="F" points={series} currentTime={time} currentValue={sample.F} />
          <TimeSeriesChart title="总动量" quantity="Σp" unit="kg·m/s" strokeColor="#6D28D9" valueKey="pTotal" points={series} currentTime={time} currentValue={sample.pTotal} />
        </>
      }
    />
  );
}
