"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ArchimedesScene } from "@/components/p1/archimedes-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_ARCHIMEDES,
  LOWER_DURATION,
  sampleAt,
  volume,
  type ArchimedesParams,
} from "@/lib/models/archimedes";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

function formatVolume(value: number) {
  if (Math.abs(value) < 1e-12) {
    return "0";
  }
  if (Math.abs(value) >= 0.01) {
    return formatLabNumber(value);
  }
  const [mantissa, exponent] = value.toExponential(2).split("e");
  return `${mantissa}×10^${Number(exponent)}`;
}

const PARAMETER_DEFINITIONS: {
  key: keyof ArchimedesParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "rhoObj", label: "物体密度", symbol: "ρ物", unit: "kg/m³", min: 200, max: 8000, step: 50 },
  { key: "rhoFluid", label: "液体密度", symbol: "ρ液", unit: "kg/m³", min: 500, max: 14000, step: 50 },
  { key: "side", label: "立方边长", symbol: "a", unit: "m", min: 0.04, max: 0.14, step: 0.005 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

export function ArchimedesLab() {
  const [params, setParams] = useState(DEFAULT_ARCHIMEDES);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t);
    return { sample: next, point: [0, 0.28 + params.side / 2 - next.s, 0] as [number, number, number] };
  }, [params]);
  const getLimit = useCallback(() => LOWER_DURATION, []);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;

  return (
    <LabFrame
      title="阿基米德原理"
      subtitle="Physics Lab / 流体"
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "浮力 Fb", value: n(sample.Fb), unit: "N" },
        { label: "秤示数 T", value: n(sample.T), unit: "N" },
      ]}
      status={
        sample.fullyIn
          ? `已完全浸没。ρ液 = Fb / (Vg) = ${n(sample.rhoMeas)} kg/m³。`
          : "从空气中匀速降下，秤的示数 T = mg − Fb。"
      }
      isPlaying={isPlaying}
      time={time}
      startLabel={time >= LOWER_DURATION - 1e-6 ? "再降一次" : time > 0 ? "继续" : "开始"}
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
        <>
          <p className="text-quiet">Fb = ρ V_排 g</p>
          <p>V = a³ = {formatVolume(volume(params))} m³</p>
          <p>V_排 = {formatVolume(sample.Vsub)} m³</p>
          <p className="text-navy">Fb = {n(sample.Fb)} N</p>
        </>
      }
      sceneTitle="三维测密度"
      sceneCaption="实线 Fb / mg　拖动旋转"
      scene={
        <SceneCanvas camera={[0.55, 0.45, 1.15]} fov={42}>
          <ArchimedesScene params={params} sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "T", value: n(sample.T), unit: "N" },
        { label: "Fb", value: n(sample.Fb), unit: "N" },
        { label: "V排", value: formatVolume(sample.Vsub), unit: "m³" },
        { label: "ρ测", value: sample.fullyIn ? n(sample.rhoMeas) : "-", unit: "kg/m³" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="秤示数" quantity="T" unit="N" strokeColor="#1E3A5F" valueKey="T" points={series} currentTime={time} currentValue={sample.T} minDuration={LOWER_DURATION} />
          <TimeSeriesChart title="浮力" quantity="Fb" unit="N" strokeColor="#A16207" valueKey="Fb" points={series} currentTime={time} currentValue={sample.Fb} minDuration={LOWER_DURATION} />
          <TimeSeriesChart title="排开体积" quantity="V排" unit="m³" strokeColor="#2563EB" valueKey="Vsub" points={series} currentTime={time} currentValue={sample.Vsub} minDuration={LOWER_DURATION} />
          <TimeSeriesChart title="测得液体密度" quantity="ρ测" unit="kg/m³" strokeColor="#6D28D9" valueKey="rhoMeas" points={series} currentTime={time} currentValue={sample.rhoMeas} minDuration={LOWER_DURATION} />
        </>
      }
    />
  );
}
