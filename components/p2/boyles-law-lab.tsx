"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { BoylesLawScene } from "@/components/p2/boyles-law-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  BOYLE_DURATION,
  DEFAULT_BOYLE,
  sampleAt,
  type BoyleMode,
  type BoyleParams,
} from "@/lib/models/boyles-law";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "isothermal" as const, label: "等温压缩" },
  { id: "work" as const, label: "P-V 做功" },
];

export function BoylesLawLab() {
  const [params, setParams] = useState(DEFAULT_BOYLE);
  const [mode, setMode] = useState<BoyleMode>("isothermal");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0, 0.16 + 0.004 * next.Vcm3, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => BOYLE_DURATION, []);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const work = mode === "work";
  const set = (patch: Partial<BoyleParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="玻意耳定律"
      subtitle="Physics Lab / Unit 9 热力学"
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
        { label: "体积 V", value: n(sample.Vcm3), unit: "cm³" },
        { label: "压强 P", value: n(sample.PkPa), unit: "kPa" },
      ]}
      status={
        work
          ? `等温压缩对气体做功 W = nRT ln(V₀/V) = ${formatLabSci(sample.W)} J，等于 P-V 图线下的面积。`
          : `封闭气体等温，PV = nRT = ${formatLabSci(sample.PV)} J，保持不变。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="n" label="物质的量" symbol="n" unit="mol" value={params.n} min={0.001} max={0.01} step={0.0005} onChange={(value) => set({ n: value })} />
          <ParameterControl id="T" label="温度" symbol="T" unit="K" value={params.T} min={250} max={400} step={1} onChange={(value) => set({ T: value })} />
          <ParameterControl id="V0" label="初体积" symbol="V₀" unit="cm³" value={params.V0_cm3} min={40} max={160} step={1} onChange={(value) => set({ V0_cm3: value })} />
          <ParameterControl id="Vf" label="末体积" symbol="Vf" unit="cm³" value={params.Vf_cm3} min={20} max={140} step={1} onChange={(value) => set({ Vf_cm3: value })} />
        </>
      }
      formula={
        <>
          <p className="text-quiet">PV = nRT</p>
          <p>P = {n(sample.PkPa)} kPa</p>
          <p>V = {n(sample.Vcm3)} cm³</p>
          <p className="text-navy">{work ? `W = ${formatLabSci(sample.W)} J` : `PV = ${formatLabSci(sample.PV)} J`}</p>
        </>
      }
      sceneTitle="三维注射器"
      sceneCaption="等温　拖动旋转"
      scene={
        <SceneCanvas camera={[0.55, 0.42, 1.15]} fov={42}>
          <BoylesLawScene params={params} sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "V", value: n(sample.Vcm3), unit: "cm³" },
        { label: "P", value: n(sample.PkPa), unit: "kPa" },
        { label: "PV", value: formatLabSci(sample.PV), unit: "J" },
        { label: "W", value: formatLabSci(sample.W), unit: "J" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="体积" quantity="V" unit="cm³" strokeColor="#1E3A5F" valueKey="Vcm3" points={series} currentTime={time} currentValue={sample.Vcm3} minDuration={BOYLE_DURATION} />
          <TimeSeriesChart title="压强" quantity="P" unit="kPa" strokeColor="#A16207" valueKey="PkPa" points={series} currentTime={time} currentValue={sample.PkPa} minDuration={BOYLE_DURATION} />
          <TimeSeriesChart title="PV" quantity="PV" unit="J" strokeColor="#2563EB" valueKey="PV" points={series} currentTime={time} currentValue={sample.PV} minDuration={BOYLE_DURATION} />
          <TimeSeriesChart title="做功" quantity="W" unit="J" strokeColor="#6D28D9" valueKey="W" points={series} currentTime={time} currentValue={sample.W} minDuration={BOYLE_DURATION} />
        </>
      }
    />
  );
}
