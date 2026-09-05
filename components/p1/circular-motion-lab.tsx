"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { CircularMotionScene } from "@/components/p1/circular-motion-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_CIRCULAR,
  period,
  sampleAt,
  type CircularMode,
  type CircularParams,
} from "@/lib/models/circular-motion";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const CIRCULAR_MODES = [
  { id: "conical" as const, label: "圆锥摆" },
  { id: "horizontal" as const, label: "水平圆周" },
  { id: "vertical" as const, label: "竖直圆周" },
];

export function CircularMotionLab() {
  const [params, setParams] = useState(DEFAULT_CIRCULAR);
  const [mode, setMode] = useState<CircularMode>("conical");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    const lift = mode === "conical" ? params.L + 0.08 : mode === "vertical" ? params.r + 0.08 : 0.08;
    return { sample: next, point: [next.x, lift + next.y, next.z] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute);
  const T = period(params, mode);
  const n = formatLabNumber;

  const set = (key: keyof CircularParams, value: number) => {
    reset();
    setParams((current) => ({ ...current, [key]: value }));
  };

  return (
    <LabFrame
      title="圆周运动"
      subtitle="Physics Lab / 力与平动"
      modes={
        <ModeSwitch
          value={mode}
          options={CIRCULAR_MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "角速度 ω", value: n(sample.omega), unit: "rad/s" },
        { label: mode === "vertical" ? "速率 v" : "周期 T", value: mode === "vertical" ? n(sample.speed) : n(T), unit: mode === "vertical" ? "m/s" : "s" },
      ]}
      status={
        mode === "horizontal"
          ? `水平圆周，T绳 = mv²/r = ${n(sample.tension)} N。拖动旋转视角。`
          : mode === "vertical"
            ? `竖直圆周，v² = v₀² − 2gR(1−cosφ)。最低点 T = mv²/R + mg。`
            : `圆锥摆，T = 2π√(L cosθ / g) = ${n(T)} s。拖动旋转视角。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        mode === "conical" ? (
          <>
            <ParameterControl id="L" label="摆长" symbol="L" unit="m" value={params.L} min={0.4} max={2} step={0.01} onChange={(value) => set("L", value)} />
            <ParameterControl id="thetaDeg" label="张角" symbol="θ" unit="°" value={params.thetaDeg} min={8} max={55} step={1} onChange={(value) => set("thetaDeg", value)} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => set("m", value)} />
            <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => set("g", value)} />
          </>
        ) : (
          <>
            <ParameterControl id="r" label="半径" symbol="R" unit="m" value={params.r} min={0.2} max={1.2} step={0.02} onChange={(value) => set("r", value)} />
            <ParameterControl id="v0" label={mode === "vertical" ? "底端速率" : "速率"} symbol="v₀" unit="m/s" value={params.v0} min={0.4} max={8} step={0.05} onChange={(value) => set("v0", value)} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => set("m", value)} />
            <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => set("g", value)} />
          </>
        )
      }
      formula={
        mode === "horizontal" ? (
          <>
            <p className="text-quiet">T = mv²/r，周期 2πr/v</p>
            <p>r = {n(sample.r)} m</p>
            <p className="text-navy">T绳 = {n(sample.tension)} N</p>
            <p>T = {n(T)} s</p>
          </>
        ) : mode === "vertical" ? (
          <>
            <p className="text-quiet">v² = v₀² − 2gR(1−cosφ)</p>
            <p>刚好过顶需 v₀ ≥ √(5gR)</p>
            <p className="text-navy">v = {n(sample.speed)} m/s</p>
            <p>T绳 = mv²/R + mg cosφ = {n(sample.tension)} N</p>
          </>
        ) : (
          <>
            <p className="text-quiet">T = 2π√(L cosθ / g)，r = L sinθ</p>
            <p>r = {n(sample.r)} m</p>
            <p className="text-navy">T = {n(T)} s</p>
            <p>ω = {n(sample.omega)} rad/s，v = {n(sample.speed)} m/s</p>
          </>
        )
      }
      sceneTitle={mode === "horizontal" ? "三维水平圆周" : mode === "vertical" ? "三维竖直圆周" : "三维圆锥摆"}
      sceneCaption="拖动旋转"
      scene={
        <SceneCanvas camera={[2.4, 1.7, 3.6]}>
          <CircularMotionScene params={params} sample={sample} trail={trail} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "x", value: n(sample.x), unit: "m" },
        { label: mode === "vertical" ? "y" : "z", value: n(mode === "vertical" ? sample.y : sample.z), unit: "m" },
        { label: "v", value: n(sample.speed), unit: "m/s" },
        { label: "T绳", value: n(sample.tension), unit: "N" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="水平位移 x" quantity="x" unit="m" strokeColor="#1E3A5F" valueKey="x" points={series} currentTime={time} currentValue={sample.x} minDuration={Math.max(Number.isFinite(T) ? T : 2, 2)} />
          <TimeSeriesChart title={mode === "vertical" ? "高度 y" : "深度方向 z"} quantity={mode === "vertical" ? "y" : "z"} unit="m" strokeColor="#A16207" valueKey={mode === "vertical" ? "y" : "z"} points={series} currentTime={time} currentValue={mode === "vertical" ? sample.y : sample.z} minDuration={Math.max(Number.isFinite(T) ? T : 2, 2)} />
          <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#2563EB" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} minDuration={Math.max(Number.isFinite(T) ? T : 2, 2)} />
          <TimeSeriesChart title="速率" quantity="v" unit="m/s" strokeColor="#6D28D9" valueKey="speed" points={series} currentTime={time} currentValue={sample.speed} minDuration={Math.max(Number.isFinite(T) ? T : 2, 2)} />
        </>
      }
    />
  );
}
