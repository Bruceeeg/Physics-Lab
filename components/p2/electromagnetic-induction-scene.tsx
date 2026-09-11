"use client";

import { BoxMass, LabLine, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { InductionMode, InductionParams, InductionSample } from "@/lib/models/electromagnetic-induction";

export function ElectromagneticInductionScene({
  params,
  sample,
  mode,
}: {
  params: InductionParams;
  sample: InductionSample;
  mode: InductionMode;
}) {
  if (mode === "rail") {
    const x = Math.min(0.55, sample.z * 0.8);
    const bar: [number, number, number] = [x - 0.2, 0.08, 0];
    return (
      <>
        <LabScenery />
        <mesh position={[0, 0.04, 0.1]}>
          <boxGeometry args={[0.9, 0.02, 0.03]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 0.04, -0.1]}>
          <boxGeometry args={[0.9, 0.02, 0.03]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <BoxMass position={bar} size={[0.04, 0.04, 0.24]} color="#a16207" />
        <VectorArrow
          origin={bar}
          vector={[params.v, 0, 0]}
          value={params.v}
          unitLength={0.08}
          color={FORCE_COLORS.F}
          label="v"
          unit="m/s"
          scale={0.7}
        />
        <VectorArrow
          origin={bar}
          vector={[sample.F, 0, 0]}
          value={sample.F}
          unitLength={1.4}
          color={FORCE_COLORS.f}
          label="F"
          unit="N"
          scale={0.7}
        />
        <LabOrbit target={[0, 0.1, 0]} minDistance={0.7} maxDistance={10} />
      </>
    );
  }

  const magnetY = 0.34 + sample.z;
  return (
    <>
      <LabScenery />
      {[-0.04, -0.02, 0, 0.02, 0.04].map((y) => (
        <mesh key={y} position={[0, 0.28 + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.11, 0.012, 10, 24]} />
          <meshStandardMaterial color="#1e3a5f" metalness={0.4} />
        </mesh>
      ))}
      <BoxMass position={[0, magnetY, 0]} size={[0.06, 0.16, 0.06]} color="#b45309" />
      <LabLine points={[[0, magnetY + 0.1, 0], [0, magnetY - 0.1, 0]]} color="#a16207" lineWidth={1.2} />
      <LabOrbit target={[0, 0.28, 0]} minDistance={0.6} maxDistance={10} />
    </>
  );
}
