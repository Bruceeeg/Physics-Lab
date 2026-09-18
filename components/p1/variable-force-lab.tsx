"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { VariableForceScene } from "@/components/p1/variable-force-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_VARIABLE_FORCE,
  durationOf,
  sampleAt,
  type VariableForceMode,
  type VariableForceParams,
} from "@/lib/models/variable-force";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const MODES = [
  { id: "fx" as const, label: "F(x)" },
  { id: "ft" as const, label: "F(t)" },
  { id: "rocket" as const, label: "火箭 a(t)" },
  { id: "pulley" as const, label: "变角拉力" },
];

export function VariableForceLab() {
  const [params, setParams] = useState(DEFAULT_VARIABLE_FORCE);
  const [mode, setMode] = useState<VariableForceMode>("fx");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    const point: [number, number, number] =
      mode === "rocket" ? [0, 0.12 + next.y * 0.35, 0] : [next.x, mode === "pulley" ? 0.1 : 0.12, 0];
    return { sample: next, point };
  }, [mode, params]);
  const getLimit = useCallback(() => durationOf(params, mode), [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const apply = (patch: Partial<VariableForceParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="变力与微积分"
      subtitle="Physics Lab / W = ∫ F dx，J = ∫ F dt"
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
        { label: mode === "rocket" ? "高度 y" : "位置 x", value: n(mode === "rocket" ? sample.y : sample.x), unit: "m" },
        { label: "力 F", value: n(sample.F), unit: "N" },
      ]}
      status={
        mode === "fx"
          ? `F = −c |x|^n sgn(x)。n = 1 是胡克定律，W = ∫ F dx。E = ${n(sample.E)} J。`
          : mode === "ft"
            ? `F(t) = αt² + βt。J = ∫ F dt = Δp = ${n(sample.J)} N·s。y = 0.00 m。`
            : mode === "rocket"
              ? `燃烧段 a = K − Lt²，随后只受重力。J = mΔv = ${n(sample.J)} N·s。`
              : `绳拉力恒定，θ = arctan(H/x)。Fx = −T x/r，N = mg − T H/r。`
      }
      isPlaying={isPlaying}
      time={time}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        mode === "fx" ? (
          <>
            <ParameterControl id="c" label="力系数" symbol="c" unit="SI" value={params.c} min={5} max={120} step={1} onChange={(value) => apply({ c: value })} />
            <ParameterControl id="n" label="幂次" symbol="n" unit="" value={params.n} min={1} max={3} step={1} onChange={(value) => apply({ n: value })} />
            <ParameterControl id="A" label="初位移" symbol="A" unit="m" value={params.A} min={0.05} max={0.4} step={0.01} onChange={(value) => apply({ A: value })} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.1} max={2} step={0.05} onChange={(value) => apply({ m: value })} />
          </>
        ) : mode === "ft" ? (
          <>
            <ParameterControl id="alpha" label="二次系数" symbol="α" unit="N/s²" value={params.alpha} min={200} max={6000} step={50} onChange={(value) => apply({ alpha: value })} />
            <ParameterControl id="beta" label="一次系数" symbol="β" unit="N/s" value={params.beta} min={-2000} max={-50} step={10} onChange={(value) => apply({ beta: value })} />
            <ParameterControl id="v0" label="初速度" symbol="v₀" unit="m/s" value={params.v0} min={0} max={8} step={0.1} onChange={(value) => apply({ v0: value })} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.2} max={2} step={0.05} onChange={(value) => apply({ m: value })} />
          </>
        ) : mode === "rocket" ? (
          <>
            <ParameterControl id="K" label="初加速度" symbol="K" unit="m/s²" value={params.K} min={2} max={16} step={0.1} onChange={(value) => apply({ K: value })} />
            <ParameterControl id="Lcoeff" label="二次项" symbol="L" unit="m/s⁴" value={params.Lcoeff} min={0.05} max={0.6} step={0.01} onChange={(value) => apply({ Lcoeff: value })} />
            <ParameterControl id="tBurn" label="燃烧时间" symbol="tb" unit="s" value={params.tBurn} min={2} max={8} step={0.1} onChange={(value) => apply({ tBurn: value })} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.2} max={2} step={0.05} onChange={(value) => apply({ m: value })} />
            <ParameterControl id="g" label="重力加速度" symbol="g" unit="m/s²" value={params.g} min={1} max={20} step={0.01} onChange={(value) => apply({ g: value })} />
          </>
        ) : (
          <>
            <ParameterControl id="T" label="绳张力" symbol="T" unit="N" value={params.T} min={2} max={20} step={0.2} onChange={(value) => apply({ T: value })} />
            <ParameterControl id="H" label="锚点高度" symbol="H" unit="m" value={params.H} min={0.15} max={0.8} step={0.01} onChange={(value) => apply({ H: value })} />
            <ParameterControl id="x0" label="初位置" symbol="x₀" unit="m" value={params.x0} min={0.5} max={2} step={0.05} onChange={(value) => apply({ x0: value })} />
            <ParameterControl id="muK" label="动摩擦因数" symbol="μk" unit="" value={params.muK} min={0} max={0.6} step={0.02} onChange={(value) => apply({ muK: value })} />
            <ParameterControl id="m" label="质量" symbol="m" unit="kg" value={params.m} min={0.2} max={2} step={0.05} onChange={(value) => apply({ m: value })} />
          </>
        )
      }
      formula={
        mode === "fx" ? (
          <>
            <p className="text-quiet">F(x) = −c |x|^n sgn(x)，W = ∫ F dx</p>
            <p>n = {n(params.n)}　c = {n(params.c)}</p>
            <p className="text-navy">W = {n(sample.W)} J　E = {n(sample.E)} J</p>
            <p>y = 0.00 m　vy = 0.00 m/s</p>
          </>
        ) : mode === "ft" ? (
          <>
            <p className="text-quiet">J = ∫ F dt = Δp</p>
            <p>F = {n(sample.F)} N</p>
            <p className="text-navy">J = {n(sample.J)} N·s</p>
            <p>v = {n(sample.v)} m/s　y = 0.00 m</p>
          </>
        ) : mode === "rocket" ? (
          <>
            <p className="text-quiet">a = K − L t²　(t &lt; tb)，其后 a = −g</p>
            <p>v = {n(sample.v)} m/s　y = {n(sample.y)} m</p>
            <p className="text-navy">J = m v = {n(sample.J)} N·s</p>
            <p>K + U = {n(sample.E)} J</p>
          </>
        ) : (
          <>
            <p className="text-quiet">Fx = −T x / r　Fy = T H / r　r = √(x²+H²)</p>
            <p>N = mg − Fy = {n(sample.N)} N</p>
            <p className="text-navy">W_T = T Δr = {n(sample.W)} J</p>
            <p>fk = {n(sample.f)} N</p>
          </>
        )
      }
      sceneTitle="三维变力"
      sceneCaption="实线力矢量　拖动旋转"
      scene={
        <SceneCanvas camera={mode === "rocket" ? [1.2, 1.6, 2.6] : [1.6, 1.1, 2.6]}>
          <VariableForceScene params={params} sample={sample} trail={trail} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: mode === "rocket" ? "y" : "x", value: n(mode === "rocket" ? sample.y : sample.x), unit: "m" },
        { label: "v", value: n(sample.v), unit: "m/s" },
        { label: "F", value: n(sample.F), unit: "N" },
        { label: "J", value: n(sample.J), unit: "N·s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title={mode === "rocket" ? "高度" : "位置"} quantity={mode === "rocket" ? "y" : "x"} unit="m" strokeColor="#1E3A5F" valueKey={mode === "rocket" ? "y" : "x"} points={series} currentTime={time} currentValue={mode === "rocket" ? sample.y : sample.x} minDuration={Math.max(durationOf(params, mode), 1)} />
          <TimeSeriesChart title="速度" quantity="v" unit="m/s" strokeColor="#A16207" valueKey="v" points={series} currentTime={time} currentValue={sample.v} />
          <TimeSeriesChart title="力" quantity="F" unit="N" strokeColor="#2563EB" valueKey="F" points={series} currentTime={time} currentValue={sample.F} />
          <TimeSeriesChart title="冲量" quantity="J" unit="N·s" strokeColor="#6D28D9" valueKey="J" points={series} currentTime={time} currentValue={sample.J} />
        </>
      }
    />
  );
}
