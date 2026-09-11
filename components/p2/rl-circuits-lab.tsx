"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { RlCircuitsScene } from "@/components/p2/rl-circuits-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_RL,
  lcOmega,
  rlDuration,
  rlTau,
  sampleAt,
  type RlMode,
  type RlParams,
} from "@/lib/models/rl-circuits";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "grow" as const, label: "RL 增长" },
  { id: "decay" as const, label: "RL 衰减" },
  { id: "lc" as const, label: "LC 振荡" },
];

export function RlCircuitsLab(_props: { slug?: string } = {}) {
  const [params, setParams] = useState(DEFAULT_RL);
  const [mode, setMode] = useState<RlMode>("grow");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0.22, 0.08, -0.08] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => rlDuration(params, mode), [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const tau = rlTau(params);
  const w = lcOmega(params);
  const lc = mode === "lc";
  const set = (patch: Partial<RlParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="RL / LC 电路"
      subtitle="Physics Lab / Unit 13 电磁感应"
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
        { label: "电流 I", value: n(sample.I), unit: "A" },
        { label: lc ? "角频率 ω" : "时间常数", value: lc ? n(w) : formatLabSci(tau), unit: lc ? "rad/s" : "s" },
      ]}
      status={
        lc
          ? `LC 振荡 ω = 1/√(LC) = ${n(w)} rad/s，对照弹簧振子。`
          : mode === "grow"
            ? `L di/dt + RI = ε。τ = L/R = ${formatLabSci(tau)} s，电流趋向 ε/R。`
            : `断开电源后 I = I₀ e^(−tR/L)，τ = ${formatLabSci(tau)} s。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="R" label="电阻" symbol="R" unit="Ω" value={params.R} min={2} max={40} step={1} onChange={(value) => set({ R: value })} />
          <ParameterControl id="L" label="电感" symbol="L" unit="mH" value={params.L_mH} min={20} max={200} step={5} onChange={(value) => set({ L_mH: value })} />
          {lc ? (
            <ParameterControl key="C" id="C" label="电容" symbol="C" unit="μF" value={params.C_uF} min={20} max={400} step={10} onChange={(value) => set({ C_uF: value })} />
          ) : (
            <ParameterControl key="emf" id="emf" label="电源电动势" symbol="ε" unit="V" value={params.emf} min={2} max={18} step={0.5} onChange={(value) => set({ emf: value })} />
          )}
        </>
      }
      formula={
        lc ? (
          <>
            <p className="text-quiet">ω = 1/√(LC)</p>
            <p className="text-navy">ω = {n(w)} rad/s</p>
            <p>Q = {formatLabSci(sample.Q)} C</p>
            <p>I = {n(sample.I)} A</p>
          </>
        ) : (
          <>
            <p className="text-quiet">{mode === "grow" ? "L di/dt + RI = ε" : "L di/dt + RI = 0"}</p>
            <p className="text-navy">τ = L/R = {formatLabSci(tau)} s</p>
            <p>I = {n(sample.I)} A</p>
            <p>VL = {n(sample.VL)} V</p>
          </>
        )
      }
      sceneTitle={lc ? "三维 LC" : "三维 RL"}
      sceneCaption="电感电流不能突变　拖动旋转"
      scene={
        <SceneCanvas camera={[0.4, 0.5, 0.95]} fov={42}>
          <RlCircuitsScene sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        lc
          ? [
              { label: "I", value: n(sample.I), unit: "A" },
              { label: "Q", value: formatLabSci(sample.Q), unit: "C" },
              { label: "ω", value: n(sample.omega), unit: "rad/s" },
              { label: "VL", value: n(sample.VL), unit: "V" },
            ]
          : [
              { label: "I", value: n(sample.I), unit: "A" },
              { label: "VL", value: n(sample.VL), unit: "V" },
              { label: "VR", value: n(sample.VR), unit: "V" },
              { label: "τ", value: n(tau), unit: "s" },
            ]
      }
      charts={
        lc ? (
          <>
            <TimeSeriesChart title="电流" quantity="I" unit="A" strokeColor="#1E3A5F" valueKey="I" points={series} currentTime={time} currentValue={sample.I} minDuration={rlDuration(params, mode)} />
            <TimeSeriesChart title="电荷" quantity="Q" unit="C" strokeColor="#A16207" valueKey="Q" points={series} currentTime={time} currentValue={sample.Q} minDuration={rlDuration(params, mode)} />
            <TimeSeriesChart title="电感电压" quantity="VL" unit="V" strokeColor="#2563EB" valueKey="VL" points={series} currentTime={time} currentValue={sample.VL} minDuration={rlDuration(params, mode)} />
            <TimeSeriesChart title="角频率" quantity="ω" unit="rad/s" strokeColor="#6D28D9" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} minDuration={rlDuration(params, mode)} />
          </>
        ) : (
          <>
            <TimeSeriesChart title="电流" quantity="I" unit="A" strokeColor="#1E3A5F" valueKey="I" points={series} currentTime={time} currentValue={sample.I} minDuration={rlDuration(params, mode)} />
            <TimeSeriesChart title="电感电压" quantity="VL" unit="V" strokeColor="#A16207" valueKey="VL" points={series} currentTime={time} currentValue={sample.VL} minDuration={rlDuration(params, mode)} />
            <TimeSeriesChart title="电阻电压" quantity="VR" unit="V" strokeColor="#2563EB" valueKey="VR" points={series} currentTime={time} currentValue={sample.VR} minDuration={rlDuration(params, mode)} />
            <TimeSeriesChart title="时间常数" quantity="τ" unit="s" strokeColor="#6D28D9" valueKey="tau" points={series} currentTime={time} currentValue={sample.tau} minDuration={rlDuration(params, mode)} />
          </>
        )
      }
    />
  );
}
