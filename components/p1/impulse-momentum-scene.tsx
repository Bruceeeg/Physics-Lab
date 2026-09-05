"use client";

import { BoxMass, LabOrbit, LabScenery, TrailLine, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { CART_HALF, type ImpulseSample } from "@/lib/models/impulse-momentum";

export function ImpulseMomentumScene({
  sample,
  trail,
}: {
  sample: ImpulseSample;
  trail: [number, number, number][];
}) {
  const y = 0.1;
  const a: [number, number, number] = [sample.x1, y, 0];
  const b: [number, number, number] = [sample.x2, y, 0];

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 0.55]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
      </mesh>
      <TrailLine points={trail} />
      <BoxMass position={a} size={[CART_HALF * 2, 0.18, 0.2]} color="#3d5a80" />
      <BoxMass position={b} size={[CART_HALF * 2, 0.18, 0.2]} color="#a16207" />
      {Math.abs(sample.F) > 0.05 ? (
        <VectorArrow
          origin={[(sample.x1 + sample.x2) / 2, y + 0.12, 0]}
          vector={[sample.F, 0, 0]}
          value={sample.F}
          unitLength={0.04}
          color={FORCE_COLORS.f}
          label="F"
          unit="N"
          scale={0.8}
        />
      ) : null}
      <LabOrbit target={[0, 0.15, 0]} minDistance={1.4} />
    </>
  );
}
