"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { ChoiceRow, LabFrame, ModeSwitch, formatLabNumber } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { RotationalMotionScene } from "@/components/p1/rotational-motion-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import {
  DEFAULT_ROLLING,
  ROLLING_SHAPES,
  kappa,
  sampleAt,
  speedAtBottom,
  timeToBottom,
  type RollingContact,
  type RollingParams,
  type RollingShape,
} from "@/lib/models/rotational-motion";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const PARAMETER_DEFINITIONS: {
  key: Exclude<keyof RollingParams, "shape" | "contact">;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "m", label: "质量", symbol: "m", unit: "kg", min: 0.2, max: 3, step: 0.05 },
  { key: "r", label: "半径", symbol: "r", unit: "m", min: 0.04, max: 0.16, step: 0.005 },
  { key: "h", label: "高度", symbol: "h", unit: "m", min: 0.2, max: 1.2, step: 0.02 },
  { key: "thetaDeg", label: "斜面倾角", symbol: "θ", unit: "°", min: 12, max: 40, step: 1 },
  { key: "g", label: "重力加速度", symbol: "g", unit: "m/s²", min: 1, max: 20, step: 0.01 },
];

export function RotationalMotionLab() {
  const [params, setParams] = useState(DEFAULT_ROLLING);
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t);
    return { sample: next, point: [next.x, next.y + params.r, 0] as [number, number, number] };
  }, [params]);
  const getLimit = useCallback(() => timeToBottom(params), [params]);
  const { time, isPlaying, start, pause, reset, sample, series, trail } = useLabPlayback(
    compute,
    getLimit,
  );
  const n = formatLabNumber;
  const vBottom = speedAtBottom(params);
  const sliding = (params.contact ?? "roll") === "slide";

  const apply = (patch: Partial<RollingParams>) => {
    reset();
    setParams((current) => ({ ...current, ...patch }));
  };

  return (
    <LabFrame
      title="滚动与转动"
      subtitle="Physics Lab / 力矩与转动"
      modes={
        <ModeSwitch
          value={params.contact ?? "roll"}
          options={[
            { id: "roll" as const, label: "无滑滚动" },
            { id: "slide" as const, label: "无摩擦滑动" },
          ]}
          onChange={(contact: RollingContact) => apply({ contact })}
        />
      }
      stats={[
        { label: "时间 t", value: n(time), unit: "s" },
        { label: "速率 v", value: n(sample.v), unit: "m/s" },
        { label: "角速度 ω", value: n(sample.omega), unit: "rad/s" },
      ]}
      status={
        sample.landed
          ? `已到达底端，v = ${n(vBottom)} m/s。圆环最慢，实心球最快。`
          : sliding
            ? `无摩擦滑动，底端 v = √(2gh) = ${n(vBottom)} m/s，比滚动更快。`
            : `无滑滚动，底端 v = √(2mgh / (m + I/r²)) = ${n(vBottom)} m/s。`
      }
      isPlaying={isPlaying}
      time={time}
      startLabel={sample.landed ? "再放一次" : time > 0 ? "继续" : "开始"}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ChoiceRow
            label="刚体形状"
            value={params.shape}
            options={ROLLING_SHAPES.map((item) => ({ id: item.id, label: item.label }))}
            onChange={(shape: RollingShape) => apply({ shape })}
          />
          {PARAMETER_DEFINITIONS.map((item) => (
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
              onChange={(value) => apply({ [item.key]: value })}
            />
          ))}
        </>
      }
      formula={
        <>
          <p className="text-quiet">I = ∫ r² dm = κmr²</p>
          <p>{sliding ? "v = √(2gh)" : "v = √(2mgh / (m + I/r²))"}</p>
          <p>κ = I/(mr²) = {n(kappa(params.shape))}</p>
          <p>ax = {n(sample.ax)} m/s²　ay = {n(sample.ay)} m/s²</p>
          <p className="text-navy">v_底 = {n(vBottom)} m/s</p>
          <p>K平 + K转 = {n(sample.Ktrans + sample.Krot)} J</p>
        </>
      }
      sceneTitle="三维斜面滚动"
      sceneCaption={sliding ? "无摩擦滑动　mg / N　虚线水平 / 竖直" : "静摩擦维持纯滚动　虚线水平 / 竖直"}
      scene={
        <SceneCanvas camera={[1.8, 1.2, 2.8]}>
          <RotationalMotionScene params={params} sample={sample} trail={trail} />
        </SceneCanvas>
      }
      readouts={[
        { label: "v", value: n(sample.v), unit: "m/s" },
        { label: "ω", value: n(sample.omega), unit: "rad/s" },
        { label: "K平", value: n(sample.Ktrans), unit: "J" },
        { label: "K转", value: n(sample.Krot), unit: "J" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="平动速度" quantity="v" unit="m/s" strokeColor="#1E3A5F" valueKey="v" points={series} currentTime={time} currentValue={sample.v} minDuration={Math.max(timeToBottom(params), 1)} />
          <TimeSeriesChart title="角速度" quantity="ω" unit="rad/s" strokeColor="#A16207" valueKey="omega" points={series} currentTime={time} currentValue={sample.omega} minDuration={Math.max(timeToBottom(params), 1)} />
          <TimeSeriesChart title="平动能" quantity="K平" unit="J" strokeColor="#2563EB" valueKey="Ktrans" points={series} currentTime={time} currentValue={sample.Ktrans} minDuration={Math.max(timeToBottom(params), 1)} />
          <TimeSeriesChart title="转动能" quantity="K转" unit="J" strokeColor="#6D28D9" valueKey="Krot" points={series} currentTime={time} currentValue={sample.Krot} minDuration={Math.max(timeToBottom(params), 1)} />
        </>
      }
    />
  );
}
