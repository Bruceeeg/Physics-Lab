"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { NonuniformRodScene } from "@/components/p1/nonuniform-rod-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_NONUNIFORM_ROD,
  endInertia,
  period,
  sampleAt,
  type NonuniformRodParams,
  type RodDensityMode,
} from "@/lib/models/nonuniform-rod";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

export function NonuniformRodLab() {
  const [params, setParams] = useState(DEFAULT_NONUNIFORM_ROD);
  const [mode, setMode] = useState<RodDensityMode>("linear");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return {
      sample: next,
      point: [
        next.xcm * Math.sin(next.theta),
        1.15 - next.xcm * Math.cos(next.theta),
        0,
      ] as [number, number, number],
    };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const T = period(params, mode);
  const I = endInertia(params, mode);
  const apply = (patch: Partial<NonuniformRodParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="非均匀杆与转动惯量"
      subtitle="Physics Lab / I = ∫ x² λ dx"
      modes={
        <ModeSwitch
          value={mode}
          options={[
            { id: "linear" as const, label: "λ ∝ x" },
            { id: "quadratic" as const, label: "λ ∝ x²" },
            { id: "turbine" as const, label: "三叶片" },
          ]}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "I", value: n(I), unit: "kg·m²" },
        { label: "xcm", value: n(sample.xcm), unit: "m" },
      ]}
      status={
        mode === "linear"
          ? `λ = 2M x / L²。I_端 = ML²/2 = ${n(I)} kg·m²，质心在 2L/3。`
          : mode === "quadratic"
            ? `λ = 3M x² / L³。I_端 = 3ML²/5 = ${n(I)} kg·m²，质心在 3L/4。`
            : `每片 I_cm = ML²/18，平行轴 I = N(I_cm + M d²) = ${n(I)} kg·m²。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="M" label={mode === "turbine" ? "单片质量" : "杆质量"} symbol="M" unit="kg" value={params.M} min={0.3} max={3} step={0.05} onChange={(value) => apply({ M: value })} />
          <ParameterControl id="L" label={mode === "turbine" ? "叶片长度" : "杆长"} symbol="L" unit="m" value={params.L} min={0.4} max={1.2} step={0.02} onChange={(value) => apply({ L: value })} />
          {mode === "turbine" ? (
            <ParameterControl id="n" label="叶片数" symbol="N" unit="" value={params.bladeCount} min={2} max={6} step={1} onChange={(value) => apply({ bladeCount: value })} />
          ) : (
            <ParameterControl id="theta0" label="振幅" symbol="θ₀" unit="°" value={params.theta0Deg} min={4} max={25} step={0.5} onChange={(value) => apply({ theta0Deg: value })} />
          )}
          <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => apply({ g: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">I = ∫ x² λ(x) dx　x_cm = (1/M) ∫ x λ dx</p>
          <p>I = {n(I)} kg·m²　x_cm = {n(sample.xcm)} m</p>
          <p className="text-navy">T = 2π√(I/Mgd) = {n(T)} s</p>
          <p>E = {n(sample.E)} J</p>
        </>
      }
      sceneTitle="三维非均匀杆"
      sceneCaption="金色块在质心　拖动旋转"
      scene={
        <SceneCanvas camera={[1.5, 1.2, 2.6]}>
          <NonuniformRodScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "θ", value: n((sample.theta * 180) / Math.PI), unit: "°" },
        { label: "I", value: n(sample.I), unit: "kg·m²" },
        { label: "xcm", value: n(sample.xcm), unit: "m" },
        { label: "T", value: n(sample.T), unit: "s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="角位移" quantity="θ" unit="rad" strokeColor="#1E3A5F" valueKey="theta" points={series} currentTime={time} currentValue={sample.theta} minDuration={Math.max(T, 2)} />
          <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#A16207" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} minDuration={Math.max(T, 2)} />
          <TimeSeriesChart title="动能" quantity="K" unit="J" strokeColor="#2563EB" valueKey="K" points={series} currentTime={time} currentValue={sample.K} minDuration={Math.max(T, 2)} />
          <TimeSeriesChart title="重力势能" quantity="Ug" unit="J" strokeColor="#6D28D9" valueKey="Ug" points={series} currentTime={time} currentValue={sample.Ug} minDuration={Math.max(T, 2)} />
        </>
      }
    />
  );
}
