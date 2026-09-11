"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ChoiceRow, LabFrame, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { RotationN2Scene } from "@/components/p1/rotation-n2-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_ROTATION_N2,
  INERTIA_SHAPES,
  linearAccel,
  sampleAt,
  theoryI,
  timeToFloor,
  type InertiaShape,
  type RotationN2Params,
} from "@/lib/models/rotation-n2";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

export function RotationN2Lab({ slug }: { slug?: string } = {}) {
  const inertiaFocus = slug === "rotational-inertia";
  const [params, setParams] = useState(DEFAULT_ROTATION_N2);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t);
    return { sample: next, point: [0.32, 0.7 + next.y, 0] as [number, number, number] };
  }, [params]);
  const getLimit = useCallback(() => timeToFloor(params), [params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const I = theoryI(params);
  const a = linearAccel(params);
  const apply = (patch: Partial<RotationN2Params>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title={inertiaFocus ? "转动惯量测定" : "转动的牛顿第二定律"}
      subtitle={inertiaFocus ? "Physics Lab / I = ∫ r² dm" : "Physics Lab / τ = Iα"}
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "角加速度 α", value: n(sample.alpha), unit: "rad/s²" },
        { label: "力矩 τ", value: n(sample.tau), unit: "N·m" },
      ]}
      status={
        `τ = Tr = ${n(sample.tau)} N·m。I_理论 = ${n(I)} kg·m²，I_实验 = τ/α = ${n(sample.Iexp)} kg·m²。`
      }
      isPlaying={isPlaying}
      time={time}
      startLabel={time > 0 && sample.a === 0 && time >= timeToFloor(params) - 1e-6 ? "再放一次" : undefined}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ChoiceRow
            label="刚体"
            value={params.shape}
            options={INERTIA_SHAPES.map((item) => ({ id: item.id, label: item.label }))}
            onChange={(shape: InertiaShape) => apply({ shape })}
          />
          <ParameterControl id="M" label="刚体质量" symbol="M" unit="kg" value={params.M} min={0.3} max={3} step={0.05} onChange={(value) => apply({ M: value })} />
          {params.shape === "rod" ? (
            <ParameterControl key="L" id="L" label="杆长" symbol="L" unit="m" value={params.L} min={0.3} max={1} step={0.02} onChange={(value) => apply({ L: value })} />
          ) : (
            <ParameterControl key="R" id="R" label="半径" symbol="R" unit="m" value={params.R} min={0.08} max={0.28} step={0.01} onChange={(value) => apply({ R: value })} />
          )}
          <ParameterControl id="m" label="悬挂质量" symbol="m" unit="kg" value={params.m} min={0.08} max={0.8} step={0.02} onChange={(value) => apply({ m: value })} />
          <ParameterControl id="r" label="轴半径" symbol="r" unit="m" value={params.r} min={0.015} max={0.05} step={0.001} onChange={(value) => apply({ r: value })} />
          <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => apply({ g: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">{inertiaFocus ? "I = ∫ r² dm = τ/α" : "τ = Iα"}</p>
          <p>I = {n(I)} kg·m²</p>
          <p>a = mgr²/(I+mr²) = {n(a)} m/s²</p>
          <p className="text-navy">α = a/r = {n(sample.alpha)} rad/s²</p>
          <p>I_实验 = {n(sample.Iexp)} kg·m²</p>
        </>
      }
      sceneTitle="三维转轴"
      sceneCaption="悬挂砝码提供力矩　拖动旋转"
      scene={
        <SceneCanvas camera={[1.4, 1.1, 2.4]}>
          <RotationN2Scene params={params} sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "α", value: n(sample.alpha), unit: "rad/s²" },
        { label: "τ", value: n(sample.tau), unit: "N·m" },
        { label: "I", value: n(sample.I), unit: "kg·m²" },
        { label: "y", value: n(sample.y), unit: "m" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="角加速度" quantity="α" unit="rad/s²" strokeColor="#1E3A5F" valueKey="alpha" points={series} currentTime={time} currentValue={sample.alpha} minDuration={Math.max(timeToFloor(params), 1)} />
          <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#A16207" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} minDuration={Math.max(timeToFloor(params), 1)} />
          <TimeSeriesChart title="力矩" quantity="τ" unit="N·m" strokeColor="#2563EB" valueKey="tau" points={series} currentTime={time} currentValue={sample.tau} minDuration={Math.max(timeToFloor(params), 1)} />
          <TimeSeriesChart title="悬挂位移" quantity="s" unit="m" strokeColor="#6D28D9" valueKey="s" points={series} currentTime={time} currentValue={sample.s} minDuration={Math.max(timeToFloor(params), 1)} />
        </>
      }
    />
  );
}
