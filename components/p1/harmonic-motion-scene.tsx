"use client";

import { DoubleSide } from "three";

import { BoxMass, LabLine, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { HarmonicMode, HarmonicParams, HarmonicSample } from "@/lib/models/harmonic-motion";

export function HarmonicMotionScene({
  params,
  sample,
  trail,
  mode = "pendulum",
}: {
  params: HarmonicParams;
  sample: HarmonicSample;
  trail: [number, number, number][];
  mode?: HarmonicMode;
}) {
  if (mode === "spring") {
    const wallX = -params.A - 0.28;
    const block: [number, number, number] = [sample.x, 0.12, 0];
    const coils: [number, number, number][] = [];
    const steps = 40;
    for (let index = 0; index <= steps; index += 1) {
      const u = index / steps;
      const x = wallX + 0.04 + u * (sample.x - 0.08 - wallX - 0.04);
      coils.push([x, 0.12 + 0.03 * Math.cos(index * 0.9), 0.04 * Math.sin(index * 0.9)]);
    }
    return (
      <>
        <LabScenery />
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2, 0.55]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} side={DoubleSide} />
        </mesh>
        <mesh position={[wallX, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.4, 0.36]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {coils.length > 1 ? <LabLine points={coils} color="#b45309" lineWidth={1.6} /> : null}
        <TrailLine points={trail} />
        <BoxMass position={block} size={[0.16, 0.12, 0.14]} />
        <LabOrbit target={[0, 0.15, 0]} minDistance={1.2} />
      </>
    );
  }

  const pivotY = params.L + 0.1;
  const pivot: [number, number, number] = [0, pivotY, 0];
  const bob: [number, number, number] = [sample.x, pivotY + sample.y, 0];

  return (
    <>
      <LabScenery />
      <mesh position={[0, pivotY / 2, 0]}>
        <cylinderGeometry args={[0.028, 0.028, pivotY, 12]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, pivotY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.36, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <LabLine points={[pivot, bob]} color="#1e3a5f" lineWidth={1.6} />
      <TrailLine points={trail} />
      <SphereMass position={bob} radius={0.075} />
      <VectorArrow
        origin={bob}
        vector={[0, -params.m * params.g, 0]}
        value={params.m * params.g}
        unitLength={0.06}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.85}
      />
      <LabOrbit target={[0, pivotY * 0.45, 0]} />
    </>
  );
}
