"use client";

import { Line } from "@react-three/drei";
import { DoubleSide } from "three";

import { LabOrbit, LabScenery, SphereMass } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import {
  jetPath,
  droplets,
  type FluidParams,
  type FluidSample,
} from "@/lib/models/fluid-dynamics";

export function FluidDynamicsScene({
  params,
  sample,
}: {
  params: FluidParams;
  sample: FluidSample;
}) {
  const tankW = 0.7;
  const tankD = 0.45;
  const path = jetPath(params).map((point) => [point.x + tankW / 2, point.y, 0] as [number, number, number]);
  const drops = droplets(params, sample.t).map(
    (point) => [point.x + tankW / 2, Math.max(0.02, point.y), 0] as [number, number, number],
  );

  return (
    <>
      <LabScenery />
      <mesh position={[0, params.H / 2, 0]}>
        <boxGeometry args={[tankW, params.H, tankD]} />
        <meshPhysicalMaterial
          color="#64748b"
          transparent
          opacity={0.12}
          roughness={0.1}
          metalness={0.05}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, params.H / 2, 0]}>
        <boxGeometry args={[tankW - 0.04, params.H - 0.02, tankD - 0.04]} />
        <meshPhysicalMaterial color="#3d5a80" transparent opacity={0.32} roughness={0.2} />
      </mesh>
      <mesh position={[tankW / 2, params.holeY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {path.length > 1 ? (
        <Line points={path} color="#1e3a5f" lineWidth={1.2} dashed dashSize={0.05} gapSize={0.04} />
      ) : null}
      {drops.map((drop, index) => (
        <SphereMass key={index} position={drop} radius={0.028} color="#1e3a5f" />
      ))}
      <SpriteLabel
        text={`v = ${sample.v.toFixed(2)} m/s`}
        color={FORCE_COLORS.F}
        position={[tankW / 2 + 0.18, params.holeY + 0.12, 0]}
        height={0.14}
      />
      <SpriteLabel
        text={`R = ${sample.R.toFixed(2)} m`}
        color="#b45309"
        position={[tankW / 2 + sample.R, 0.16, 0]}
        height={0.14}
      />
      <LabOrbit target={[0.4, params.H * 0.4, 0]} />
    </>
  );
}
