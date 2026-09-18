"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { DragForceScene } from "@/components/p1/drag-force-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_DRAG,
  durationOf,
  sampleAt,
  terminalSpeed,
  type DragMode,
  type DragParams,
} from "@/lib/models/drag-force";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

export function DragForceLab() {
  const [params, setParams] = useState(DEFAULT_DRAG);
  const [mode, setMode] = useState<DragMode>("linear");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0, 1.6 - Math.min(1.45, next.y * 0.22), 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => durationOf(params, mode), [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const vt = terminalSpeed(params, mode);
  const apply = (patch: Partial<DragParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="阻力与收尾速度"
      subtitle="Physics Lab / m dv/dt = mg − bvⁿ"
      modes={
        <ModeSwitch
          value={mode}
          options={[
            { id: "linear" as const, label: "线性 bv" },
            { id: "quadratic" as const, label: "二次 bv²" },
          ]}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "速率 v", value: n(sample.v), unit: "m/s" },
        { label: "收尾 vt", value: n(vt), unit: "m/s" },
      ]}
      status={
        mode === "linear"
          ? `dv/dt = g − (b/m)v，vt = mg/b = ${n(vt)} m/s。现在 a = ${n(sample.a)} m/s²。`
          : `dv/dt = g − (b/m)v²，vt = √(mg/b) = ${n(vt)} m/s。v = vt tanh(t/τ)。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.04} max={0.8} step={0.01} onChange={(value) => apply({ m: value })} />
          <ParameterControl id="b" label="阻力系数" symbol="b" unit="SI" value={params.b} min={0.05} max={1.2} step={0.01} onChange={(value) => apply({ b: value })} />
          <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => apply({ g: value })} />
        </>
      }
      formula={
        mode === "linear" ? (
          <>
            <p className="text-quiet">m dv/dt = mg − b v</p>
            <p>vt = mg/b = {n(vt)} m/s</p>
            <p className="text-navy">Fd = {n(sample.Fd)} N　a = {n(sample.a)} m/s²</p>
            <p>x = 0.00 m　vx = 0.00 m/s</p>
          </>
        ) : (
          <>
            <p className="text-quiet">m dv/dt = mg − b v²</p>
            <p>vt = √(mg/b) = {n(vt)} m/s</p>
            <p className="text-navy">Fd = {n(sample.Fd)} N　a = {n(sample.a)} m/s²</p>
            <p>x = 0.00 m　vx = 0.00 m/s</p>
          </>
        )
      }
      sceneTitle="三维落体阻力"
      sceneCaption="mg 向下　Fd 向上　拖动旋转"
      scene={
        <SceneCanvas camera={[1.3, 1.2, 2.4]}>
          <DragForceScene params={params} sample={sample} trail={trail} />
        </SceneCanvas>
      }
      readouts={[
        { label: "v", value: n(sample.v), unit: "m/s" },
        { label: "a", value: n(sample.a), unit: "m/s²" },
        { label: "Fd", value: n(sample.Fd), unit: "N" },
        { label: "vt", value: n(sample.vt), unit: "m/s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="速率" quantity="v" unit="m/s" strokeColor="#1E3A5F" valueKey="v" points={series} currentTime={time} currentValue={sample.v} minDuration={Math.max(durationOf(params, mode), 1)} />
          <TimeSeriesChart title="加速度" quantity="a" unit="m/s²" strokeColor="#A16207" valueKey="a" points={series} currentTime={time} currentValue={sample.a} />
          <TimeSeriesChart title="阻力" quantity="Fd" unit="N" strokeColor="#2563EB" valueKey="Fd" points={series} currentTime={time} currentValue={sample.Fd} />
          <TimeSeriesChart title="下落距离" quantity="y" unit="m" strokeColor="#6D28D9" valueKey="y" points={series} currentTime={time} currentValue={sample.y} />
        </>
      }
    />
  );
}
