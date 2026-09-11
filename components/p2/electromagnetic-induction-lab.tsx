"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ElectromagneticInductionScene } from "@/components/p2/electromagnetic-induction-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_INDUCTION,
  coilDuration,
  sampleAt,
  type InductionMode,
  type InductionParams,
} from "@/lib/models/electromagnetic-induction";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "coil" as const, label: "磁铁穿线圈" },
  { id: "rail" as const, label: "滑动导轨" },
];

export function ElectromagneticInductionLab() {
  const [params, setParams] = useState(DEFAULT_INDUCTION);
  const [mode, setMode] = useState<InductionMode>("coil");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return {
      sample: next,
      point: mode === "rail" ? [next.z * 0.8, 0.08, 0] as [number, number, number] : [0, 0.34 + next.z, 0] as [number, number, number],
    };
  }, [mode, params]);
  const getLimit = useCallback(() => (mode === "coil" ? coilDuration(params) : 1.2), [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const rail = mode === "rail";
  const set = (patch: Partial<InductionParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="电磁感应"
      subtitle="Physics Lab / Unit 12 磁与电磁"
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
        { label: "电动势 ε", value: n(sample.emf), unit: "V" },
        { label: rail ? "安培力 F" : "磁通 Φ", value: rail ? n(sample.F) : formatLabSci(sample.flux), unit: rail ? "N" : "Wb" },
      ]}
      status={
        rail
          ? `ε = Bℓv = ${n(sample.emf)} V。楞次定律：安培力 F = −IℓB，阻碍滑动。`
          : `ε = −N dΦ/dt。磁铁过中心时 Φ 最大、ε 改号，符合楞次定律。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        rail ? (
          <>
            <ParameterControl id="B" label="磁场" symbol="B" unit="T" value={params.B} min={0.1} max={1} step={0.05} onChange={(value) => set({ B: value })} />
            <ParameterControl id="ell" label="杆长" symbol="ℓ" unit="m" value={params.ell} min={0.08} max={0.4} step={0.01} onChange={(value) => set({ ell: value })} />
            <ParameterControl id="v" label="速率" symbol="v" unit="m/s" value={params.v} min={0.2} max={4} step={0.1} onChange={(value) => set({ v: value })} />
            <ParameterControl id="R" label="回路电阻" symbol="R" unit="Ω" value={params.R} min={0.2} max={4} step={0.1} onChange={(value) => set({ R: value })} />
          </>
        ) : (
          <>
            <ParameterControl id="N" label="匝数" symbol="N" unit="" value={params.N} min={10} max={80} step={1} onChange={(value) => set({ N: value })} />
            <ParameterControl id="v" label="下落速率" symbol="v" unit="m/s" value={params.v} min={0.15} max={1.2} step={0.05} onChange={(value) => set({ v: value })} />
            <ParameterControl id="Bpeak" label="峰值 B" symbol="B" unit="T" value={params.Bpeak} min={0.02} max={0.2} step={0.01} onChange={(value) => set({ Bpeak: value })} />
            <ParameterControl id="R" label="回路电阻" symbol="R" unit="Ω" value={params.R} min={0.2} max={8} step={0.1} onChange={(value) => set({ R: value })} />
          </>
        )
      }
      formula={
        rail ? (
          <>
            <p className="text-quiet">ε = B ℓ v</p>
            <p className="text-navy">ε = {n(sample.emf)} V</p>
            <p>I = {n(sample.I)} A</p>
            <p>F = {n(sample.F)} N</p>
          </>
        ) : (
          <>
            <p className="text-quiet">ε = −N dΦ_B / dt</p>
            <p>Φ = {formatLabSci(sample.flux)} Wb</p>
            <p className="text-navy">ε = {n(sample.emf)} V</p>
            <p>I = {n(sample.I)} A</p>
          </>
        )
      }
      sceneTitle={rail ? "三维导轨" : "三维线圈"}
      sceneCaption="楞次定律　拖动旋转"
      scene={
        <SceneCanvas camera={[0.7, 0.5, 1.2]} fov={42}>
          <ElectromagneticInductionScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "ε", value: n(sample.emf), unit: "V" },
        { label: "I", value: n(sample.I), unit: "A" },
        { label: rail ? "F" : "Φ", value: rail ? n(sample.F) : formatLabSci(sample.flux), unit: rail ? "N" : "Wb" },
        { label: "P", value: n(sample.P), unit: "W" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="感应电动势" quantity="ε" unit="V" strokeColor="#1E3A5F" valueKey="emf" points={series} currentTime={time} currentValue={sample.emf} minDuration={rail ? 1.2 : coilDuration(params)} />
          <TimeSeriesChart title="电流" quantity="I" unit="A" strokeColor="#A16207" valueKey="I" points={series} currentTime={time} currentValue={sample.I} minDuration={rail ? 1.2 : coilDuration(params)} />
          <TimeSeriesChart title={rail ? "安培力" : "磁通"} quantity={rail ? "F" : "Φ"} unit={rail ? "N" : "Wb"} strokeColor="#2563EB" valueKey={rail ? "F" : "flux"} points={series} currentTime={time} currentValue={rail ? sample.F : sample.flux} minDuration={rail ? 1.2 : coilDuration(params)} />
          <TimeSeriesChart title={rail ? "位置" : "磁铁位置"} quantity="z" unit="m" strokeColor="#6D28D9" valueKey="z" points={series} currentTime={time} currentValue={sample.z} minDuration={rail ? 1.2 : coilDuration(params)} />
        </>
      }
    />
  );
}
