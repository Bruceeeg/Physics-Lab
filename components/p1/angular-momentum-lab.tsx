"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { AngularMomentumScene } from "@/components/p1/angular-momentum-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_ANGMOM,
  IAfter,
  IDisk,
  fallTime,
  omegaAfter,
  sampleAt,
  skaterI2,
  type AngMomMode,
  type AngMomParams,
} from "@/lib/models/angular-momentum";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: keyof AngMomParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "M", label: "转盘质量", symbol: "M", unit: "kg", min: 0.5, max: 5, step: 0.1 },
  { key: "R", label: "转盘半径", symbol: "R", unit: "m", min: 0.15, max: 0.5, step: 0.01 },
  { key: "omega0", label: "初角速度", symbol: "ω₀", unit: "rad/s", min: 1, max: 12, step: 0.1 },
  { key: "m", label: "落物质量", symbol: "m", unit: "kg", min: 0.1, max: 2, step: 0.05 },
  { key: "r", label: "下落半径", symbol: "r", unit: "m", min: 0.05, max: 0.45, step: 0.01 },
  { key: "h", label: "下落高度", symbol: "h", unit: "m", min: 0.15, max: 0.8, step: 0.02 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

export function AngularMomentumLab() {
  const [params, setParams] = useState(DEFAULT_ANGMOM);
  const [mode, setMode] = useState<AngMomMode>("drop");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [params.r, next.y + 0.05, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const tf = fallTime(params);
  const invalid = mode === "drop" && params.r > params.R;
  const skater = mode === "skater";

  return (
    <LabFrame
      title="角动量守恒"
      subtitle="Physics Lab / 转动系统"
      modes={
        <ModeSwitch
          value={mode}
          options={[
            { id: "drop" as const, label: "落物粘盘" },
            { id: "skater" as const, label: "收臂加速" },
          ]}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "角速度 ω", value: n(sample.omega), unit: "rad/s" },
        { label: "角动量 L", value: n(sample.L), unit: "kg·m²/s" },
      ]}
      status={
        invalid
          ? "落点半径 r 不能大于转盘半径 R。"
          : skater
            ? sample.stuck
              ? `已收臂。I 变小，ω 增大，L = Iω 保持 ${n(sample.L)} kg·m²/s。`
              : "转盘先以 I₁ 转动，随后收臂把 I 降到 I₁×比例。"
            : sample.stuck
              ? `已粘上。ω = I₁ω₀/I₂ = ${n(omegaAfter(params))} rad/s，L 保持 ${n(sample.L)} kg·m²/s。`
              : `落物在 t = ${n(tf)} s 落到半径 r 处并粘住。`
      }
      statusError={invalid}
      isPlaying={isPlaying}
      time={time}
      startDisabled={invalid}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={(skater
        ? PARAMETER_DEFINITIONS.filter((item) => item.key === "M" || item.key === "R" || item.key === "omega0").concat([
            { key: "IScale", label: "收臂后 I 比例", symbol: "I₂/I₁", unit: "", min: 0.25, max: 0.95, step: 0.05 },
          ])
        : PARAMETER_DEFINITIONS
      ).map((item) => (
        <ParameterControl
          key={item.key}
          id={item.key}
          label={item.label}
          symbol={item.symbol}
          unit={item.unit}
          value={item.key === "IScale" ? (params.IScale ?? 0.45) : params[item.key as keyof AngMomParams] as number}
          min={item.min}
          max={item.max}
          step={item.step}
          invalid={item.key === "r" && invalid}
          onChange={(value) => {
            reset();
            setParams((current) => ({ ...current, [item.key]: value }));
          }}
        />
      ))}
      formula={
        skater ? (
          <>
            <p className="text-quiet">I₁ω₁ = I₂ω₂</p>
            <p>I₁ = ½MR² = {n(IDisk(params))} kg·m²</p>
            <p>I₂ = {n(skaterI2(params))} kg·m²</p>
            <p className="text-navy">L = {n(sample.L)} kg·m²/s</p>
          </>
        ) : (
          <>
            <p className="text-quiet">I₁ω₁ = I₂ω₂</p>
            <p>I₁ = ½MR² = {n(IDisk(params))} kg·m²</p>
            <p>I₂ = I₁ + mr² = {n(IAfter(params))} kg·m²</p>
            <p className="text-navy">ω₂ = {n(omegaAfter(params))} rad/s</p>
          </>
        )
      }
      sceneTitle={skater ? "三维收臂转盘" : "三维落物转盘"}
      sceneCaption={skater ? "收臂后加速　拖动旋转" : "落物粘住后减速　拖动旋转"}
      scene={
        <SceneCanvas camera={[1.2, 1.1, 2.2]}>
          <AngularMomentumScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "ω", value: n(sample.omega), unit: "rad/s" },
        { label: "I", value: n(sample.I), unit: "kg·m²" },
        { label: "L", value: n(sample.L), unit: "kg·m²/s" },
        { label: "y", value: n(sample.y), unit: "m" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#1E3A5F" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} />
          <TimeSeriesChart title="转动惯量" quantity="I" unit="kg·m²" strokeColor="#A16207" valueKey="I" points={series} currentTime={time} currentValue={sample.I} />
          <TimeSeriesChart title="角动量" quantity="L" unit="kg·m²/s" strokeColor="#2563EB" valueKey="L" points={series} currentTime={time} currentValue={sample.L} />
          <TimeSeriesChart title="落物高度" quantity="y" unit="m" strokeColor="#6D28D9" valueKey="y" points={series} currentTime={time} currentValue={sample.y} />
        </>
      }
    />
  );
}
