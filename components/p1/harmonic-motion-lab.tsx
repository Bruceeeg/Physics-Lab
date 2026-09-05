"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { HarmonicMotionScene } from "@/components/p1/harmonic-motion-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_HARMONIC,
  period,
  sampleAt,
  type HarmonicMode,
  type HarmonicParams,
} from "@/lib/models/harmonic-motion";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const HARMONIC_MODES = [
  { id: "pendulum" as const, label: "单摆" },
  { id: "spring" as const, label: "弹簧振子" },
];

export function HarmonicMotionLab() {
  const [params, setParams] = useState(DEFAULT_HARMONIC);
  const [mode, setMode] = useState<HarmonicMode>("pendulum");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return {
      sample: next,
      point:
        mode === "spring"
          ? [next.x, 0.12, 0] as [number, number, number]
          : [next.x, params.L + 0.1 + next.y, 0] as [number, number, number],
    };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute);
  const T = period(params, mode);
  const n = formatLabNumber;
  const spring = mode === "spring";

  return (
    <LabFrame
      title="简谐运动"
      subtitle="Physics Lab / 振动"
      modes={
        <ModeSwitch
          value={mode}
          options={HARMONIC_MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: spring ? "位移 x" : "角位移 θ", value: spring ? n(sample.x) : n((sample.theta * 180) / Math.PI), unit: spring ? "m" : "°" },
        { label: "周期 T", value: n(T), unit: "s" },
      ]}
      status={
        spring
          ? `水平弹簧振子，T = 2π√(m/k) = ${n(T)} s，与振幅无关。`
          : `小角近似 T = 2π√(L/g) = ${n(T)} s，与质量和振幅无关。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        spring ? (
          <>
            <ParameterControl id="k" label="劲度系数" symbol="k" unit="N/m" value={params.k} min={10} max={120} step={1} onChange={(value) => { reset(); setParams((current) => ({ ...current, k: value })); }} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => { reset(); setParams((current) => ({ ...current, m: value })); }} />
            <ParameterControl id="A" label="振幅" symbol="A" unit="m" value={params.A} min={0.05} max={0.35} step={0.01} onChange={(value) => { reset(); setParams((current) => ({ ...current, A: value })); }} />
          </>
        ) : (
          <>
            <ParameterControl id="L" label="摆长" symbol="L" unit="m" value={params.L} min={0.3} max={2} step={0.01} onChange={(value) => { reset(); setParams((current) => ({ ...current, L: value })); }} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => { reset(); setParams((current) => ({ ...current, m: value })); }} />
            <ParameterControl id="theta0Deg" label="振幅" symbol="θ₀" unit="°" value={params.theta0Deg} min={2} max={20} step={0.5} onChange={(value) => { reset(); setParams((current) => ({ ...current, theta0Deg: value })); }} />
            <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => { reset(); setParams((current) => ({ ...current, g: value })); }} />
          </>
        )
      }
      formula={
        spring ? (
          <>
            <p className="text-quiet">T = 2π√(m/k)，x = A cos(ωt)</p>
            <p className="text-navy">T = {n(T)} s</p>
            <p>½kA² = {n(0.5 * params.k * params.A * params.A)} J</p>
            <p>E = K + Us = {n(sample.E)} J</p>
          </>
        ) : (
          <>
            <p className="text-quiet">T = 2π√(L/g)，θ = θ₀ cos(ωt)</p>
            <p className="text-navy">T = {n(T)} s</p>
            <p>ω = {n(Math.sqrt(params.g / params.L))} rad/s</p>
            <p>E ≈ {n(sample.E)} J</p>
          </>
        )
      }
      sceneTitle={spring ? "三维弹簧振子" : "三维单摆"}
      sceneCaption={spring ? "水平桌面　拖动旋转" : "小角简谐　拖动旋转"}
      scene={
        <SceneCanvas camera={[1.6, 1.2, 2.8]}>
          <HarmonicMotionScene params={params} sample={sample} trail={trail} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        spring
          ? [
              { label: "x", value: n(sample.x), unit: "m" },
              { label: "v", value: n(sample.v), unit: "m/s" },
              { label: "K", value: n(sample.K), unit: "J" },
              { label: "Us", value: n(sample.Us), unit: "J" },
            ]
          : [
              { label: "θ", value: n((sample.theta * 180) / Math.PI), unit: "°" },
              { label: "ω", value: n(sample.omega), unit: "rad/s" },
              { label: "K", value: n(sample.K), unit: "J" },
              { label: "U", value: n(sample.Ug), unit: "J" },
            ]
      }
      charts={
        spring ? (
          <>
            <TimeSeriesChart title="位移" quantity="x" unit="m" strokeColor="#1E3A5F" valueKey="x" points={series} currentTime={time} currentValue={sample.x} minDuration={Math.max(T, 2)} />
            <TimeSeriesChart title="速度" quantity="v" unit="m/s" strokeColor="#A16207" valueKey="v" points={series} currentTime={time} currentValue={sample.v} minDuration={Math.max(T, 2)} />
            <TimeSeriesChart title="动能" quantity="K" unit="J" strokeColor="#2563EB" valueKey="K" points={series} currentTime={time} currentValue={sample.K} minDuration={Math.max(T, 2)} />
            <TimeSeriesChart title="弹性势能" quantity="Us" unit="J" strokeColor="#6D28D9" valueKey="Us" points={series} currentTime={time} currentValue={sample.Us} minDuration={Math.max(T, 2)} />
          </>
        ) : (
          <>
            <TimeSeriesChart title="角位移" quantity="θ" unit="rad" strokeColor="#1E3A5F" valueKey="theta" points={series} currentTime={time} currentValue={sample.theta} minDuration={Math.max(T, 2)} />
            <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#A16207" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} minDuration={Math.max(T, 2)} />
            <TimeSeriesChart title="动能" quantity="K" unit="J" strokeColor="#2563EB" valueKey="K" points={series} currentTime={time} currentValue={sample.K} minDuration={Math.max(T, 2)} />
            <TimeSeriesChart title="势能" quantity="U" unit="J" strokeColor="#6D28D9" valueKey="Ug" points={series} currentTime={time} currentValue={sample.Ug} minDuration={Math.max(T, 2)} />
          </>
        )
      }
    />
  );
}
