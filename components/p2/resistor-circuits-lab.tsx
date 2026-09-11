"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ResistorCircuitsScene } from "@/components/p2/resistor-circuits-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_RESISTOR,
  sampleAt,
  type ResistorMode,
  type ResistorParams,
} from "@/lib/models/resistor-circuits";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "series" as const, label: "串联" },
  { id: "parallel" as const, label: "并联" },
];

export function ResistorCircuitsLab() {
  const [params, setParams] = useState(DEFAULT_RESISTOR);
  const [mode, setMode] = useState<ResistorMode>("series");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0, 0.08, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const seriesMode = mode === "series";
  const invalid = params.R1 <= 0 || params.R2 <= 0 || params.R3 <= 0;
  const set = (patch: Partial<ResistorParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="电阻电路"
      subtitle="Physics Lab / Unit 11 电路"
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
        { label: "总电流 I", value: n(sample.I), unit: "A" },
        { label: "等效电阻", value: n(sample.Req), unit: "Ω" },
      ]}
      status={
        invalid
          ? "电阻必须为正。"
          : seriesMode
            ? `串联电流相同。V1+V2+V3 = ${n(sample.V1 + sample.V2 + sample.V3)} V，等于电源电动势。`
            : `并联电压相同。I1+I2+I3 = ${n(sample.I)} A，结点电流代数和为零。`
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
          <ParameterControl id="emf" label="电源电动势" symbol="ε" unit="V" value={params.emf} min={1} max={24} step={0.5} onChange={(value) => set({ emf: value })} />
          <ParameterControl id="R1" label="电阻 1" symbol="R1" unit="Ω" value={params.R1} min={2} max={80} step={1} onChange={(value) => set({ R1: value })} />
          <ParameterControl id="R2" label="电阻 2" symbol="R2" unit="Ω" value={params.R2} min={2} max={80} step={1} onChange={(value) => set({ R2: value })} />
          <ParameterControl id="R3" label="电阻 3" symbol="R3" unit="Ω" value={params.R3} min={2} max={80} step={1} onChange={(value) => set({ R3: value })} />
        </>
      }
      formula={
        seriesMode ? (
          <>
            <p className="text-quiet">ΣV = 0，I 相同</p>
            <p>Req = {n(sample.Req)} Ω</p>
            <p>I = {n(sample.I)} A</p>
            <p className="text-navy">V1+V2+V3 = {n(sample.V1 + sample.V2 + sample.V3)} V</p>
          </>
        ) : (
          <>
            <p className="text-quiet">ΣI = 0，V 相同</p>
            <p>Req = {n(sample.Req)} Ω</p>
            <p>I = {n(sample.I)} A</p>
            <p className="text-navy">I1+I2+I3 = {n(sample.I1 + sample.I2 + sample.I3)} A</p>
          </>
        )
      }
      sceneTitle={seriesMode ? "三维串联板" : "三维并联板"}
      sceneCaption="基尔霍夫　拖动旋转"
      scene={
        <SceneCanvas camera={[0.35, 0.55, 0.95]} fov={42}>
          <ResistorCircuitsScene sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        seriesMode
          ? [
              { label: "I", value: n(sample.I), unit: "A" },
              { label: "V1", value: n(sample.V1), unit: "V" },
              { label: "V2", value: n(sample.V2), unit: "V" },
              { label: "V3", value: n(sample.V3), unit: "V" },
            ]
          : [
              { label: "I", value: n(sample.I), unit: "A" },
              { label: "I1", value: n(sample.I1), unit: "A" },
              { label: "I2", value: n(sample.I2), unit: "A" },
              { label: "I3", value: n(sample.I3), unit: "A" },
            ]
      }
      charts={
        <>
          <TimeSeriesChart title="总电流" quantity="I" unit="A" strokeColor="#1E3A5F" valueKey="I" points={series} currentTime={time} currentValue={sample.I} />
          <TimeSeriesChart title="功率" quantity="P" unit="W" strokeColor="#A16207" valueKey="P" points={series} currentTime={time} currentValue={sample.P} />
          <TimeSeriesChart title={seriesMode ? "V1" : "I1"} quantity={seriesMode ? "V1" : "I1"} unit={seriesMode ? "V" : "A"} strokeColor="#2563EB" valueKey={seriesMode ? "V1" : "I1"} points={series} currentTime={time} currentValue={seriesMode ? sample.V1 : sample.I1} />
          <TimeSeriesChart title={seriesMode ? "V2" : "I2"} quantity={seriesMode ? "V2" : "I2"} unit={seriesMode ? "V" : "A"} strokeColor="#6D28D9" valueKey={seriesMode ? "V2" : "I2"} points={series} currentTime={time} currentValue={seriesMode ? sample.V2 : sample.I2} />
        </>
      }
    />
  );
}
