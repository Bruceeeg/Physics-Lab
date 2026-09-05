"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ImpulseMomentumScene } from "@/components/p1/impulse-momentum-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  contactTime,
  DEFAULT_IMPULSE,
  explosionVelocities,
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

export function ImpulseMomentumLab() {
  const [params, setParams] = useState(DEFAULT_IMPULSE);
  const [mode, setMode] = useState<ImpulseMode>("collision");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [next.x1, 0.1, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute);
  const explosion = mode === "explosion";
  const tc = explosion ? 0 : contactTime(params);
  const J = explosion ? params.m2 * explosionVelocities(params).v2f : impulseOn2(params);
  const n = formatLabNumber;
  const closing = explosion || Number.isFinite(tc);

  return (
    <LabFrame
      title="冲量与动量"
      subtitle="Physics Lab / 线动量"
      modes={
        <ModeSwitch
          value={mode}
          options={[
            { id: "collision" as const, label: "对心碰撞" },
            { id: "explosion" as const, label: "爆炸分离" },
          ]}
          onChange={(next) => {
            reset();
            setMode(next);
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
        : PARAMETER_DEFINITIONS
      ).map((item) => (
        <ParameterControl
          key={item.key}
          id={item.key}
          label={item.label}
          symbol={item.symbol}
          unit={item.unit}
          value={item.key === "U" ? (params.U ?? 0.8) : params[item.key]}
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
          </>
        ) : (
          <>
            <p className="text-quiet">J = ∫F dt = Δp</p>
            <p>p₁ + p₂ = {n(sample.pTotal)} kg·m/s</p>
            <p className="text-navy">J₂ = {n(J)} N·s</p>
            <p>e = {n(params.e)}</p>
          </>
        )
      }
      sceneTitle="三维轨道碰撞"
      sceneCaption="蓝车 m₁　金车 m₂　拖动旋转"
      scene={
        <SceneCanvas camera={[0.2, 1.4, 3.2]}>
          <ImpulseMomentumScene sample={sample} trail={trail} />
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
          <TimeSeriesChart title="小车 1 动量" quantity="p₁" unit="kg·m/s" strokeColor="#1E3A5F" valueKey="p1" points={series} currentTime={time} currentValue={sample.p1} />
          <TimeSeriesChart title="小车 2 动量" quantity="p₂" unit="kg·m/s" strokeColor="#A16207" valueKey="p2" points={series} currentTime={time} currentValue={sample.p2} />
          <TimeSeriesChart title="接触力" quantity="F" unit="N" strokeColor="#2563EB" valueKey="F" points={series} currentTime={time} currentValue={sample.F} />
          <TimeSeriesChart title="总动量" quantity="Σp" unit="kg·m/s" strokeColor="#6D28D9" valueKey="pTotal" points={series} currentTime={time} currentValue={sample.pTotal} />
        </>
      }
    />
  );
}
