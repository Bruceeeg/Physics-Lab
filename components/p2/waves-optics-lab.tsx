"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { WavesOpticsScene } from "@/components/p2/waves-optics-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_WAVES,
  sampleAt,
  type WavesMode,
  type WavesParams,
} from "@/lib/models/waves-optics";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "standing" as const, label: "驻波" },
  { id: "doubleslit" as const, label: "双缝" },
];

export function WavesOpticsLab() {
  const [params, setParams] = useState(DEFAULT_WAVES);
  const [mode, setMode] = useState<WavesMode>("standing");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0, 0.16 + next.y, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const slit = mode === "doubleslit";
  const set = (patch: Partial<WavesParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="波与物理光学"
      subtitle="Physics Lab / Unit 14 波与物理光学"
      modes={
        <ModeSwitch
          value={mode}
          options={MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: slit ? "纹距 Δy" : "波长 λ", value: slit ? formatLabSci(sample.deltaY) : n(sample.lambda), unit: slit ? "m" : "m" },
        { label: slit ? "中央光强" : "频率 f", value: slit ? n(sample.I) : n(sample.f), unit: slit ? "" : "Hz" },
      ]}
      status={
        slit
          ? `双缝亮纹间距 Δy = λL/d = ${formatLabSci(sample.deltaY)} m。减小 d 或增大 λ，条纹变疏。`
          : `第 ${params.n} 谐波 λ = 2L/n = ${n(sample.lambda)} m，v = fλ = ${n(sample.v)} m/s。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        slit ? (
          <>
            <ParameterControl id="lambda" label="波长" symbol="λ" unit="nm" value={params.lambda_nm} min={380} max={700} step={5} onChange={(value) => set({ lambda_nm: value })} />
            <ParameterControl id="d" label="缝距" symbol="d" unit="mm" value={params.d_mm} min={0.1} max={0.8} step={0.01} onChange={(value) => set({ d_mm: value })} />
            <ParameterControl id="L" label="屏距" symbol="L" unit="m" value={params.screen_m} min={0.4} max={2.5} step={0.05} onChange={(value) => set({ screen_m: value })} />
          </>
        ) : (
          <>
            <ParameterControl id="L" label="弦长" symbol="L" unit="m" value={params.L} min={0.4} max={1.4} step={0.02} onChange={(value) => set({ L: value })} />
            <ParameterControl id="n" label="谐波" symbol="n" unit="" value={params.n} min={1} max={5} step={1} onChange={(value) => set({ n: value })} />
            <ParameterControl id="T" label="张力" symbol="T" unit="N" value={params.tension} min={10} max={80} step={1} onChange={(value) => set({ tension: value })} />
            <ParameterControl id="mu" label="线密度" symbol="μ" unit="kg/m" value={params.mu} min={0.004} max={0.04} step={0.001} onChange={(value) => set({ mu: value })} />
          </>
        )
      }
      formula={
        slit ? (
          <>
            <p className="text-quiet">Δy = λ L / d</p>
            <p className="text-navy">Δy = {formatLabSci(sample.deltaY)} m</p>
            <p>λ = {n(params.lambda_nm)} nm</p>
          </>
        ) : (
          <>
            <p className="text-quiet">v = fλ，λ = 2L/n</p>
            <p>v = {n(sample.v)} m/s</p>
            <p className="text-navy">f = {n(sample.f)} Hz</p>
          </>
        )
      }
      sceneTitle={slit ? "三维双缝" : "三维驻波"}
      sceneCaption={slit ? "干涉条纹　拖动旋转" : "弦驻波　拖动旋转"}
      scene={
        <SceneCanvas camera={[0.4, 0.45, 1.35]} fov={42}>
          <WavesOpticsScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        slit
          ? [
              { label: "λ", value: n(params.lambda_nm), unit: "nm" },
              { label: "Δy", value: formatLabSci(sample.deltaY), unit: "m" },
              { label: "I", value: n(sample.I), unit: "" },
              { label: "d", value: n(params.d_mm), unit: "mm" },
            ]
          : [
              { label: "λ", value: n(sample.lambda), unit: "m" },
              { label: "f", value: n(sample.f), unit: "Hz" },
              { label: "v", value: n(sample.v), unit: "m/s" },
              { label: "n", value: n(params.n), unit: "" },
            ]
      }
      charts={
        slit ? (
          <>
            <TimeSeriesChart title="纹距" quantity="Δy" unit="m" strokeColor="#1E3A5F" valueKey="deltaY" points={series} currentTime={time} currentValue={sample.deltaY} />
            <TimeSeriesChart title="中央光强" quantity="I" unit="" strokeColor="#A16207" valueKey="I" points={series} currentTime={time} currentValue={sample.I} />
            <TimeSeriesChart title="波长" quantity="λ" unit="m" strokeColor="#2563EB" valueKey="lambda" points={series} currentTime={time} currentValue={sample.lambda} />
            <TimeSeriesChart title="屏上 y" quantity="y" unit="m" strokeColor="#6D28D9" valueKey="y" points={series} currentTime={time} currentValue={sample.y} />
          </>
        ) : (
          <>
            <TimeSeriesChart title="腹点位移" quantity="y" unit="m" strokeColor="#1E3A5F" valueKey="y" points={series} currentTime={time} currentValue={sample.y} minDuration={Math.max(2 / Math.max(sample.f, 0.2), 1)} />
            <TimeSeriesChart title="频率" quantity="f" unit="Hz" strokeColor="#A16207" valueKey="f" points={series} currentTime={time} currentValue={sample.f} />
            <TimeSeriesChart title="波长" quantity="λ" unit="m" strokeColor="#2563EB" valueKey="lambda" points={series} currentTime={time} currentValue={sample.lambda} />
            <TimeSeriesChart title="波速" quantity="v" unit="m/s" strokeColor="#6D28D9" valueKey="v" points={series} currentTime={time} currentValue={sample.v} />
          </>
        )
      }
    />
  );
}
