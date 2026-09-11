"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { FluidDynamicsScene } from "@/components/p1/fluid-dynamics-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_FLUID,
  depth,
  range,
  sampleAt,
  type FluidMode,
  type FluidParams,
} from "@/lib/models/fluid-dynamics";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const FLUID_MODES = [
  { id: "single" as const, label: "单孔" },
  { id: "three" as const, label: "三孔罐" },
];

export function FluidDynamicsLab() {
  const [params, setParams] = useState(DEFAULT_FLUID);
  const [mode, setMode] = useState<FluidMode>("single");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [next.R, 0.04, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const three = mode === "three";
  const invalid = !three && params.holeY >= params.H;

  return (
    <LabFrame
      title="流体孔流"
      subtitle="Physics Lab / Unit 8 流体"
      modes={
        <ModeSwitch
          value={mode}
          options={FLUID_MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: three ? "中孔射程" : "出流速率 v", value: n(three ? sample.R : sample.v), unit: three ? "m" : "m/s" },
        { label: three ? "下孔射程" : "射程 R", value: n(three ? sample.R1 : sample.R), unit: "m" },
      ]}
      status={
        invalid
          ? "小孔必须低于液面。减小 y孔 或增大 H。"
          : three
            ? `三孔射程 R = 2√(h·y孔)。中间孔最远，R = ${n(sample.R2)} m；上下两孔应对称。`
            : `v = √(2gh) = ${n(sample.v)} m/s，落地射程 R = ${n(range(params))} m。`
      }
      statusError={invalid}
      isPlaying={isPlaying}
      time={time}
      startDisabled={invalid}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl
            id="H"
            label="液面高度"
            symbol="H"
            unit="m"
            value={params.H}
            min={0.3}
            max={1.4}
            step={0.02}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, H: value }));
            }}
          />
          {three ? null : (
            <ParameterControl
              id="holeY"
              label="小孔离地"
              symbol="y孔"
              unit="m"
              value={params.holeY}
              min={0.05}
              max={1.2}
              step={0.02}
              invalid={invalid}
              onChange={(value) => {
                reset();
                setParams((current) => ({ ...current, holeY: value }));
              }}
            />
          )}
          <ParameterControl
            id="g"
            label="重力加速度"
            symbol="g"
            unit="m/s²"
            value={params.g}
            min={1}
            max={20}
            step={0.01}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, g: value }));
            }}
          />
        </>
      }
      formula={
        three ? (
          <>
            <p className="text-quiet">R = 2√((H − y) · y)，最大射程在 y = H/2</p>
            <p>R下 = {n(sample.R1)} m</p>
            <p className="text-navy">R中 = {n(sample.R2)} m</p>
            <p>R上 = {n(sample.R3)} m</p>
          </>
        ) : (
          <>
            <p className="text-quiet">v = √(2gh)，h = H − y孔</p>
            <p>h = {n(depth(params))} m</p>
            <p className="text-navy">v = {n(sample.v)} m/s</p>
            <p>R = 2√(h · y孔) = {n(sample.R)} m</p>
          </>
        )
      }
      sceneTitle={three ? "三维三孔罐" : "三维水箱出流"}
      sceneCaption="虚线 射流　水滴　拖动旋转"
      scene={
        <SceneCanvas camera={[1.4, 0.9, 2.6]}>
          <FluidDynamicsScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        three
          ? [
              { label: "R下", value: n(sample.R1), unit: "m" },
              { label: "R中", value: n(sample.R2), unit: "m" },
              { label: "R上", value: n(sample.R3), unit: "m" },
              { label: "v中", value: n(sample.v), unit: "m/s" },
            ]
          : [
              { label: "h", value: n(sample.depth), unit: "m" },
              { label: "v", value: n(sample.v), unit: "m/s" },
              { label: "R", value: n(sample.R), unit: "m" },
              { label: "t飞", value: n(sample.flight), unit: "s" },
            ]
      }
      charts={
        three ? (
          <>
            <TimeSeriesChart title="下孔射程" quantity="R下" unit="m" strokeColor="#1E3A5F" valueKey="R1" points={series} currentTime={time} currentValue={sample.R1} />
            <TimeSeriesChart title="中孔射程" quantity="R中" unit="m" strokeColor="#A16207" valueKey="R2" points={series} currentTime={time} currentValue={sample.R2} />
            <TimeSeriesChart title="上孔射程" quantity="R上" unit="m" strokeColor="#2563EB" valueKey="R3" points={series} currentTime={time} currentValue={sample.R3} />
            <TimeSeriesChart title="中孔出流速率" quantity="v中" unit="m/s" strokeColor="#6D28D9" valueKey="v" points={series} currentTime={time} currentValue={sample.v} />
          </>
        ) : (
          <>
            <TimeSeriesChart title="液面深度" quantity="h" unit="m" strokeColor="#1E3A5F" valueKey="depth" points={series} currentTime={time} currentValue={sample.depth} />
            <TimeSeriesChart title="出流速率" quantity="v" unit="m/s" strokeColor="#A16207" valueKey="v" points={series} currentTime={time} currentValue={sample.v} />
            <TimeSeriesChart title="射程" quantity="R" unit="m" strokeColor="#2563EB" valueKey="R" points={series} currentTime={time} currentValue={sample.R} />
            <TimeSeriesChart title="飞行时间" quantity="t飞" unit="s" strokeColor="#6D28D9" valueKey="flight" points={series} currentTime={time} currentValue={sample.flight} />
          </>
        )
      }
    />
  );
}
