"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { MagnetismScene } from "@/components/p2/magnetism-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  B_EARTH,
  DEFAULT_MAGNETISM,
  MAGNETISM_DURATION,
  sampleAt,
  type MagnetismMode,
  type MagnetismParams,
} from "@/lib/models/magnetism";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "wire" as const, label: "载流导线" },
  { id: "magnet" as const, label: "条形磁铁" },
  { id: "solenoid" as const, label: "螺线管" },
];

export function MagnetismLab({ slug }: { slug?: string } = {}) {
  const [params, setParams] = useState(DEFAULT_MAGNETISM);
  const [mode, setMode] = useState<MagnetismMode>(slug === "solenoid" ? "solenoid" : "wire");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [next.r, 0.18, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => MAGNETISM_DURATION, []);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const magnet = mode === "magnet";
  const solenoid = mode === "solenoid";
  const set = (patch: Partial<MagnetismParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title={solenoid ? "螺线管测定 μ₀" : "磁场"}
      subtitle={solenoid ? "Physics Lab / B = μ₀ n I" : "Physics Lab / Unit 12 磁与电磁"}
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
        {
          label: solenoid ? "nI" : "距离 r",
          value: n(solenoid ? sample.nI : sample.r),
          unit: solenoid ? "A/m" : "m",
        },
        { label: "磁场 B", value: n(sample.BuT), unit: "μT" },
      ]}
      status={
        solenoid
          ? `管内近似均匀。B = μ₀ n I = ${n(sample.BuT)} μT，nI = ${n(sample.nI)} A/m。斜率即 μ₀。`
          : magnet
            ? `轴上 B = (μ₀/4π)(2m/r³)。指南针 tanθ = B/B地，θ = ${n(sample.thetaDeg)}°。B地 = ${formatLabSci(B_EARTH)} T。`
            : `长直导线 B = μ₀I/(2πr) = ${n(sample.BuT)} μT，方向由右手定则给出。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        magnet ? (
          <>
            <ParameterControl key="magnet-m" id="m" label="磁矩" symbol="m" unit="A·m²" value={params.m} min={0.2} max={2} step={0.05} onChange={(value) => set({ m: value })} />
            <ParameterControl key="magnet-r0" id="r0" label="探针起点" symbol="r₀" unit="cm" value={params.r0_cm} min={4} max={16} step={0.5} onChange={(value) => set({ r0_cm: value })} />
            <ParameterControl key="magnet-r1" id="r1" label="探针终点" symbol="r₁" unit="cm" value={params.r1_cm} min={8} max={24} step={0.5} onChange={(value) => set({ r1_cm: value })} />
          </>
        ) : solenoid ? (
          <>
            <ParameterControl key="solenoid-I" id="I" label="电流" symbol="I" unit="A" value={params.I} min={0.5} max={12} step={0.1} onChange={(value) => set({ I: value })} />
            <ParameterControl key="solenoid-n" id="n" label="匝数密度" symbol="n" unit="m⁻¹" value={params.n ?? 800} min={200} max={2000} step={20} onChange={(value) => set({ n: value })} />
            <ParameterControl key="solenoid-L" id="L" label="管长" symbol="ℓ" unit="cm" value={params.length_cm ?? 25} min={10} max={40} step={1} onChange={(value) => set({ length_cm: value })} />
          </>
        ) : (
          <>
            <ParameterControl key="wire-I" id="I" label="电流" symbol="I" unit="A" value={params.I} min={0.5} max={12} step={0.1} onChange={(value) => set({ I: value })} />
            <ParameterControl key="wire-r0" id="r0" label="探针起点" symbol="r₀" unit="cm" value={params.r0_cm} min={2} max={10} step={0.5} onChange={(value) => set({ r0_cm: value })} />
            <ParameterControl key="wire-r1" id="r1" label="探针终点" symbol="r₁" unit="cm" value={params.r1_cm} min={4} max={20} step={0.5} onChange={(value) => set({ r1_cm: value })} />
          </>
        )
      }
      formula={
        solenoid ? (
          <>
            <p className="text-quiet">B = μ₀ n I</p>
            <p>nI = {n(sample.nI)} A/m</p>
            <p className="text-navy">B = {n(sample.BuT)} μT</p>
          </>
        ) : magnet ? (
          <>
            <p className="text-quiet">B = (μ₀/4π) 2m / r³</p>
            <p>B = {n(sample.BuT)} μT</p>
            <p className="text-navy">θ = {n(sample.thetaDeg)} °</p>
          </>
        ) : (
          <>
            <p className="text-quiet">B = μ₀ I / (2π r)</p>
            <p>B = {n(sample.BuT)} μT</p>
            <p className="text-navy">r = {n(sample.r)} m</p>
          </>
        )
      }
      sceneTitle={solenoid ? "三维螺线管" : magnet ? "三维磁铁与地磁" : "三维载流导线"}
      sceneCaption={solenoid ? "管内 B 均匀　拖动旋转" : "右手定则　拖动旋转"}
      scene={
        <SceneCanvas camera={solenoid ? [0.42, 0.38, 0.72] : [0.7, 0.5, 1.15]} fov={42}>
          <MagnetismScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "r", value: n(sample.r), unit: "m" },
        { label: "B", value: n(sample.BuT), unit: "μT" },
        { label: "θ", value: n(sample.thetaDeg), unit: "°" },
        {
          label: solenoid ? "nI" : magnet ? "m" : "I",
          value: n(solenoid ? sample.nI : magnet ? params.m : params.I),
          unit: solenoid ? "A/m" : magnet ? "A·m²" : "A",
        },
      ]}
      charts={
        <>
          <TimeSeriesChart title="磁感应强度" quantity="B" unit="μT" strokeColor="#1E3A5F" valueKey="BuT" points={series} currentTime={time} currentValue={sample.BuT} minDuration={MAGNETISM_DURATION} />
          <TimeSeriesChart title="偏转角" quantity="θ" unit="°" strokeColor="#A16207" valueKey="thetaDeg" points={series} currentTime={time} currentValue={sample.thetaDeg} minDuration={MAGNETISM_DURATION} />
          <TimeSeriesChart title="距离" quantity="r" unit="m" strokeColor="#2563EB" valueKey="r" points={series} currentTime={time} currentValue={sample.r} minDuration={MAGNETISM_DURATION} />
          <TimeSeriesChart title="B (SI)" quantity="B" unit="T" strokeColor="#6D28D9" valueKey="B" points={series} currentTime={time} currentValue={sample.B} minDuration={MAGNETISM_DURATION} />
        </>
      }
    />
  );
}
