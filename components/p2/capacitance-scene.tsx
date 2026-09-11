"use client";

import { LabOrbit, LabScenery } from "@/components/lab-3d";
import { CapacitorPlates } from "@/components/p2/circuit-parts";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabSci } from "@/lib/models/lab-format";
import type { CapSample } from "@/lib/models/capacitance";

export function CapacitanceScene({ sample }: { sample: CapSample }) {
  const gap = Math.max(0.02, sample.d * 8);
  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.7, 0.02, 0.4]} />
        <meshStandardMaterial color="#d6deea" roughness={0.7} />
      </mesh>
      <CapacitorPlates position={[0, 0.16, 0]} gap={gap} charge={sample.Q} />
      {sample.kappa > 1.05 ? (
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[Math.max(0.01, gap - 0.012), 0.14, 0.1]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.45} />
        </mesh>
      ) : null}
      <SpriteLabel
        text={`C ${formatLabSci(sample.C)} F`}
        color="#1e3a5f"
        position={[0, 0.34, 0]}
        height={0.08}
      />
      <LabOrbit target={[0, 0.16, 0]} minDistance={0.55} maxDistance={8} />
    </>
  );
}
