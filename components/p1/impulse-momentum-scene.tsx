"use client";

import { BoxMass, LabLine, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { CART_HALF, type ImpulseMode, type ImpulseParams, type ImpulseSample } from "@/lib/models/impulse-momentum";

export function ImpulseMomentumScene({
  sample,
  trail,
  mode = "collision",
  params,
}: {
  sample: ImpulseSample;
  trail: [number, number, number][];
  mode?: ImpulseMode;
  params?: ImpulseParams;
}) {
  if (mode === "ballistic") {
    const L = params?.L ?? 0.8;
    const pivot: [number, number, number] = [0, L + 0.15, 0];
    const bob: [number, number, number] = [sample.x2, pivot[1] - L * Math.cos(sample.theta), 0];
    const bullet: [number, number, number] = [sample.x1, bob[1], 0];
    return (
      <>
        <LabScenery />
        <mesh position={[0, pivot[1] / 2, 0]}>
          <cylinderGeometry args={[0.025, 0.025, pivot[1], 10]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <LabLine points={[pivot, bob]} color="#1e3a5f" lineWidth={1.6} />
        <BoxMass position={bob} size={[0.16, 0.16, 0.12]} color="#3d5a80" />
        {Math.abs(sample.x1 - sample.x2) > 0.02 ? (
          <SphereMass position={bullet} radius={0.035} color="#a16207" />
        ) : (
          <SphereMass position={[bob[0] - 0.05, bob[1], 0.04]} radius={0.028} color="#a16207" />
        )}
        <TrailLine points={trail} />
        <LabOrbit target={[0, L * 0.45, 0]} minDistance={1.4} />
      </>
    );
  }

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
