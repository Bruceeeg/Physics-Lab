"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { InclineFrictionScene } from "@/components/p1/incline-friction-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import { frictionForceLabel, frictionForceTitle } from "@/lib/models/lab-format";
import {
  DEFAULT_INCLINE,
  acceleration,
  blockPlacement,
  planeAccel,
  planeStopDistance,
  sampleAt,
  stuck,
  timeToLimit,
  type InclineParams,
} from "@/lib/models/incline-friction";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: keyof InclineParams;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "m", label: "滑块质量", symbol: "m", unit: "kg", min: 0.1, max: 3, step: 0.05 },
  { key: "thetaDeg", label: "斜面倾角", symbol: "θ", unit: "°", min: 5, max: 50, step: 0.5 },
  { key: "muS", label: "静摩擦因数", symbol: "μs", unit: "", min: 0, max: 1.2, step: 0.01 },
  { key: "muK", label: "动摩擦因数", symbol: "μk", unit: "", min: 0, max: 1.2, step: 0.01 },
  { key: "travel", label: "斜面长度", symbol: "s", unit: "m", min: 0.3, max: 1.6, step: 0.02 },
  { key: "plane", label: "平面摩擦距离", symbol: "d", unit: "m", min: 0.15, max: 2, step: 0.02 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

export function InclineFrictionLab() {
  const [params, setParams] = useState(DEFAULT_INCLINE);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t);
    return { sample: next, point: blockPlacement(params, next).position };
  }, [params]);
  const getLimit = useCallback(() => {
    const limit = timeToLimit(params);
    return Number.isFinite(limit) ? limit : null;
  }, [params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const isStuck = stuck(params);
  const a = acceleration(params);
  const aFlat = planeAccel(params);
  const dStop = planeStopDistance(params);
  const tanTheta = Math.tan((params.thetaDeg * Math.PI) / 180);

  return (
    <LabFrame
      title="斜面摩擦"
      subtitle="Physics Lab / Unit 2 力与平动动力学"
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "加速度 a", value: n(sample.a), unit: "m/s²" },
        { label: "速率 v", value: n(sample.v), unit: "m/s" },
      ]}
      status={
        isStuck
          ? `tanθ = ${n(tanTheta)} ≤ μs = ${n(params.muS)}，${frictionForceTitle("static")} 平衡下滑分力，滑块停在斜面上。`
          : sample.landed
            ? sample.sPlane >= params.plane - 1e-6
              ? `到达平面尽头。斜面 a = ${n(a)} m/s²，平面 a = ${n(aFlat)} m/s²。若平面足够长，停距约为 ${Number.isFinite(dStop) ? n(dStop) : "∞"} m。`
              : `在平面上停下，滑行 d = ${n(sample.sPlane)} m。${frictionForceTitle("static")} = 0.00 N。`
            : sample.onPlane
              ? `已下到平面。${frictionForceTitle("kinetic")}，a = −μk g = ${n(sample.a)} m/s²。`
              : `tanθ = ${n(tanTheta)} > μs，${frictionForceTitle("kinetic")}，a = g(sinθ − μk cosθ) = ${n(a)} m/s²。`
      }
      isPlaying={isPlaying}
      time={time}
      startDisabled={isStuck}
      startLabel={sample.landed ? "再放一次" : time > 0 ? "继续" : "开始"}
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
          onChange={(value) => {
            reset();
            setParams((current) => {
              const next = { ...current, [item.key]: value };
              if (item.key === "muS" && next.muK > next.muS) {
                next.muK = next.muS;
              }
              if (item.key === "muK" && next.muK > next.muS) {
                next.muK = next.muS;
              }
              return next;
            });
          }}
        />
      ))}
      formula={
        <>
          <p className="text-quiet">静止 tanθ ≤ μs　滑动后拆成水平 / 竖直</p>
          <p>斜面 a = g(sinθ − μk cosθ) = {n(a)} m/s²</p>
          <p>ax = {n(sample.ax)} m/s²　ay = {n(sample.ay)} m/s²</p>
          <p>
            N = {n(sample.N)} N, {frictionForceLabel(sample.frictionKind)} = {n(sample.f)} N
          </p>
          <p className="text-navy">
            {isStuck
              ? `${frictionForceTitle("static")}，a = 0.00`
              : sample.onPlane
                ? `${frictionForceTitle(sample.frictionKind)}　平面 a = ${n(sample.a)} m/s²`
                : `${frictionForceTitle(sample.frictionKind)}　斜面 a = ${n(sample.a)} m/s²`}
          </p>
        </>
      }
      sceneTitle="斜面与平面"
      sceneCaption="实线 mg / N / f　虚线水平 / 竖直分量　拖动旋转"
      scene={
        <SceneCanvas camera={[1.8, 0.95, 2.8]} fov={42}>
          <InclineFrictionScene params={params} sample={sample} />
        </SceneCanvas>
      }
      readouts={[
        { label: "ax", value: n(sample.ax), unit: "m/s²" },
        { label: "ay", value: n(sample.ay), unit: "m/s²" },
        { label: "N", value: n(sample.N), unit: "N" },
        { label: frictionForceLabel(sample.frictionKind), value: n(sample.f), unit: "N" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="沿程位移" quantity="s" unit="m" strokeColor="#1E3A5F" valueKey="s" points={series} currentTime={time} currentValue={sample.s} />
          <TimeSeriesChart title="速率" quantity="v" unit="m/s" strokeColor="#A16207" valueKey="v" points={series} currentTime={time} currentValue={sample.v} />
          <TimeSeriesChart title="加速度" quantity="a" unit="m/s²" strokeColor="#2563EB" valueKey="a" points={series} currentTime={time} currentValue={sample.a} />
          <TimeSeriesChart title={frictionForceTitle(sample.frictionKind)} quantity="f" unit="N" strokeColor="#6D28D9" valueKey="f" points={series} currentTime={time} currentValue={sample.f} />
        </>
      }
    />
  );
}
