"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ParticleModelOfLightScene } from "@/components/p2/particle-model-of-light-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_PHOTON,
  ELEM_CHARGE,
  PLANCK_H,
  sampleAt,
  type PhotonMode,
  type PhotonParams,
} from "@/lib/models/particle-model-of-light";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "led" as const, label: "LED 阈值" },
  { id: "photoelectric" as const, label: "光电效应" },
];

export function ParticleModelOfLightLab() {
  const [params, setParams] = useState(DEFAULT_PHOTON);
  const [mode, setMode] = useState<PhotonMode>("led");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [0.12, 0.12, 0] as [number, number, number] };
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute);
  const n = formatLabNumber;
  const photo = mode === "photoelectric";
  const set = (patch: Partial<PhotonParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };
  const KeV = sample.Kmax / ELEM_CHARGE;

  return (
    <LabFrame
      title="光的粒子模型"
      subtitle="Physics Lab / Unit 15 近代物理"
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
        { label: "频率 f", value: formatLabSci(sample.f), unit: "Hz" },
        { label: photo ? "Kmax" : "阈值电压", value: photo ? n(KeV) : n(sample.Vth), unit: photo ? "eV" : "V" },
      ]}
      status={
        photo
          ? sample.emits
            ? `Kmax = hf − φ = ${n(KeV)} eV。截止电压 ${n(sample.VstopPred)} V。`
            : `hf 小于逸出功 φ = ${n(params.phi_eV)} eV，没有光电子。`
          : sample.lit
            ? `eV = hf。阈值 ${n(sample.Vth)} V，由斜率可测 h = ${formatLabSci(sample.hMeas)} J·s。`
            : `外加电压低于阈值 ${n(sample.Vth)} V，LED 不亮。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl id="lambda" label="波长" symbol="λ" unit="nm" value={params.lambda_nm} min={380} max={700} step={5} onChange={(value) => set({ lambda_nm: value })} />
          {photo ? (
            <>
              <ParameterControl id="phi" label="逸出功" symbol="φ" unit="eV" value={params.phi_eV} min={1.5} max={3.2} step={0.05} onChange={(value) => set({ phi_eV: value })} />
              <ParameterControl id="Vstop" label="减速电压" symbol="V" unit="V" value={params.Vstop} min={0} max={3} step={0.05} onChange={(value) => set({ Vstop: value })} />
            </>
          ) : (
            <ParameterControl id="V" label="外加电压" symbol="V" unit="V" value={params.V} min={0.5} max={5} step={0.05} onChange={(value) => set({ V: value })} />
          )}
        </>
      }
      formula={
        photo ? (
          <>
            <p className="text-quiet">Kmax = hf − φ</p>
            <p>hf = {n((sample.f * PLANCK_H) / ELEM_CHARGE)} eV</p>
            <p className="text-navy">Kmax = {n(KeV)} eV</p>
            <p>Vs = {n(sample.VstopPred)} V</p>
          </>
        ) : (
          <>
            <p className="text-quiet">E = hf = e V_th</p>
            <p>Vth = {n(sample.Vth)} V</p>
            <p className="text-navy">h = {formatLabSci(sample.hMeas)} J·s</p>
            <p>I = {n(sample.I)} A</p>
          </>
        )
      }
      sceneTitle={photo ? "三维光电管" : "三维 LED"}
      sceneCaption="光子　拖动旋转"
      scene={
        <SceneCanvas camera={[0.45, 0.38, 0.95]} fov={42}>
          <ParticleModelOfLightScene sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        photo
          ? [
              { label: "f", value: formatLabSci(sample.f), unit: "Hz" },
              { label: "Kmax", value: n(KeV), unit: "eV" },
              { label: "Vs", value: n(sample.VstopPred), unit: "V" },
              { label: "I", value: formatLabSci(sample.I), unit: "A" },
            ]
          : [
              { label: "f", value: formatLabSci(sample.f), unit: "Hz" },
              { label: "Vth", value: n(sample.Vth), unit: "V" },
              { label: "I", value: n(sample.I), unit: "A" },
              { label: "h", value: formatLabSci(sample.hMeas), unit: "J·s" },
            ]
      }
      charts={
        photo ? (
          <>
            <TimeSeriesChart title="最大动能" quantity="Kmax" unit="J" strokeColor="#1E3A5F" valueKey="Kmax" points={series} currentTime={time} currentValue={sample.Kmax} />
            <TimeSeriesChart title="光电流" quantity="I" unit="A" strokeColor="#A16207" valueKey="I" points={series} currentTime={time} currentValue={sample.I} />
            <TimeSeriesChart title="截止电压" quantity="Vs" unit="V" strokeColor="#2563EB" valueKey="VstopPred" points={series} currentTime={time} currentValue={sample.VstopPred} />
            <TimeSeriesChart title="频率" quantity="f" unit="Hz" strokeColor="#6D28D9" valueKey="f" points={series} currentTime={time} currentValue={sample.f} />
          </>
        ) : (
          <>
            <TimeSeriesChart title="阈值电压" quantity="Vth" unit="V" strokeColor="#1E3A5F" valueKey="Vth" points={series} currentTime={time} currentValue={sample.Vth} />
            <TimeSeriesChart title="电流" quantity="I" unit="A" strokeColor="#A16207" valueKey="I" points={series} currentTime={time} currentValue={sample.I} />
            <TimeSeriesChart title="频率" quantity="f" unit="Hz" strokeColor="#2563EB" valueKey="f" points={series} currentTime={time} currentValue={sample.f} />
            <TimeSeriesChart title="普朗克常量" quantity="h" unit="J·s" strokeColor="#6D28D9" valueKey="hMeas" points={series} currentTime={time} currentValue={sample.hMeas} />
          </>
        )
      }
    />
  );
}
