"use client";

import { Line } from "@react-three/drei";
import { DoubleSide } from "three";

import { BoxMass, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { ArchimedesParams, ArchimedesSample } from "@/lib/models/archimedes";

export function ArchimedesScene({
  params,
  sample,
}: {
  params: ArchimedesParams;
  sample: ArchimedesSample;
}) {
  const beakerH = 0.42;
  const beakerR = 0.16;
  const waterH = 0.28;
  const cubeY = waterH + params.side / 2 - sample.s;
  const standY = 0.62;
  const cube: [number, number, number] = [0, cubeY, 0];
  const hook: [number, number, number] = [0, standY, 0];

  return (
    <>
      <LabScenery />
      <mesh position={[0, beakerH / 2, 0]}>
        <cylinderGeometry args={[beakerR, beakerR * 0.95, beakerH, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#64748b"
          transparent
          opacity={0.18}
          roughness={0.08}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, waterH / 2, 0]}>
        <cylinderGeometry args={[beakerR * 0.92, beakerR * 0.9, waterH, 32]} />
        <meshPhysicalMaterial color="#3d5a80" transparent opacity={0.32} roughness={0.2} />
      </mesh>
      <mesh position={[0, standY + 0.08, 0]}>
        <boxGeometry args={[0.36, 0.04, 0.12]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0.18, standY / 2, 0]}>
        <boxGeometry args={[0.04, standY, 0.04]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Line points={[hook, [0, cubeY + params.side / 2, 0]]} color="#1e3a5f" lineWidth={1.4} />
      <BoxMass position={cube} size={[params.side, params.side, params.side]} />
      {sample.Fb > 0.02 ? (
        <VectorArrow
          origin={cube}
          vector={[0, sample.Fb, 0]}
          value={sample.Fb}
          unitLength={0.012}
          color={FORCE_COLORS.N}
          label="Fb"
          unit="N"
          scale={0.7}
        />
      ) : null}
      {sample.T > 0.02 ? (
        <VectorArrow
          origin={[cube[0], cube[1] + params.side / 2, 0]}
          vector={[0, sample.T, 0]}
          value={sample.T}
          unitLength={0.012}
          color={FORCE_COLORS.F}
          label="T"
          unit="N"
          scale={0.7}
        />
      ) : null}
      <VectorArrow
        origin={cube}
        vector={[0, -sample.W, 0]}
        value={sample.W}
        unitLength={0.012}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.7}
      />
      <LabOrbit target={[0, 0.28, 0]} minDistance={0.8} maxDistance={12} />
    </>
  );
}
