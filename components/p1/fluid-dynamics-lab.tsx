"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { FluidDynamicsScene } from "@/components/p1/fluid-dynamics-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_FLUID,
  depth,
  range,
  sampleAt,
  type FluidParams,
} from "@/lib/models/fluid-dynamics";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: keyof FluidParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "H", label: "液面高度", symbol: "H", unit: "m", min: 0.3, max: 1.4, step: 0.02 },
  { key: "holeY", label: "小孔离地", symbol: "y孔", unit: "m", min: 0.05, max: 1.2, step: 0.02 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

export function FluidDynamicsLab() {
  const [params, setParams] = useState(DEFAULT_FLUID);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t);
    return { sample: next, point: [next.R, 0.04, 0] as [number, number, number] };
  }, [params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const invalid = params.holeY >= params.H;

  return (
    <LabFrame
      title="流体孔流"
      subtitle="Physics Lab / 流体"
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "出流速率 v", value: n(sample.v), unit: "m/s" },
        { label: "射程 R", value: n(sample.R), unit: "m" },
      ]}
      status={
        invalid
          ? "小孔必须低于液面。减小 y孔 或增大 H。"
          : `v = √(2gh) = ${n(sample.v)} m/s，落地射程 R = ${n(range(params))} m。`
      }
      statusError={invalid}
      isPlaying={isPlaying}
      time={time}
      startDisabled={invalid}
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
          invalid={item.key === "holeY" && invalid}
          onChange={(value) => {
            reset();
            setParams((current) => ({ ...current, [item.key]: value }));
          }}
        />
      ))}
      formula={
        <>
          <p className="text-quiet">v = √(2gh)，h = H − y孔</p>
          <p>h = {n(depth(params))} m</p>
          <p className="text-navy">v = {n(sample.v)} m/s</p>
          <p>R = 2√(h · y孔) = {n(sample.R)} m</p>
        </>
      }
      sceneTitle="三维水箱出流"
      sceneCaption="虚线 射流　水滴　拖动旋转"
      scene={
        <SceneCanvas camera={[1.4, 0.9, 2.6]}>
          <FluidDynamicsScene params={params} sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "h", value: n(sample.depth), unit: "m" },
        { label: "v", value: n(sample.v), unit: "m/s" },
        { label: "R", value: n(sample.R), unit: "m" },
        { label: "t飞", value: n(sample.flight), unit: "s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="液面深度" quantity="h" unit="m" strokeColor="#1E3A5F" valueKey="depth" points={series} currentTime={time} currentValue={sample.depth} />
          <TimeSeriesChart title="出流速率" quantity="v" unit="m/s" strokeColor="#A16207" valueKey="v" points={series} currentTime={time} currentValue={sample.v} />
          <TimeSeriesChart title="射程" quantity="R" unit="m" strokeColor="#2563EB" valueKey="R" points={series} currentTime={time} currentValue={sample.R} />
          <TimeSeriesChart title="飞行时间" quantity="t飞" unit="s" strokeColor="#6D28D9" valueKey="flight" points={series} currentTime={time} currentValue={sample.flight} />
        </>
      }
    />
  );
}
