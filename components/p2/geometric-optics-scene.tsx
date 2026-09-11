"use client";

import { LabLine, LabOrbit, LabScenery } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import type { OpticsMode, OpticsSample } from "@/lib/models/geometric-optics";

export function GeometricOpticsScene({
  sample,
  mode,
}: {
  sample: OpticsSample;
  mode: OpticsMode;
}) {
  const scale = 1.2;
  const objectX = -sample.s * scale;
  const imageX = Number.isFinite(sample.sp) ? sample.sp * scale : 1.4;
  const h = 0.12;
  const hp = Number.isFinite(sample.hp) ? Math.max(-0.28, Math.min(0.28, sample.hp * 4)) : 0;
  const lensR = mode === "convex" ? 0.16 : 0.16;

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 0.28]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[lensR, 16, 12]} />
        <meshPhysicalMaterial
          color="#94a3b8"
          transparent
          opacity={0.22}
          roughness={0.05}
        />
      </mesh>
      <LabLine points={[[objectX, 0.06, 0], [objectX, 0.06 + h, 0]]} color="#1e3a5f" lineWidth={2} />
      {Number.isFinite(sample.sp) ? (
        <LabLine
          points={[[imageX, 0.06, 0], [imageX, 0.06 + hp, 0]]}
          color="#a16207"
          lineWidth={2}
          dashed={!sample.real}
        />
      ) : null}
      <LabLine points={[[objectX, 0.06 + h, 0], [0, 0.14, 0], [imageX, 0.06 + hp, 0]]} color="#b45309" lineWidth={1.2} />
      <LabLine points={[[objectX, 0.06 + h, 0], [0, 0.06 + h, 0], [imageX, 0.06 + hp, 0]]} color="#2563eb" lineWidth={1.2} />
      <SpriteLabel text="物" color="#1e3a5f" position={[objectX, 0.28, 0]} height={0.07} />
      {Number.isFinite(sample.sp) ? (
        <SpriteLabel text={sample.real ? "实像" : "虚像"} color="#a16207" position={[imageX, 0.28, 0]} height={0.07} />
      ) : null}
      <LabOrbit target={[0, 0.12, 0]} minDistance={0.8} maxDistance={14} />
    </>
  );
}
