"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ThermalConductivityScene } from "@/components/p2/thermal-conductivity-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_THERMAL,
  THERMAL_DURATION,
  heatCurrent,
  sampleAt,
  type ThermalMode,
  type ThermalParams,
} from "@/lib/models/thermal-conductivity";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "single" as const, label: "单棒" },
  { id: "compare" as const, label: "对照材料" },
];

export function ThermalConductivityLab() {
  const [params, setParams] = useState(DEFAULT_THERMAL);
  const [mode, setMode] = useState<ThermalMode>("single");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0, 0.12, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => THERMAL_DURATION, []);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const compare = mode === "compare";
  const set = (patch: Partial<ThermalParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="热导率"
      subtitle="Physics Lab / Unit 9 热力学"
      modes={
        <ModeSwitch
          value={mode}
          options={MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "热流 H", value: n(sample.H), unit: "W" },
        { label: compare ? "热流 H₂" : "温差 ΔT", value: n(compare ? sample.H2 : sample.dT), unit: compare ? "W" : "K" },
      ]}
      status={
        compare
          ? `同一 ΔT 与截面积下，H 与 k 成正比。H/H₂ = ${n(sample.H2 === 0 ? 0 : sample.H / sample.H2)}。`
          : `稳态 H = kA ΔT / L = ${n(heatCurrent(params))} W。棒中点温度 ${n(sample.Tmid)} K。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="k" label="热导率" symbol="k" unit="W/(m·K)" value={params.k} min={10} max={420} step={5} onChange={(value) => set({ k: value })} />
          {compare ? (
            <ParameterControl id="k2" label="对照热导率" symbol="k₂" unit="W/(m·K)" value={params.k2} min={5} max={420} step={5} onChange={(value) => set({ k2: value })} />
          ) : null}
          <ParameterControl id="A" label="截面积" symbol="A" unit="cm²" value={params.A_cm2} min={1} max={12} step={0.5} onChange={(value) => set({ A_cm2: value })} />
          <ParameterControl id="L" label="棒长" symbol="L" unit="cm" value={params.L_cm} min={8} max={40} step={1} onChange={(value) => set({ L_cm: value })} />
          <ParameterControl id="Th" label="热端" symbol="Th" unit="K" value={params.Th} min={300} max={500} step={1} onChange={(value) => set({ Th: value })} />
          <ParameterControl id="Tc" label="冷端" symbol="Tc" unit="K" value={params.Tc} min={250} max={350} step={1} onChange={(value) => set({ Tc: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">H = k A ΔT / L</p>
          <p>ΔT = {n(sample.dT)} K</p>
          <p className="text-navy">H = {n(sample.H)} W</p>
          {compare ? <p>H₂ = {n(sample.H2)} W</p> : <p>T中 = {n(sample.Tmid)} K</p>}
        </>
      }
      sceneTitle={compare ? "三维对照棒" : "三维导热棒"}
      sceneCaption="热端 / 冷端　拖动旋转"
      scene={
        <SceneCanvas camera={[0.75, 0.42, 1.15]} fov={42}>
          <ThermalConductivityScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        compare
          ? [
              { label: "H", value: n(sample.H), unit: "W" },
              { label: "H2", value: n(sample.H2), unit: "W" },
              { label: "k", value: n(params.k), unit: "W/(m·K)" },
              { label: "k2", value: n(params.k2), unit: "W/(m·K)" },
            ]
          : [
              { label: "H", value: n(sample.H), unit: "W" },
              { label: "ΔT", value: n(sample.dT), unit: "K" },
              { label: "T中", value: n(sample.Tmid), unit: "K" },
              { label: "k", value: n(params.k), unit: "W/(m·K)" },
            ]
      }
      charts={
        compare ? (
          <>
            <TimeSeriesChart title="热流 1" quantity="H" unit="W" strokeColor="#1E3A5F" valueKey="H" points={series} currentTime={time} currentValue={sample.H} minDuration={THERMAL_DURATION} />
            <TimeSeriesChart title="热流 2" quantity="H2" unit="W" strokeColor="#A16207" valueKey="H2" points={series} currentTime={time} currentValue={sample.H2} minDuration={THERMAL_DURATION} />
            <TimeSeriesChart title="接近稳态" quantity="frac" unit="" strokeColor="#2563EB" valueKey="frac" points={series} currentTime={time} currentValue={sample.frac} minDuration={THERMAL_DURATION} />
            <TimeSeriesChart title="中点温度" quantity="Tmid" unit="K" strokeColor="#6D28D9" valueKey="Tmid" points={series} currentTime={time} currentValue={sample.Tmid} minDuration={THERMAL_DURATION} />
          </>
        ) : (
          <>
            <TimeSeriesChart title="热流" quantity="H" unit="W" strokeColor="#1E3A5F" valueKey="H" points={series} currentTime={time} currentValue={sample.H} minDuration={THERMAL_DURATION} />
            <TimeSeriesChart title="中点温度" quantity="Tmid" unit="K" strokeColor="#A16207" valueKey="Tmid" points={series} currentTime={time} currentValue={sample.Tmid} minDuration={THERMAL_DURATION} />
            <TimeSeriesChart title="温差" quantity="ΔT" unit="K" strokeColor="#2563EB" valueKey="dT" points={series} currentTime={time} currentValue={sample.dT} minDuration={THERMAL_DURATION} />
            <TimeSeriesChart title="接近稳态" quantity="frac" unit="" strokeColor="#6D28D9" valueKey="frac" points={series} currentTime={time} currentValue={sample.frac} minDuration={THERMAL_DURATION} />
          </>
        )
      }
    />
  );
}
