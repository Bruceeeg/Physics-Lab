"use client";

import { DoubleSide } from "three";

import { BoxMass, LabOrbit, LabScenery } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber } from "@/lib/models/lab-format";
import type { BoyleParams, BoyleSample } from "@/lib/models/boyles-law";

export function BoylesLawScene({
  params,
  sample,
}: {
  params: BoyleParams;
  sample: BoyleSample;
}) {
  const radius = 0.07;
  const gasH = 0.16 + 0.42 * (sample.Vcm3 / Math.max(params.V0_cm3, params.Vf_cm3, 1));
  const pistonY = gasH + 0.02;

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[radius + 0.006, radius + 0.004, 0.76, 32, 1, true]} />
        <meshPhysicalMaterial color="#64748b" transparent opacity={0.18} roughness={0.08} side={DoubleSide} />
      </mesh>
      <mesh position={[0, gasH / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.98, gasH, 28]} />
        <meshPhysicalMaterial color="#3d5a80" transparent opacity={0.38} roughness={0.22} />
      </mesh>
      <BoxMass position={[0, pistonY, 0]} size={[0.16, 0.04, 0.16]} color="#1e3a5f" />
      <mesh position={[0, pistonY + 0.18, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 10]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <SpriteLabel
        text={`V ${formatLabNumber(sample.Vcm3)} cm³`}
        color="#1e3a5f"
        position={[0.22, gasH * 0.45, 0]}
        height={0.08}
      />
      <LabOrbit target={[0, 0.28, 0]} minDistance={0.7} maxDistance={10} />
    </>
  );
}
