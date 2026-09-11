"use client";

import { DoubleSide } from "three";

import { BoxMass, LabOrbit, LabScenery, SphereMass, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { MagnetismMode, MagnetismParams, MagnetismSample } from "@/lib/models/magnetism";

export function MagnetismScene({
  params,
  sample,
  mode,
}: {
  params: MagnetismParams;
  sample: MagnetismSample;
  mode: MagnetismMode;
}) {
  if (mode === "solenoid") {
    const length = (params.length_cm ?? 25) / 100;
    const rings = Array.from({ length: 12 }, (_, i) => -length / 2 + ((i + 0.5) * length) / 12);
    return (
      <>
        <LabScenery />
        <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, length, 20, 1, true]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.28} side={DoubleSide} />
        </mesh>
        {rings.map((x, index) => (
          <mesh key={index} position={[x, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.075, 0.007, 8, 24]} />
            <meshStandardMaterial color="#a16207" metalness={0.45} />
          </mesh>
        ))}
        <SphereMass position={[0, 0.18, 0]} radius={0.028} color="#2563eb" />
        <VectorArrow
          origin={[0, 0.18, 0]}
          vector={[1, 0, 0]}
          value={sample.B}
          unitLength={0.22}
          color={FORCE_COLORS.F}
          label="B"
          unit="T"
          scale={0.7}
        />
        <LabOrbit target={[0, 0.18, 0]} minDistance={0.5} maxDistance={12} />
      </>
    );
  }

  if (mode === "magnet") {
    return (
      <>
        <LabScenery />
        <BoxMass position={[0, 0.08, 0]} size={[0.22, 0.08, 0.08]} color="#b45309" />
        <BoxMass position={[0.11, 0.08, 0]} size={[0.01, 0.08, 0.08]} color="#1e3a5f" />
        <group position={[sample.r, 0.08, 0]} rotation={[0, 0, sample.theta]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.14, 10]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <SphereMass position={[0.07, 0, 0]} radius={0.018} color="#b45309" />
        </group>
        <LabOrbit target={[0.08, 0.1, 0]} minDistance={0.6} maxDistance={10} />
      </>
    );
  }

  const r = sample.r;
  const tangents: [number, number, number][] = [
    [0, 0, r],
    [0, 0, -r],
    [r * 0.7, 0, r * 0.7],
  ];

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.56, 12]} />
        <meshStandardMaterial color="#a16207" metalness={0.5} />
      </mesh>
      <SphereMass position={[r, 0.18, 0]} radius={0.03} color="#2563eb" />
      {tangents.map((offset, index) => (
        <VectorArrow
          key={index}
          origin={[offset[0], 0.18, offset[2]]}
          vector={[-offset[2], 0, offset[0]]}
          value={sample.B}
          unitLength={8000}
          color={FORCE_COLORS.F}
          label="B"
          unit="T"
          scale={0.55}
        />
      ))}
      <LabOrbit target={[0, 0.18, 0]} minDistance={0.6} maxDistance={12} />
    </>
  );
}
