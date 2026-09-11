"use client";

import { BoxMass, LabLine, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { RotationN2Params, RotationN2Sample } from "@/lib/models/rotation-n2";

export function RotationN2Scene({
  params,
  sample,
}: {
  params: RotationN2Params;
  sample: RotationN2Sample;
}) {
  const axleY = 1.05;
  const hangX = 0.32;
  const bob: [number, number, number] = [hangX, axleY - 0.35 + sample.y, 0];
  const weight = params.m * params.g;

  return (
    <>
      <LabScenery />
      <mesh position={[0, axleY + 0.18, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 10]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, axleY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.5, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <group position={[0, axleY, 0]} rotation={[sample.phi, 0, 0]}>
        {params.shape === "hoop" ? (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[params.R, 0.018, 10, 40]} />
            <meshStandardMaterial color="#3d5a80" />
          </mesh>
        ) : params.shape === "rod" ? (
          <mesh>
            <boxGeometry args={[0.04, params.L, 0.04]} />
            <meshStandardMaterial color="#3d5a80" />
          </mesh>
        ) : (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[params.R, params.R, 0.06, 32]} />
            <meshStandardMaterial color="#3d5a80" />
          </mesh>
        )}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[params.r, params.r, 0.08, 16]} />
          <meshStandardMaterial color="#a16207" />
        </mesh>
      </group>
      <LabLine
        points={[[params.r, axleY, 0], [hangX, axleY, 0], bob]}
        color="#1e3a5f"
        lineWidth={1.5}
      />
      <BoxMass position={bob} size={[0.12, 0.16, 0.12]} color="#a16207" />
      <VectorArrow
        origin={[bob[0], bob[1] + 0.12, 0]}
        vector={[0, sample.T, 0]}
        value={sample.T}
        unitLength={0.05}
        color={FORCE_COLORS.F}
        label="T"
        unit="N"
        scale={0.6}
      />
      <VectorArrow
        origin={bob}
        vector={[0, -weight, 0]}
        value={weight}
        unitLength={0.05}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.6}
      />
      <LabOrbit target={[0, 0.7, 0]} minDistance={1.3} />
    </>
  );
}
