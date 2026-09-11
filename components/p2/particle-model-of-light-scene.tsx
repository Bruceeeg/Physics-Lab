"use client";

import { BoxMass, LabOrbit, LabScenery, SphereMass } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import type { PhotonMode, PhotonSample } from "@/lib/models/particle-model-of-light";

export function ParticleModelOfLightScene({
  sample,
  mode,
}: {
  sample: PhotonSample;
  mode: PhotonMode;
}) {
  if (mode === "photoelectric") {
    return (
      <>
        <LabScenery />
        <BoxMass position={[-0.12, 0.14, 0]} size={[0.04, 0.22, 0.18]} color="#64748b" />
        <mesh position={[0.18, 0.16, 0]}>
          <sphereGeometry args={[0.05, 20, 14]} />
          <meshStandardMaterial color="#a16207" metalness={0.4} />
        </mesh>
        {sample.emits ? (
          <>
            <SphereMass position={[0.02, 0.2, 0.04]} radius={0.016} color="#2563eb" />
            <SphereMass position={[0.08, 0.12, -0.03]} radius={0.016} color="#2563eb" />
          </>
        ) : null}
        <SpriteLabel
          text={sample.emits ? "光电子逸出" : "低于阈频"}
          color="#1e3a5f"
          position={[0, 0.36, 0]}
          height={0.07}
        />
        <LabOrbit target={[0, 0.14, 0]} minDistance={0.6} maxDistance={10} />
      </>
    );
  }

  return (
    <>
      <LabScenery />
      <BoxMass position={[0, 0.1, 0]} size={[0.16, 0.1, 0.1]} color="#1e3a5f" />
      <mesh position={[0.12, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.08, 12]} />
        <meshStandardMaterial
          color={sample.lit ? "#fbbf24" : "#64748b"}
          emissive="#f59e0b"
          emissiveIntensity={sample.lit ? 1.2 : 0}
        />
      </mesh>
      {sample.lit ? (
        <mesh position={[0.28, 0.12, 0]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial color="#fde68a" transparent opacity={0.28} />
        </mesh>
      ) : null}
      <SpriteLabel
        text={sample.lit ? "LED 已点亮" : "低于阈值"}
        color="#1e3a5f"
        position={[0, 0.32, 0]}
        height={0.07}
      />
      <LabOrbit target={[0.08, 0.12, 0]} minDistance={0.5} maxDistance={10} />
    </>
  );
}
