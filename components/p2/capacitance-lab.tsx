"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { CapacitanceScene } from "@/components/p2/capacitance-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  CAP_DURATION,
  DEFAULT_CAP,
  sampleAt,
  type CapMode,
  type CapParams,
} from "@/lib/models/capacitance";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "gap" as const, label: "改变间距" },
  { id: "dielectric" as const, label: "插入电介质" },
];

export function CapacitanceLab(_props: { slug?: string } = {}) {
  const [params, setParams] = useState(DEFAULT_CAP);
  const [mode, setMode] = useState<CapMode>("gap");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0, 0.16, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => CAP_DURATION, []);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const gap = mode === "gap";
  const set = (patch: Partial<CapParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="电容与电介质"
      subtitle="Physics Lab / Unit 10 导体与电容"
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
        { label: "电容 C", value: formatLabSci(sample.C), unit: "F" },
        { label: "电能 U", value: formatLabSci(sample.U), unit: "J" },
      ]}
      status={
        gap
          ? `C = ε₀A/d。间距减小，C 增大到 ${formatLabSci(sample.C)} F。`
          : `插入 κ = ${n(sample.kappa)} 的电介质，C 变为真空值的 κ 倍。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="A" label="极板面积" symbol="A" unit="cm²" value={params.A_cm2} min={50} max={400} step={10} onChange={(value) => set({ A_cm2: value })} />
          <ParameterControl id="d0" label="初间距" symbol="d₀" unit="mm" value={params.d0_mm} min={2} max={12} step={0.5} onChange={(value) => set({ d0_mm: value })} />
          {gap ? (
            <ParameterControl key="d1" id="d1" label="末间距" symbol="d₁" unit="mm" value={params.d1_mm} min={1} max={10} step={0.5} onChange={(value) => set({ d1_mm: value })} />
          ) : (
            <ParameterControl key="k" id="k" label="相对介电常数" symbol="κ" unit="" value={params.kappa} min={1.2} max={8} step={0.1} onChange={(value) => set({ kappa: value })} />
          )}
          <ParameterControl id="V" label="电压" symbol="V" unit="V" value={params.V} min={4} max={24} step={1} onChange={(value) => set({ V: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">C = κ ε₀ A / d</p>
          <p>C = {formatLabSci(sample.C)} F</p>
          <p>Q = CV = {formatLabSci(sample.Q)} C</p>
          <p className="text-navy">U = ½CV² = {formatLabSci(sample.U)} J</p>
        </>
      }
      sceneTitle="三维平行板"
      sceneCaption="电容随几何与电介质变化　拖动旋转"
      scene={
        <SceneCanvas camera={[0.35, 0.28, 0.7]} fov={42}>
          <CapacitanceScene sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "C", value: formatLabSci(sample.C), unit: "F" },
        { label: "Q", value: formatLabSci(sample.Q), unit: "C" },
        { label: "E", value: formatLabSci(sample.E), unit: "V/m" },
        { label: "κ", value: n(sample.kappa), unit: "" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="电容" quantity="C" unit="F" strokeColor="#1E3A5F" valueKey="C" points={series} currentTime={time} currentValue={sample.C} minDuration={CAP_DURATION} />
          <TimeSeriesChart title="电荷" quantity="Q" unit="C" strokeColor="#A16207" valueKey="Q" points={series} currentTime={time} currentValue={sample.Q} minDuration={CAP_DURATION} />
          <TimeSeriesChart title="电能" quantity="U" unit="J" strokeColor="#2563EB" valueKey="U" points={series} currentTime={time} currentValue={sample.U} minDuration={CAP_DURATION} />
          <TimeSeriesChart title="电场" quantity="E" unit="V/m" strokeColor="#6D28D9" valueKey="E" points={series} currentTime={time} currentValue={sample.E} minDuration={CAP_DURATION} />
        </>
      }
    />
  );
}
