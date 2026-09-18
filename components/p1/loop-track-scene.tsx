"use client";

import { DoubleSide } from "three";

import { BoxMass, LabLine, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { LoopMode, LoopParams, LoopSample } from "@/lib/models/loop-track";

function loopPoints(R: number) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 64; i += 1) {
    const phi = (i / 64) * Math.PI * 2;
    pts.push([R * Math.sin(phi), R * (1 - Math.cos(phi)), 0]);
  }
  return pts;
}

export function LoopTrackScene({
  params,
  sample,
  trail,
  mode,
}: {
  params: LoopParams;
  sample: LoopSample;
  trail: [number, number, number][];
  mode: LoopMode;
}) {
  const body: [number, number, number] = [sample.x, sample.y + 0.06, 0];
  const weight = params.m * params.g;
  const approach: [number, number, number][] = [
    [-params.R - 0.9, params.h, 0],
    [-params.R - 0.15, 0.02, 0],
  ];
  return (
    <>
      <LabScenery />
      <mesh position={[-params.R - 0.5, params.h / 2, 0]} rotation={[0, 0, -Math.atan2(params.h, 0.75)]}>
        <boxGeometry args={[1.1, 0.04, 0.36]} />
        <meshStandardMaterial color="#cbd5e1" side={DoubleSide} />
      </mesh>
      <LabLine points={loopPoints(params.R)} color="#334155" lineWidth={2.2} />
      <LabLine points={approach} color="#94a3b8" lineWidth={1.4} />
      <TrailLine points={trail} />
      {mode === "roll" ? (
        <SphereMass position={body} radius={0.07} />
      ) : (
        <BoxMass position={body} size={[0.12, 0.1, 0.1]} />
      )}
      <VectorArrow origin={body} vector={[0, -weight, 0]} value={weight} unitLength={0.04} color={FORCE_COLORS.G} label="mg" unit="N" scale={0.55} />
      <VectorArrow
        origin={body}
        vector={[-Math.sin(sample.phi) * sample.N, Math.cos(sample.phi) * sample.N, 0]}
        value={sample.N}
        unitLength={0.04}
        color={FORCE_COLORS.N}
        label="N"
        unit="N"
        scale={0.55}
      />
      <LabOrbit target={[0, params.R, 0]} minDistance={1.4} />
    </>
  );
}
