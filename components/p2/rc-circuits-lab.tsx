"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { RcCircuitsScene } from "@/components/p2/rc-circuits-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_RC,
  chargeDuration,
  sampleAt,
  timeConstant,
  type RcMode,
  type RcParams,
} from "@/lib/models/rc-circuits";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "charge" as const, label: "充电" },
  { id: "discharge" as const, label: "放电" },
];

export function RcCircuitsLab() {
  const [params, setParams] = useState(DEFAULT_RC);
  const [mode, setMode] = useState<RcMode>("charge");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0.26, 0.12, -0.08] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => chargeDuration(params), [params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const tau = timeConstant(params);
  const charging = mode === "charge";
  const set = (patch: Partial<RcParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="RC 电路"
      subtitle="Physics Lab / Unit 11 电路"
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
        { label: "电容电压", value: n(sample.Vc), unit: "V" },
        { label: "时间常数", value: n(tau), unit: "s" },
      ]}
      status={
        charging
          ? time < 1e-6
            ? `t = 0 电容近似短路，I = ε/R = ${formatLabSci(params.emf / params.R)} A。`
            : time >= 5 * tau - 1e-6
              ? `约 5τ 后电容近似断路，Vc = ε = ${n(params.emf)} V，I ≈ 0。`
              : `充电 Vc = ε(1 − e^(−t/RC)) = ${n(sample.Vc)} V。`
          : `放电 Vc = ε e^(−t/RC) = ${n(sample.Vc)} V，电流方向与充电相反。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="R" label="电阻" symbol="R" unit="Ω" value={params.R} min={200} max={8000} step={50} onChange={(value) => set({ R: value })} />
          <ParameterControl id="C" label="电容" symbol="C" unit="μF" value={params.C_uF} min={20} max={400} step={10} onChange={(value) => set({ C_uF: value })} />
          <ParameterControl id="emf" label="电源电动势" symbol="ε" unit="V" value={params.emf} min={2} max={18} step={0.5} onChange={(value) => set({ emf: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">{charging ? "dQ/dt + Q/RC = ε/R" : "dQ/dt + Q/RC = 0"}</p>
          <p className="text-navy">τ = RC = {n(tau)} s</p>
          <p>Vc = {n(sample.Vc)} V</p>
          <p>I = {formatLabSci(sample.I)} A</p>
        </>
      }
      sceneTitle={charging ? "三维充电" : "三维放电"}
      sceneCaption="极板电荷　拖动旋转"
      scene={
        <SceneCanvas camera={[0.4, 0.5, 0.95]} fov={42}>
          <RcCircuitsScene sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "Vc", value: n(sample.Vc), unit: "V" },
        { label: "I", value: formatLabSci(sample.I), unit: "A" },
        { label: "Q", value: formatLabSci(sample.Q), unit: "C" },
        { label: "τ", value: n(tau), unit: "s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="电容电压" quantity="Vc" unit="V" strokeColor="#1E3A5F" valueKey="Vc" points={series} currentTime={time} currentValue={sample.Vc} minDuration={Math.max(tau * 5, 1)} />
          <TimeSeriesChart title="电流" quantity="I" unit="A" strokeColor="#A16207" valueKey="I" points={series} currentTime={time} currentValue={sample.I} minDuration={Math.max(tau * 5, 1)} />
          <TimeSeriesChart title="电荷" quantity="Q" unit="C" strokeColor="#2563EB" valueKey="Q" points={series} currentTime={time} currentValue={sample.Q} minDuration={Math.max(tau * 5, 1)} />
          <TimeSeriesChart title="电阻电压" quantity="Vr" unit="V" strokeColor="#6D28D9" valueKey="Vr" points={series} currentTime={time} currentValue={sample.Vr} minDuration={Math.max(tau * 5, 1)} />
        </>
      }
    />
  );
}
