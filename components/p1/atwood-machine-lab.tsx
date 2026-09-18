"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, ModeSwitch, formatLabNumber, formatLabSci } from "@/components/lab-frame";
import { ParameterControl } from "@/components/parameter-control";
import { AtwoodMachineScene } from "@/components/p1/atwood-machine-scene";
import { useLabPlayback } from "@/components/use-lab-clock";
import { frictionForceTitle } from "@/lib/models/lab-format";
import {
  acceleration,
  DEFAULT_ATWOOD,
  hangingPositions,
  lightKinematics,
  lightMass,
  pulleyInertia,
  sampleAt,
  timeToStop,
  type AtwoodMode,
} from "@/lib/models/atwood-machine";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

const ATWOOD_MODES = [
  { id: "classic" as const, label: "经典双吊" },
  { id: "modified" as const, label: "桌上滑车" },
  { id: "pulley" as const, label: "滑轮惯量" },
  { id: "incline" as const, label: "斜面悬挂" },
];

export function AtwoodMachineLab() {
  const [params, setParams] = useState(DEFAULT_ATWOOD);
  const [mode, setMode] = useState<AtwoodMode>("classic");
  const compute = useCallback((t: number) => {
    const next = sampleAt(params, t, mode);
    const pos = hangingPositions(params, next, mode);
    const id = lightMass(params);
    return { sample: next, point: id === "A" ? pos.A : pos.B };
  }, [mode, params]);
  const getLimit = useCallback(() => {
    const limit = timeToStop(params, mode);
    return Number.isFinite(limit) ? limit : null;
  }, [mode, params]);
  const { time, isPlaying, start, pause, reset, sample, series } = useLabPlayback(compute, getLimit);
  const n = formatLabNumber;
  const aSys = acceleration(params, mode);
  const modified = mode === "modified";
  const pulley = mode === "pulley";
  const incline = mode === "incline";
  const stuck = Math.abs(aSys) < 1e-9;
  const light = lightKinematics(params, sample);
  const lightSeries = useMemo(
    () =>
      series.map((point) => {
        const kinematics = lightKinematics(params, point);
        return { t: point.t, s: kinematics.s, v: kinematics.v, a: kinematics.a, T: kinematics.T };
      }),
    [params, series],
  );
  const net = light.T - light.mg;
  const heavier = light.id === "A" ? "B" : "A";
  const lightIsCart = modified && light.id === "A";

  return (
    <LabFrame
      title="阿特伍德机"
      subtitle="Physics Lab / 力与平动"
      modes={
        <ModeSwitch
          value={mode}
          options={ATWOOD_MODES}
          onChange={(next) => {
            reset();
            setMode(next);
          }}
        />
      }
      stats={[
        { label: `轻物 ${light.id} 位移`, value: n(light.s), unit: "m" },
        { label: `轻物 ${light.id} 速度`, value: n(light.v), unit: "m/s" },
        { label: `轻物 ${light.id} 加速度`, value: n(light.a), unit: "m/s²" },
      ]}
      status={
        stuck
          ? modified
            ? sample.frictionKind === "static"
              ? `静摩擦平衡悬挂重量。轻物为 ${light.id}。fs = ${n(sample.f)} N，fs,max = ${n((params.muS ?? params.mu ?? 0) * sample.N)} N。`
              : `两质量使系统保持静止。轻物为 ${light.id}。`
            : incline
              ? `斜面分量与悬挂重量平衡，系统静止。a = 0。`
              : `两质量相等，系统保持静止。轻物为 ${light.id}。`
          : modified
            ? `桌上滑车。轻物 ${light.id}。${frictionForceTitle(sample.frictionKind)} = ${n(sample.f)} N。a = ${n(light.a)} m/s²。`
            : pulley
            ? `计入滑轮 I = ½MR² = ${formatLabSci(pulleyInertia(params))} kg·m²。仪表针对轻物 ${light.id}。`
            : incline
              ? `斜面悬挂。a = (mB g − mA g sinθ)/(mA+mB) = ${n(aSys)} m/s²。A 沿斜面，B 竖直。`
              : `较重的是 ${heavier}，轻物 ${light.id} 上升。T − mg = ma。`
      }
      isPlaying={isPlaying}
      time={time}
      startDisabled={stuck}
      onStart={start}
      onPause={pause}
      onReset={reset}
      parameters={
        <>
          <ParameterControl
            id="m1"
            label={modified ? "质量 A 车上" : "质量 A"}
            symbol="mA"
            unit="kg"
            value={params.m1}
            min={0.2}
            max={3}
            step={0.05}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, m1: value }));
            }}
          />
          <ParameterControl
            id="m2"
            label={modified ? "质量 B 悬挂" : "质量 B"}
            symbol="mB"
            unit="kg"
            value={params.m2}
            min={0.2}
            max={3}
            step={0.05}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, m2: value }));
            }}
          />
          {modified ? (
            <>
              <ParameterControl
                id="muS"
                label="静摩擦因数"
                symbol="μs"
                unit=""
                value={params.muS ?? params.mu ?? 0}
                min={0}
                max={0.8}
                step={0.02}
                onChange={(value) => {
                  reset();
                  setParams((current) => {
                    const mu = Math.min(current.mu ?? 0, value);
                    return { ...current, muS: value, mu };
                  });
                }}
              />
              <ParameterControl
                id="mu"
                label="动摩擦因数"
                symbol="μk"
                unit=""
                value={params.mu ?? 0}
                min={0}
                max={params.muS ?? params.mu ?? 0.8}
                step={0.02}
                onChange={(value) => {
                  reset();
                  setParams((current) => ({ ...current, mu: Math.min(value, current.muS ?? value) }));
                }}
              />
            </>
          ) : null}
          {incline ? (
            <ParameterControl
              id="theta"
              label="斜面倾角"
              symbol="θ"
              unit="°"
              value={params.thetaDeg ?? 30}
              min={10}
              max={50}
              step={1}
              onChange={(value) => {
                reset();
                setParams((current) => ({ ...current, thetaDeg: value }));
              }}
            />
          ) : null}
          {pulley ? (
            <>
              <ParameterControl
                id="Mp"
                label="滑轮质量"
                symbol="M"
                unit="kg"
                value={params.Mp ?? 0.4}
                min={0.1}
                max={2}
                step={0.05}
                onChange={(value) => {
                  reset();
                  setParams((current) => ({ ...current, Mp: value }));
                }}
              />
              <ParameterControl
                id="Rp"
                label="滑轮半径"
                symbol="R"
                unit="m"
                value={params.Rp ?? 0.12}
                min={0.06}
                max={0.2}
                step={0.01}
                onChange={(value) => {
                  reset();
                  setParams((current) => ({ ...current, Rp: value }));
                }}
              />
            </>
          ) : null}
          <ParameterControl
            id="travel"
            label="行程"
            symbol="s_max"
            unit="m"
            value={params.travel}
            min={0.2}
            max={1.2}
            step={0.01}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, travel: value }));
            }}
          />
          <ParameterControl
            id="g"
            label="重力加速度"
            symbol="g"
            unit="m/s²"
            value={params.g}
            min={1}
            max={20}
            step={0.01}
            onChange={(value) => {
              reset();
              setParams((current) => ({ ...current, g: value }));
            }}
          />
        </>
      }
      formula={
        modified ? (
          <>
            <p className="text-quiet">A 深蓝车上　B 金色悬挂　读数针对轻物 {light.id}</p>
            <p>静止：mB g ≤ μs mA g　滑动：a = (mB g − μk mA g)/(mA+mB)</p>
            <p>mg{light.id} = {n(light.mg)} N　T = {n(light.T)} N</p>
            <p className="text-navy">
              {lightIsCart
                ? `轻物 A 水平：T − f = m a`
                : `轻物 B：mg − T = m |a|（下降为正时）`}
            </p>
            <p>
              {frictionForceTitle(sample.frictionKind)} = {n(sample.f)} N
            </p>
          </>
        ) : pulley ? (
          <>
            <p className="text-quiet">A 深蓝　B 金色　读数针对轻物 {light.id}</p>
            <p>a = gΔm / (mA+mB+I/R²)，I = ½MR²</p>
            <p>I = {formatLabSci(sample.I)} kg·m²</p>
            <p>mg{light.id} = {n(light.mg)} N　T{light.id} = {n(light.T)} N</p>
            <p className="text-navy">轻物 {light.id}：T − mg = ma = {n(net)} N</p>
            <p>TA = {n(sample.T1)} N　TB = {n(sample.T)} N</p>
          </>
        ) : incline ? (
          <>
            <p className="text-quiet">A 斜面上　B 悬挂　a = (mB g − mA g sinθ)/(mA+mB)</p>
            <p>θ = {n(params.thetaDeg ?? 30)}°</p>
            <p>mgA sinθ = {n(params.m1 * params.g * Math.sin(((params.thetaDeg ?? 30) * Math.PI) / 180))} N</p>
            <p className="text-navy">a = {n(aSys)} m/s²　T = {n(sample.T)} N</p>
          </>
        ) : (
          <>
            <p className="text-quiet">A 深蓝　B 金色　读数针对轻物 {light.id}</p>
            <p>mgA = mA g　mgB = mB g　均竖直向下</p>
            <p>系统 a = g(mB−mA)/(mA+mB) = {n(aSys)} m/s²</p>
            <p>轻物 {light.id}：T 向上，mg 向下</p>
            <p className="text-navy">T − mg = ma</p>
            <p>T = {n(light.T)} N　mg = {n(light.mg)} N　ma = {n(light.m * light.a)} N</p>
          </>
        )
      }
      sceneTitle={modified ? "三维桌上滑车" : pulley ? "三维滑轮惯量" : incline ? "三维斜面阿特伍德" : "三维阿特伍德机"}
      sceneCaption={modified ? "A 车上深蓝　B 悬挂金色　实线 T / mg / N / f" : pulley ? "A 深蓝　B 金色　两侧张力不同" : incline ? "A 沿斜面　B 竖直悬挂" : "A 深蓝　B 金色　实线 T / mg"}
      scene={
        <SceneCanvas camera={[1.6, 1.1, 2.8]}>
          <AtwoodMachineScene sample={sample} params={params} mode={mode} />
        </SceneCanvas>
      }
      readouts={[
        { label: `T${light.id}`, value: n(light.T), unit: "N" },
        { label: `mg${light.id}`, value: n(light.mg), unit: "N" },
        { label: "T−mg", value: n(net), unit: "N" },
        { label: `v${light.id}`, value: n(light.v), unit: "m/s" },
      ]}
      charts={
        <>
          <TimeSeriesChart title={`轻物 ${light.id} 位移`} quantity="s" unit="m" strokeColor="#1E3A5F" valueKey="s" points={lightSeries} currentTime={time} currentValue={light.s} minDuration={Math.max(1, Number.isFinite(timeToStop(params, mode)) ? timeToStop(params, mode) : 4)} />
          <TimeSeriesChart title={`轻物 ${light.id} 速度`} quantity="v" unit="m/s" strokeColor="#A16207" valueKey="v" points={lightSeries} currentTime={time} currentValue={light.v} />
          <TimeSeriesChart title={`轻物 ${light.id} 加速度`} quantity="a" unit="m/s²" strokeColor="#2563EB" valueKey="a" points={lightSeries} currentTime={time} currentValue={light.a} />
          <TimeSeriesChart title={`轻物 ${light.id} 张力`} quantity="T" unit="N" strokeColor="#6D28D9" valueKey="T" points={lightSeries} currentTime={time} currentValue={light.T} />
        </>
      }
    />
  );
}
