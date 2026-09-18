"use client";

import { BoxMass, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { NonuniformRodParams, NonuniformRodSample, RodDensityMode } from "@/lib/models/nonuniform-rod";

export function NonuniformRodScene({
  params,
  sample,
  mode,
}: {
  params: NonuniformRodParams;
  sample: NonuniformRodSample;
  mode: RodDensityMode;
}) {
  const pivotY = 1.15;
  const weight = (mode === "turbine" ? params.bladeCount * params.M : params.M) * params.g;
  const cm: [number, number, number] = [
    sample.xcm * Math.sin(sample.theta),
    pivotY - sample.xcm * Math.cos(sample.theta),
    0,
  ];

  return (
    <>
      <LabScenery />
      <mesh position={[0, pivotY + 0.12, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.24, 10]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <group position={[0, pivotY, 0]} rotation={[0, 0, sample.theta]}>
        {mode === "turbine"
          ? Array.from({ length: params.bladeCount }, (_, i) => (
              <mesh key={i} rotation={[0, 0, (i * 2 * Math.PI) / params.bladeCount]} position={[0, -params.L / 2, 0]}>
                <boxGeometry args={[0.05, params.L, 0.02]} />
                <meshStandardMaterial color="#3d5a80" />
              </mesh>
            ))
          : Array.from({ length: 8 }, (_, i) => {
              const t = (i + 0.5) / 8;
              const w = mode === "quadratic" ? 0.02 + 0.07 * t * t : 0.025 + 0.05 * t;
              return (
                <mesh key={i} position={[0, -t * params.L, 0]}>
                  <boxGeometry args={[w, params.L / 8, 0.03]} />
                  <meshStandardMaterial color="#3d5a80" />
                </mesh>
              );
            })}
      </group>
      <BoxMass position={cm} size={[0.08, 0.08, 0.08]} color="#a16207" />
      <VectorArrow origin={cm} vector={[0, -weight, 0]} value={weight} unitLength={0.04} color={FORCE_COLORS.G} label="Mg" unit="N" scale={0.55} />
      <LabOrbit target={[0, 0.55, 0]} minDistance={1.3} />
    </>
  );
}
