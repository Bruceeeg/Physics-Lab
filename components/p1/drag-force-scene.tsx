"use client";

import { DoubleSide } from "three";

import { LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { DragParams, DragSample } from "@/lib/models/drag-force";

export function DragForceScene({
  params,
  sample,
  trail,
}: {
  params: DragParams;
  sample: DragSample;
  trail: [number, number, number][];
}) {
  const y = 1.6 - Math.min(1.45, sample.y * 0.22);
  const body: [number, number, number] = [0, y, 0];
  const weight = params.m * params.g;
  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 1.7, 24, 1, true]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.22} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshStandardMaterial color="#64748b" transparent opacity={0.35} side={DoubleSide} />
      </mesh>
      <TrailLine points={trail} />
      <SphereMass position={body} radius={0.09} />
      <VectorArrow origin={body} vector={[0, -weight, 0]} value={weight} unitLength={0.08} color={FORCE_COLORS.G} label="mg" unit="N" scale={0.7} />
      <VectorArrow origin={body} vector={[0, sample.Fd, 0]} value={sample.Fd} unitLength={0.08} color={FORCE_COLORS.f} label="Fd" unit="N" scale={0.7} />
      <LabOrbit target={[0, 0.7, 0]} minDistance={1.3} />
    </>
  );
}
