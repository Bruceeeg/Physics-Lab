"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ChoiceRow, LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { LoopTrackScene } from "@/components/p1/loop-track-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import { ROLLING_SHAPES, type RollingShape } from "@/lib/models/rotational-motion";
import {
  canLoop,
  DEFAULT_LOOP,
  durationOf,
  minLoopHeight,
  sampleAt,
  type LoopMode,
  type LoopParams,
} from "@/lib/models/loop-track";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

export function LoopTrackLab() {
  const [params, setParams] = useState(DEFAULT_LOOP);
  const [mode, setMode] = useState<LoopMode>("slide");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [next.x, next.y + 0.06, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => durationOf(params), [params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const hMin = minLoopHeight(params, mode);
  const looping = canLoop(params, mode);
  const apply = (patch: Partial<LoopParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="圆环轨道"
      subtitle="Physics Lab / 过顶 v² ≥ gR"
      modes={
        <ModeSwitch
          value={mode}
          options={[
            { id: "slide" as const, label: "滑块" },
            { id: "roll" as const, label: "滚动" },
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
        { label: "支持力 N", value: n(sample.N), unit: "N" },
      ]}
      status={
        sample.left
          ? `N 降到 0，物体离开轨道。过顶至少需要 h = ${n(hMin)} m。`
          : looping
            ? `h ≥ ${n(hMin)} m，可以过顶。N = m(v²/R + g cosφ) = ${n(sample.N)} N。`
            : `高度不够。过顶最小高度 h = 2R + ½R(1+κ) = ${n(hMin)} m。`
      }
      statusError={sample.left}
      statusOk={looping && !sample.left}
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          {mode === "roll" ? (
            <ChoiceRow
              label="刚体"
              value={params.shape}
              options={ROLLING_SHAPES.map((item) => ({ id: item.id, label: item.label }))}
              onChange={(shape: RollingShape) => apply({ shape })}
            />
          ) : null}
          <ParameterControl id="h" label="释放高度" symbol="h" unit="m" value={params.h} min={0.4} max={2.4} step={0.02} onChange={(value) => apply({ h: value })} />
          <ParameterControl id="R" label="环半径" symbol="R" unit="m" value={params.R} min={0.2} max={0.6} step={0.01} onChange={(value) => apply({ R: value })} />
          <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => apply({ m: value })} />
          <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => apply({ g: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">{mode === "roll" ? "½mv²(1+κ) + mgy = mgh" : "½mv² + mgy = mgh"}</p>
          <p>过顶最小 h = {n(hMin)} m</p>
          <p>N = m(v²/R + g cosφ)</p>
          <p className="text-navy">N = {n(sample.N)} N　φ = {n((sample.phi * 180) / Math.PI)}°</p>
        </>
      }
      sceneTitle="三维圆环"
      sceneCaption="底部 φ = 0　顶部 φ = 180°　拖动旋转"
      scene={
        <SceneCanvas camera={[1.6, 1.3, 2.8]}>
          <LoopTrackScene params={params} sample={sample} trail={trail} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: "v", value: n(sample.v), unit: "m/s" },
        { label: "N", value: n(sample.N), unit: "N" },
        { label: "K", value: n(sample.K), unit: "J" },
        { label: "y", value: n(sample.y), unit: "m" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="速率" quantity="v" unit="m/s" strokeColor="#1E3A5F" valueKey="v" points={series} currentTime={time} currentValue={sample.v} minDuration={Math.max(durationOf(params), 1)} />
          <TimeSeriesChart title="支持力" quantity="N" unit="N" strokeColor="#A16207" valueKey="N" points={series} currentTime={time} currentValue={sample.N} />
          <TimeSeriesChart title="高度" quantity="y" unit="m" strokeColor="#2563EB" valueKey="y" points={series} currentTime={time} currentValue={sample.y} />
          <TimeSeriesChart title="动能" quantity="K" unit="J" strokeColor="#6D28D9" valueKey="K" points={series} currentTime={time} currentValue={sample.K} />
        </>
      }
    />
  );
}
