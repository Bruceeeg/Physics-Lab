"use client";

import { useFreeform } from "@/components/freeform/freeform-context";
import { SandboxScene } from "@/components/freeform/sandbox-scene";
import { TimeSeriesChart } from "@/components/kinematic-charts";
import { LabFrame, formatLabNumber } from "@/components/lab-frame";
import { getExperiment } from "@/lib/experiments/catalog";
import { forceComponents } from "@/lib/freeform/forces";

export function SandboxBench() {
  const freeform = useFreeform();
  const experiment = getExperiment(freeform.slug);
  const sample = freeform.sample;
  const n = formatLabNumber;
  const force = freeform.scene.parts.find((part) => part.enabled && part.type === "custom-force");
  const components = force ? forceComponents(force.magnitude, force.thetaDeg, force.phiDeg) : null;
  const points = freeform.series.length > 0
    ? freeform.series
    : [{ t: sample?.t ?? 0, x: sample?.x ?? 0, v: sample?.speed ?? 0, ax: sample?.ax ?? 0 }];

  return (
    <LabFrame
      sandboxHost
      title={experiment?.title ?? "自由搭建"}
      subtitle="Physics Lab / 自由搭建"
      modes={undefined}
      stats={[
        { label: "时间 t", value: n(sample?.t ?? 0), unit: "s" },
        { label: "速度 v", value: n(sample?.speed ?? 0), unit: "m/s" },
        { label: "加速度 a", value: n(sample ? Math.hypot(sample.ax, sample.ay, sample.az) : 0), unit: "m/s²" },
      ]}
      status={sample?.notice ?? "自由搭建"}
      statusError={freeform.sandbox?.finite === false}
      isPlaying={freeform.playing}
      time={sample?.t ?? 0}
      startDisabled={freeform.sandbox?.finite === false}
      onStart={freeform.play}
      onPause={freeform.pause}
      onReset={freeform.resetTime}
      parameters={<SandboxNote />}
      formula={
        <>
          <p className="text-quiet">自由搭建使用数值积分。标准公式暂停。</p>
          <p>ΣFx = {n(sample?.fx ?? 0)} N</p>
          <p>ΣFy = {n(sample?.fy ?? 0)} N</p>
          <p>ΣFz = {n(sample?.fz ?? 0)} N</p>
          {components ? (
            <p>
              Fx = {n(components.x)} N　Fy = {n(components.y)} N　Fz = {n(components.z)} N
            </p>
          ) : null}
          <p className="text-navy">τ = {n(sample?.torque ?? 0)} N·m</p>
          {sample?.imageDistance !== null && sample?.imageDistance !== undefined ? (
            <p>像距 s′ = {n(sample.imageDistance)} m</p>
          ) : null}
        </>
      }
      sceneTitle="自由搭建"
      sceneCaption="拖动力的红点可改作用点"
      scene={<SandboxScene />}
      readouts={[
        { label: "x", value: n(sample?.x ?? 0), unit: "m" },
        { label: "y", value: n(sample?.y ?? 0), unit: "m" },
        { label: "ax", value: n(sample?.ax ?? 0), unit: "m/s²" },
        { label: "ay", value: n(sample?.ay ?? 0), unit: "m/s²" },
      ]}
      charts={
        <>
          <TimeSeriesChart title="位置" quantity="x" unit="m" strokeColor="#1e3a5f" valueKey="x" points={points} currentTime={sample?.t ?? 0} currentValue={sample?.x ?? 0} />
          <TimeSeriesChart title="速率" quantity="v" unit="m/s" strokeColor="#a16207" valueKey="v" points={points} currentTime={sample?.t ?? 0} currentValue={sample?.speed ?? 0} />
          <TimeSeriesChart title="加速度" quantity="a" unit="m/s²" strokeColor="#b91c1c" valueKey="ax" points={points} currentTime={sample?.t ?? 0} currentValue={sample?.ax ?? 0} />
        </>
      }
    />
  );
}

function SandboxNote() {
  return (
    <p className="px-2 py-2 text-[12px] leading-5 text-quiet">
      标准模型的滑条已经暂停。打开「零件」可以改力的大小、方向和作用点，或搜索器材。重置操作会回到原来的实验，时钟停在离开时的时刻。
    </p>
  );
}
