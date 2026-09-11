"use client";

import { BoxMass, LabOrbit, LabScenery } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber } from "@/lib/models/lab-format";
import type { ThermalMode, ThermalParams, ThermalSample } from "@/lib/models/thermal-conductivity";

function Bar({
  z,
  k,
  frac,
}: {
  z: number;
  k: number;
  frac: number;
}) {
  const hot = 0.35 + 0.65 * frac;
  return (
    <mesh position={[0, 0.12, z]}>
      <boxGeometry args={[0.72, 0.05, 0.08]} />
      <meshStandardMaterial
        color={k > 200 ? "#b45309" : "#64748b"}
        emissive="#a16207"
        emissiveIntensity={0.15 * hot}
      />
    </mesh>
  );
}

export function ThermalConductivityScene({
  params,
  sample,
  mode,
}: {
  params: ThermalParams;
  sample: ThermalSample;
  mode: ThermalMode;
}) {
  return (
    <>
      <LabScenery />
      <BoxMass position={[-0.46, 0.16, 0]} size={[0.18, 0.22, 0.22]} color="#b45309" />
      <BoxMass position={[0.46, 0.16, 0]} size={[0.18, 0.22, 0.22]} color="#3d5a80" />
      <Bar z={mode === "compare" ? 0.08 : 0} k={params.k} frac={sample.frac} />
      {mode === "compare" ? <Bar z={-0.1} k={params.k2} frac={sample.frac} /> : null}
      <SpriteLabel text={`Th ${formatLabNumber(params.Th)} K`} color="#b45309" position={[-0.46, 0.34, 0]} height={0.07} />
      <SpriteLabel text={`Tc ${formatLabNumber(params.Tc)} K`} color="#1e3a5f" position={[0.46, 0.34, 0]} height={0.07} />
      <LabOrbit target={[0, 0.14, 0]} minDistance={0.8} maxDistance={12} />
    </>
  );
}
