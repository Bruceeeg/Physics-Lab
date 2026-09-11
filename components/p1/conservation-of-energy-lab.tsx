"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ConservationOfEnergyScene } from "@/components/p1/conservation-of-energy-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_ENERGY,
  attachedLoopPeriod,
  cartPlacement,
  cyclePeriod,
  peakHeight,
  sampleAt,
  type EnergyMode,
  type EnergyParams,
} from "@/lib/models/conservation-of-energy";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: keyof EnergyParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "k", label: "劲度系数", symbol: "k", unit: "N/m", min: 50, max: 400, step: 5 },
  { key: "A", label: "压缩量", symbol: "A", unit: "m", min: 0.05, max: 0.3, step: 0.01 },
  { key: "m", label: "质量", symbol: "m", unit: "kg", min: 0.2, max: 2, step: 0.05 },
  { key: "thetaDeg", label: "斜面倾角", symbol: "θ", unit: "°", min: 12, max: 50, step: 1 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

const ENERGY_MODES = [
  { id: "launch" as const, label: "弹射上坡" },
  { id: "attached" as const, label: "弹簧连接" },
];

export function ConservationOfEnergyLab() {
  const [params, setParams] = useState(DEFAULT_ENERGY);
  const [mode, setMode] = useState<EnergyMode>("launch");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: cartPlacement(next.s, params.thetaDeg).position };
  }, [mode, params]);
  const physicsPeriod = mode === "attached" ? attachedLoopPeriod(params) : cyclePeriod(params);
  const visualRate = physicsPeriod / 3.2;
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(
    compute,
    undefined,
    { rate: visualRate },
  );
  const hMax = peakHeight(params, mode);
  const n = formatLabNumber;
  const E0 = 0.5 * params.k * params.A * params.A;
  const attached = mode === "attached";

  return (
    <LabFrame
      title="机械能守恒"
      subtitle="Physics Lab / 功、能、功率"
      modes={
        <ModeSwitch
          value={mode}
          options={ENERGY_MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "动能 K", value: n(sample.K), unit: "J" },
        { label: "高度 y", value: n(sample.y), unit: "m" },
      ]}
      status={
        attached
          ? `弹簧始终连着小车，会拉回来。ymax = ${n(hMax)} m，E = ${n(E0)} J 保持不变。`
          : `松开弹簧后冲上斜面。ymax = ${n(hMax)} m，E = ${n(E0)} J 保持不变。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={PARAMETER_DEFINITIONS.map((item) => (
        <ParameterControl
          key={item.key}
          id={item.key}
          label={item.label}
          symbol={item.symbol}
          unit={item.unit}
          value={params[item.key]}
          min={item.min}
          max={item.max}
          step={item.step}
          onChange={(value) => {
            reset();
            setParams((current) => ({ ...current, [item.key]: value }));
          }}
        />
      ))}
      formula={
        attached ? (
          <>
            <p className="text-quiet">½ks² + mgy + ½mv² = ½kA²</p>
            <p>弹簧不松开，Us 在斜面上仍存在</p>
            <p>½kA² = {n(E0)} J</p>
            <p className="text-navy">y_max = {n(hMax)} m</p>
            <p>E = K + Us + Ug = {n(sample.E)} J</p>
          </>
        ) : (
          <>
            <p className="text-quiet">½kA² = mgy_max</p>
            <p>½kA² = {n(E0)} J</p>
            <p className="text-navy">y_max = {n(hMax)} m</p>
            <p>E = K + Us + Ug = {n(sample.E)} J</p>
          </>
        )
      }
      sceneTitle="三维弹簧斜面"
      sceneCaption={attached ? "弹簧连接　拖动旋转" : "松开后上坡　拖动旋转"}
      scene={
        <SceneCanvas camera={[1.6, 1.1, 2.8]}>
          <ConservationOfEnergyScene params={params} sample={sample} trail={trail} />
        </SceneCanvas>
      }
      readouts={[
        { label: "K", value: n(sample.K), unit: "J" },
        { label: "Us", value: n(sample.Us), unit: "J" },
        { label: "Ug", value: n(sample.Ug), unit: "J" },
        { label: "E", value: n(sample.E), unit: "J" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="动能" quantity="K" unit="J" strokeColor="#1E3A5F" valueKey="K" points={series} currentTime={time} currentValue={sample.K} />
          <TimeSeriesChart title="弹性势能" quantity="Us" unit="J" strokeColor="#A16207" valueKey="Us" points={series} currentTime={time} currentValue={sample.Us} />
          <TimeSeriesChart title="重力势能" quantity="Ug" unit="J" strokeColor="#2563EB" valueKey="Ug" points={series} currentTime={time} currentValue={sample.Ug} />
          <TimeSeriesChart title="机械能" quantity="E" unit="J" strokeColor="#6D28D9" valueKey="E" points={series} currentTime={time} currentValue={sample.E} />
        </>
      }
    />
  );
}
