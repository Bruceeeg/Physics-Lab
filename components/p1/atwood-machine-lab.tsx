"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { AtwoodMachineScene } from "@/components/p1/atwood-machine-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  acceleration,
  DEFAULT_ATWOOD,
  sampleAt,
  tension,
  timeToStop,
  type AtwoodMode,
  type AtwoodParams,
} from "@/lib/models/atwood-machine";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const ATWOOD_MODES = [
  { id: "classic" as const, label: "经典双吊" },
  { id: "modified" as const, label: "桌上滑车" },
];

export function AtwoodMachineLab() {
  const [params, setParams] = useState(DEFAULT_ATWOOD);
  const [mode, setMode] = useState<AtwoodMode>("classic");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0.12, 1.25 - 0.45 + next.y2, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => {
    const limit = timeToStop(params, mode);
    return Number.isFinite(limit) ? limit : null;
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const a = acceleration(params, mode);
  const T = tension(params, mode);
  const modified = mode === "modified";
  const stuck = Math.abs(a) < 1e-9;

  return (
    <LabFrame
      title="阿特伍德机"
      subtitle="Physics Lab / 力与平动"
      modes={
        <ModeSwitch
          value={mode}
          options={ATWOOD_MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "加速度 a", value: n(a), unit: "m/s²" },
        { label: "张力 T", value: n(T), unit: "N" },
      ]}
      status={
        stuck
          ? modified
            ? "悬挂重量不足以克服摩擦，系统保持静止。"
            : "两质量相等，系统保持静止。"
          : modified
            ? `桌上滑车。a = (m₂g − μ m₁g)/(m₁+m₂) = ${n(a)} m/s²。`
            : `a = gΔm/(m₁+m₂) = ${n(a)} m/s²。右侧为 m₂，较重则下降。`
      }
      isPlaying={isPlaying}
      time={time}
      startDisabled={stuck}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl
            id="m1"
            label={modified ? "车上质量" : "左侧质量"}
            symbol="m₁"
            unit="kg"
            value={params.m1}
            min={0.2}
            max={3}
            step={0.05}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, m1: value }));
            }}
          />
          <ParameterControl
            id="m2"
            label={modified ? "悬挂质量" : "右侧质量"}
            symbol="m₂"
            unit="kg"
            value={params.m2}
            min={0.2}
            max={3}
            step={0.05}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, m2: value }));
            }}
          />
          {modified ? (
            <ParameterControl
              id="mu"
              label="动摩擦因数"
              symbol="μ"
              unit=""
              value={params.mu ?? 0}
              min={0}
              max={0.8}
              step={0.02}
              onChange={(value) => {
                reset();
                setParams((current) => ({ ...current, mu: value }));
              }}
            />
          ) : null}
          <ParameterControl
            id="travel"
            label="行程"
            symbol="s_max"
            unit="m"
            value={params.travel}
            min={0.2}
            max={0.8}
            step={0.01}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, travel: value }));
            }}
          />
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
        modified ? (
          <>
            <p className="text-quiet">a = (m₂g − μ m₁g)/(m₁+m₂)</p>
            <p className="text-navy">a = {n(a)} m/s²</p>
            <p>T = m₂(g − a) = {n(T)} N</p>
            <p>s = {n(sample.s)} m</p>
          </>
        ) : (
          <>
            <p className="text-quiet">a = g(m₂−m₁)/(m₁+m₂)</p>
            <p className="text-navy">a = {n(a)} m/s²</p>
            <p>T = 2 m₁ m₂ g / (m₁+m₂) = {n(T)} N</p>
            <p>s₂ = {n(sample.s)} m</p>
          </>
        )
      }
      sceneTitle={modified ? "三维桌上滑车" : "三维阿特伍德机"}
      sceneCaption={modified ? "蓝车 m₁　金块 m₂　拖动旋转" : "蓝 m₁　金 m₂　拖动旋转"}
      scene={
        <SceneCanvas camera={[1.6, 1.1, 2.8]}>
          <AtwoodMachineScene sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: modified ? "x车" : "y₁", value: n(sample.y1), unit: "m" },
        { label: modified ? "y挂" : "y₂", value: n(sample.y2), unit: "m" },
        { label: "v₂", value: n(sample.v2), unit: "m/s" },
        { label: "T", value: n(sample.T), unit: "N" },
      ]}
      charts={
        <>
          <TimeSeriesChart title={modified ? "车位移" : "右侧位移"} quantity="s" unit="m" strokeColor="#1E3A5F" valueKey="s" points={series} currentTime={time} currentValue={sample.s} minDuration={Math.max(1, Number.isFinite(timeToStop(params, mode)) ? timeToStop(params, mode) : 4)} />
          <TimeSeriesChart title="速度" quantity="v₂" unit="m/s" strokeColor="#A16207" valueKey="v2" points={series} currentTime={time} currentValue={sample.v2} />
          <TimeSeriesChart title="加速度" quantity="a" unit="m/s²" strokeColor="#2563EB" valueKey="a" points={series} currentTime={time} currentValue={sample.a} />
          <TimeSeriesChart title="张力" quantity="T" unit="N" strokeColor="#6D28D9" valueKey="T" points={series} currentTime={time} currentValue={sample.T} />
        </>
      }
    />
  );
}
