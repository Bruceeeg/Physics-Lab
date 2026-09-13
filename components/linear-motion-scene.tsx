"use client";

import { BoxMass, LabOrbit, LabScenery } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber } from "@/lib/models/lab-format";

export function LinearMotionScene({
  x,
  min,
  max,
  v,
}: {
  x: number;
  min: number;
  max: number;
  v: number;
}) {
  const span = Math.max(max - min, 4);
  const length = Math.min(10, Math.max(4.5, span * 0.45 + 3.2));
  const scale = length / span;
  const mid = (min + max) / 2;
  const toWorld = (pos: number) => (pos - mid) * scale;
  const worldX = toWorld(x);
  const originX = toWorld(0);
  const ticks: number[] = [];
  const step = span > 20 ? 5 : span > 8 ? 2 : 1;
  const startTick = Math.ceil(min / step) * step;
  for (let mark = startTick; mark <= max + 1e-9; mark += step) {
    ticks.push(mark);
  }

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[length + 0.8, 0.06, 0.42]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0.09, 0.16]}>
        <boxGeometry args={[length + 0.8, 0.03, 0.04]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, 0.09, -0.16]}>
        <boxGeometry args={[length + 0.8, 0.03, 0.04]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[originX, 0.22, 0]}>
        <boxGeometry args={[0.02, 0.28, 0.28]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
      {ticks.map((mark) => (
        <SpriteLabel
          key={mark}
          text={`${formatLabNumber(mark)} m`}
          color="#475569"
          position={[toWorld(mark), 0.02, 0.34]}
          height={0.11}
        />
      ))}
      <BoxMass position={[worldX, 0.2, 0]} size={[0.28, 0.2, 0.22]} color="#1E3A5F" />
      <SpriteLabel
        text={`x = ${formatLabNumber(x)} m`}
        color="#1e3a5f"
        position={[worldX, 0.42, 0]}
        height={0.14}
      />
      <SpriteLabel
        text={`v = ${formatLabNumber(v)} m/s`}
        color="#a16207"
        position={[worldX, 0.56, 0]}
        height={0.12}
      />
      <LabOrbit target={[worldX, 0.25, 0]} minDistance={1.6} />
    </>
  );
}
