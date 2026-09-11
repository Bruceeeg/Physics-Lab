"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { TorqueEquilibriumScene } from "@/components/p1/torque-equilibrium-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_TORQUE,
  netTorque,
  sampleAt,
  timeToTip,
  type TorqueParams,
} from "@/lib/models/torque-equilibrium";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: keyof TorqueParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "M", label: "米尺质量", symbol: "M", unit: "kg", min: 0.05, max: 0.6, step: 0.01 },
  { key: "L", label: "米尺长度", symbol: "L", unit: "m", min: 0.6, max: 1.4, step: 0.02 },
  { key: "f", label: "支点离左端", symbol: "f", unit: "m", min: 0.12, max: 1.2, step: 0.01 },
  { key: "m", label: "悬挂质量", symbol: "m", unit: "kg", min: 0.02, max: 0.6, step: 0.01 },
  { key: "x", label: "悬挂位置", symbol: "x", unit: "m", min: 0.05, max: 1.35, step: 0.01 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

export function TorqueEquilibriumLab() {
  const [params, setParams] = useState(DEFAULT_TORQUE);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t);
    return { sample: next, point: [0, 0.46, 0] as [number, number, number] };
  }, [params]);
  const getLimit = useCallback(() => {
    const limit = timeToTip(params);
    return Number.isFinite(limit) ? limit : null;
  }, [params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const tau = netTorque(params);
  const offStick = params.f >= params.L - 0.04 || params.f <= 0.04;
  const offHang = params.x < 0.02 || params.x > params.L - 0.02;
  const invalid = offStick || offHang;

  return (
    <LabFrame
      title="力矩平衡"
      subtitle="Physics Lab / Unit 5 力矩与转动动力学"
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "净力矩 Στ", value: n(sample.tau), unit: "N·m" },
        { label: "转角 θ", value: n((sample.theta * 180) / Math.PI), unit: "°" },
      ]}
      status={
        invalid
          ? "支点或悬挂点必须落在米尺上。减小 x、f，或增大 L。"
          : sample.balanced
            ? "Στ = 0，米尺保持水平。改变 m、x 或 f 可打破平衡。"
            : sample.tipped
              ? `已向 ${tau < 0 ? "右" : "左"} 侧倾倒。Στ = ${n(tau)} N·m。`
              : `未平衡。α = τ/I = ${n(sample.alpha)} rad/s²，较重的一侧向下。`
      }
      statusError={invalid}
      isPlaying={isPlaying}
      time={time}
      startDisabled={invalid || sample.balanced}
      startLabel={sample.tipped ? "再放一次" : time > 0 ? "继续" : "开始"}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={PARAMETER_DEFINITIONS.map((item) => (
        <ParameterControl
          key={item.key}
          id={item.key}
          label={item.label}
          symbol={item.symbol}
          unit={item.unit}
          value={params[item.key]}
          min={item.min}
          max={item.max}
          step={item.step}
          invalid={
            (item.key === "f" && offStick) || (item.key === "x" && offHang) || (item.key === "L" && invalid)
          }
          onChange={(value) => {
            reset();
            setParams((current) => ({ ...current, [item.key]: value }));
          }}
        />
      ))}
      formula={
        <>
          <p className="text-quiet">Στ = −Mg(L/2 − f) − mg(x − f)</p>
          <p>τ尺 = {n(sample.tauStick)} N·m</p>
          <p>τ挂 = {n(sample.tauHang)} N·m</p>
          <p className="text-navy">Στ = {n(sample.tau)} N·m</p>
          <p>I = {n(sample.I)} kg·m²</p>
        </>
      }
      sceneTitle="三维米尺平衡"
      sceneCaption="实线 重力　水平分力 0.00 N　拖动旋转"
      scene={
        <SceneCanvas camera={[1.1, 0.7, 1.8]} fov={42}>
          <TorqueEquilibriumScene params={params} sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "Στ", value: n(sample.tau), unit: "N·m" },
        { label: "θ", value: n((sample.theta * 180) / Math.PI), unit: "°" },
        { label: "ω", value: n(sample.omega), unit: "rad/s" },
        { label: "I", value: n(sample.I), unit: "kg·m²" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="净力矩" quantity="Στ" unit="N·m" strokeColor="#1E3A5F" valueKey="tau" points={series} currentTime={time} currentValue={sample.tau} />
          <TimeSeriesChart title="转角" quantity="θ" unit="rad" strokeColor="#A16207" valueKey="theta" points={series} currentTime={time} currentValue={sample.theta} />
          <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#2563EB" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} />
          <TimeSeriesChart title="角加速度" quantity="α" unit="rad/s²" strokeColor="#6D28D9" valueKey="alpha" points={series} currentTime={time} currentValue={sample.alpha} />
        </>
      }
    />
  );
}
