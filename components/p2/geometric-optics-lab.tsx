"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { GeometricOpticsScene } from "@/components/p2/geometric-optics-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_OPTICS,
  sampleAt,
  type OpticsMode,
  type OpticsParams,
} from "@/lib/models/geometric-optics";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "convex" as const, label: "凸透镜" },
  { id: "concave" as const, label: "凹透镜" },
];

export function GeometricOpticsLab() {
  const [params, setParams] = useState(DEFAULT_OPTICS);
  const [mode, setMode] = useState<OpticsMode>("convex");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [Number.isFinite(next.sp) ? next.sp : 0, 0.12, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const convex = mode === "convex";
  const set = (patch: Partial<OpticsParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="薄透镜焦距"
      subtitle="Physics Lab / Unit 13 几何光学"
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
        { label: "物距 s", value: n(sample.s * 100), unit: "cm" },
        { label: "像距 s′", value: sample.infinite ? "—" : n(sample.sp * 100), unit: "cm" },
      ]}
      status={
        sample.infinite
          ? "物距等于焦距，像在无穷远。略微改变 s。"
          : convex
            ? sample.real
              ? `1/f = 1/s + 1/s′，测得 f = ${n(sample.fMeas * 100)} cm。倒立实像，m = ${n(sample.m)}。`
              : `物在焦点以内，正立虚像。由透镜方程得 f = ${n(sample.fMeas * 100)} cm。`
            : `凹透镜始终成正立缩小虚像。f = ${n(sample.fMeas * 100)} cm（负）。`
      }
      statusError={sample.infinite}
      isPlaying={isPlaying}
      time={time}
      startDisabled={sample.infinite}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="f" label="焦距大小" symbol="|f|" unit="cm" value={params.f_cm} min={8} max={40} step={0.5} onChange={(value) => set({ f_cm: value })} />
          <ParameterControl id="s" label="物距" symbol="s" unit="cm" value={params.s_cm} min={8} max={90} step={0.5} onChange={(value) => set({ s_cm: value })} />
          <ParameterControl id="h" label="物高" symbol="h" unit="cm" value={params.h_cm} min={1} max={10} step={0.2} onChange={(value) => set({ h_cm: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">1/f = 1/s + 1/s′</p>
          <p>s′ = {sample.infinite ? "∞" : `${n(sample.sp * 100)} cm`}</p>
          <p>m = {sample.infinite ? "—" : n(sample.m)}</p>
          <p className="text-navy">f = {sample.infinite ? "—" : `${n(sample.fMeas * 100)} cm`}</p>
        </>
      }
      sceneTitle={convex ? "三维凸透镜光具座" : "三维凹透镜光具座"}
      sceneCaption="主光线　拖动旋转"
      scene={
        <SceneCanvas camera={[0.15, 0.45, 1.55]} fov={42}>
          <GeometricOpticsScene sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "s", value: n(sample.s * 100), unit: "cm" },
        { label: "s′", value: sample.infinite ? "—" : n(sample.sp * 100), unit: "cm" },
        { label: "m", value: sample.infinite ? "—" : n(sample.m), unit: "" },
        { label: "f", value: sample.infinite ? "—" : n(sample.fMeas * 100), unit: "cm" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="物距" quantity="s" unit="m" strokeColor="#1E3A5F" valueKey="s" points={series} currentTime={time} currentValue={sample.s} />
          <TimeSeriesChart title="像距" quantity="s′" unit="m" strokeColor="#A16207" valueKey="sp" points={series.filter((point) => Number.isFinite(point.sp))} currentTime={time} currentValue={Number.isFinite(sample.sp) ? sample.sp : 0} />
          <TimeSeriesChart title="放大率" quantity="m" unit="" strokeColor="#2563EB" valueKey="m" points={series.filter((point) => Number.isFinite(point.m))} currentTime={time} currentValue={Number.isFinite(sample.m) ? sample.m : 0} />
          <TimeSeriesChart title="像高" quantity="h′" unit="m" strokeColor="#6D28D9" valueKey="hp" points={series.filter((point) => Number.isFinite(point.hp))} currentTime={time} currentValue={Number.isFinite(sample.hp) ? sample.hp : 0} />
        </>
      }
    />
  );
}
