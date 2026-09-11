"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { ElectricFieldScene } from "@/components/p2/electric-field-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_ELECTRIC,
  FIELD_DURATION,
  sampleAt,
  type ElectricMode,
  type ElectricParams,
} from "@/lib/models/electric-field";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "point" as const, label: "点电荷" },
  { id: "dipole" as const, label: "电偶极" },
  { id: "gauss" as const, label: "高斯球面" },
  { id: "pith" as const, label: "悬挂库仑" },
  { id: "equipotential" as const, label: "等势线" },
];

function initialElectricMode(slug?: string): ElectricMode {
  if (slug === "coulombs-law") {
    return "pith";
  }
  if (slug === "equipotential") {
    return "equipotential";
  }
  return "point";
}

function initialElectricParams(slug?: string): ElectricParams {
  if (slug === "coulombs-law") {
    return { ...DEFAULT_ELECTRIC, Q_uC: 0.08 };
  }
  return DEFAULT_ELECTRIC;
}

export function ElectricFieldLab({ slug }: { slug?: string } = {}) {
  const [params, setParams] = useState(initialElectricParams(slug));
  const [mode, setMode] = useState<ElectricMode>(initialElectricMode(slug));
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    return { sample: next, point: [next.r, 0.08, 0] as [number, number, number] };
  }, [mode, params]);
  const getLimit = useCallback(() => FIELD_DURATION, []);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const dipole = mode === "dipole";
  const gauss = mode === "gauss";
  const pith = mode === "pith";
  const equip = mode === "equipotential";
  const set = (patch: Partial<ElectricParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title={pith ? "库仑定律" : equip ? "等势线与电场" : "电场与电势"}
      subtitle={pith ? "Physics Lab / F = kq₁q₂/r²" : gauss ? "Physics Lab / ∮E·dA = Q/ε₀" : "Physics Lab / Unit 10 电场与电势"}
      modes={
        <ModeSwitch
          value={mode}
          options={MODES}
          onChange={(next) => {
            reset();
            setMode(next);
            if (next === "pith") {
              setParams((current) => (current.Q_uC > 0.2 ? { ...current, Q_uC: 0.08 } : current));
            } else if (mode === "pith" && params.Q_uC < 0.4) {
              setParams((current) => ({ ...current, Q_uC: 2 }));
            }
          }}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "距离 r", value: n(sample.r), unit: "m" },
        { label: "电场 E", value: formatLabSci(sample.E), unit: "N/C" },
      ]}
      status={
        pith
          ? `两球相斥。r = ${n(sample.r)} m，θ = ${n((sample.theta * 180) / Math.PI)}°，F = ${formatLabSci(sample.F)} N。`
          : gauss
            ? sample.Qenc === 0
              ? `探针在导体球内部，E = 0，Φ = 0。`
              : `球外 E = kQ/r²，Φ = Q/ε₀ = ${formatLabSci(sample.flux)} N·m²/C。`
          : equip
            ? `等势线是同心圆。E = −dV/dr = ${formatLabSci(sample.E)} N/C，垂直于等势线。`
          : dipole
            ? `轴上叠加：Ex = kQ/(r+d/2)² − kQ/(r−d/2)² = ${formatLabSci(sample.Ex)} N/C，指向 −Q。`
            : `E = k|Q|/r² = ${formatLabSci(sample.E)} N/C，V = kQ/r = ${formatLabSci(sample.V)} V。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        pith ? (
          <>
            <ParameterControl key="pith-Q" id="Q" label="电荷量" symbol="q" unit="μC" value={params.Q_uC} min={0.02} max={0.2} step={0.005} onChange={(value) => set({ Q_uC: value })} />
            <ParameterControl key="pith-m" id="m" label="球质量" symbol="m" unit="g" value={(params.pithM ?? 0.004) * 1000} min={1} max={12} step={0.5} onChange={(value) => set({ pithM: value / 1000 })} />
            <ParameterControl key="pith-L" id="L" label="悬线长" symbol="L" unit="cm" value={params.pithL_cm ?? 50} min={20} max={80} step={1} onChange={(value) => set({ pithL_cm: value })} />
          </>
        ) : (
          <>
            <ParameterControl key={`${mode}-Q`} id="Q" label="源电荷" symbol="Q" unit="μC" value={params.Q_uC} min={0.4} max={6} step={0.1} onChange={(value) => set({ Q_uC: value })} />
            {gauss ? (
              <ParameterControl key="gauss-R" id="R" label="导体球半径" symbol="R" unit="cm" value={params.R_cm ?? 10} min={4} max={18} step={0.5} onChange={(value) => set({ R_cm: value })} />
            ) : (
              <ParameterControl key={`${mode}-q`} id="q" label="试探电荷" symbol="q" unit="nC" value={params.q_nC} min={0.2} max={8} step={0.1} onChange={(value) => set({ q_nC: value })} />
            )}
            <ParameterControl key={`${mode}-r0`} id="r0" label="探针起点" symbol="r₀" unit="cm" value={params.r0_cm} min={gauss ? 2 : 8} max={24} step={0.5} onChange={(value) => set({ r0_cm: value })} />
            <ParameterControl key={`${mode}-r1`} id="r1" label="探针终点" symbol="r₁" unit="cm" value={params.r1_cm} min={8} max={40} step={0.5} onChange={(value) => set({ r1_cm: value })} />
            {dipole ? (
              <ParameterControl key="dipole-d" id="d" label="电荷间距" symbol="d" unit="cm" value={params.d_cm} min={4} max={16} step={0.5} onChange={(value) => set({ d_cm: value })} />
            ) : null}
          </>
        )
      }
      formula={
        pith ? (
          <>
            <p className="text-quiet">tanθ = F / mg，F = kq² / r²</p>
            <p>r = {n(sample.r)} m</p>
            <p>θ = {n((sample.theta * 180) / Math.PI)} °</p>
            <p className="text-navy">F = {formatLabSci(sample.F)} N</p>
          </>
        ) : gauss ? (
          <>
            <p className="text-quiet">∮ E·dA = Q_enc / ε₀</p>
            <p>Q_enc = {formatLabSci(sample.Qenc)} C</p>
            <p>Φ = {formatLabSci(sample.flux)} N·m²/C</p>
            <p className="text-navy">E = {formatLabSci(sample.E)} N/C</p>
          </>
        ) : equip ? (
          <>
            <p className="text-quiet">E = −∇V = −dV/dr</p>
            <p>V = {formatLabSci(sample.V)} V</p>
            <p className="text-navy">E = {formatLabSci(sample.E)} N/C</p>
            <p>r = {n(sample.r)} m</p>
          </>
        ) : dipole ? (
          <>
            <p className="text-quiet">E = kQ/r² 叠加</p>
            <p>Ex = {formatLabSci(sample.Ex)} N/C</p>
            <p>V = {formatLabSci(sample.V)} V</p>
            <p className="text-navy">F = qEx = {formatLabSci(sample.F)} N</p>
          </>
        ) : (
          <>
            <p className="text-quiet">E = kQ / r²，V = kQ / r</p>
            <p>E = {formatLabSci(sample.E)} N/C</p>
            <p>V = {formatLabSci(sample.V)} V</p>
            <p className="text-navy">F = qE = {formatLabSci(sample.F)} N</p>
          </>
        )
      }
      sceneTitle={pith ? "三维悬挂库仑" : gauss ? "三维高斯球面" : equip ? "三维等势线" : dipole ? "三维电偶极" : "三维点电荷"}
      sceneCaption={pith ? "张角由库仑力决定　拖动旋转" : gauss ? "导体内 E = 0　拖动旋转" : "探针扫径　拖动旋转"}
      scene={
        <SceneCanvas camera={pith ? [0.35, 0.85, 1.55] : [0.55, 0.38, 1.05]} fov={42}>
          <ElectricFieldScene params={params} sample={sample} mode={mode} />
        </SceneCanvas>
      }
      readouts={
        pith
          ? [
              { label: "r", value: n(sample.r), unit: "m" },
              { label: "θ", value: n((sample.theta * 180) / Math.PI), unit: "°" },
              { label: "F", value: formatLabSci(sample.F), unit: "N" },
              { label: "q", value: formatLabSci(sample.Q), unit: "C" },
            ]
          : gauss
            ? [
                { label: "r", value: n(sample.r), unit: "m" },
                { label: "E", value: formatLabSci(sample.E), unit: "N/C" },
                { label: "Φ", value: formatLabSci(sample.flux), unit: "N·m²/C" },
                { label: "Qenc", value: formatLabSci(sample.Qenc), unit: "C" },
              ]
            : [
                { label: "r", value: n(sample.r), unit: "m" },
                { label: "E", value: formatLabSci(sample.E), unit: "N/C" },
                { label: "V", value: formatLabSci(sample.V), unit: "V" },
                { label: "F", value: formatLabSci(sample.F), unit: "N" },
              ]
      }
      charts={
        <>
          <TimeSeriesChart title="电场" quantity="E" unit="N/C" strokeColor="#1E3A5F" valueKey="E" points={series} currentTime={time} currentValue={sample.E} minDuration={FIELD_DURATION} />
          <TimeSeriesChart title="电势" quantity="V" unit="V" strokeColor="#A16207" valueKey="V" points={series} currentTime={time} currentValue={sample.V} minDuration={FIELD_DURATION} />
          <TimeSeriesChart title="电场力" quantity="F" unit="N" strokeColor="#2563EB" valueKey="F" points={series} currentTime={time} currentValue={sample.F} minDuration={FIELD_DURATION} />
          <TimeSeriesChart title="距离" quantity="r" unit="m" strokeColor="#6D28D9" valueKey="r" points={series} currentTime={time} currentValue={sample.r} minDuration={FIELD_DURATION} />
        </>
      }
    />
  );
}
