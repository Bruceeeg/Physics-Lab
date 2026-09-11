"use client";

import { DoubleSide } from "three";

import { ForceWithXY, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { formatLabNumber, frictionForceLabel } from "@/lib/models/lab-format";
import type { RollingParams, RollingSample } from "@/lib/models/rotational-motion";
import { pathLength } from "@/lib/models/rotational-motion";

export function RotationalMotionScene({
  params,
  sample,
  trail,
}: {
  params: RollingParams;
  sample: RollingSample;
  trail: [number, number, number][];
}) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  const length = pathLength(params);
  const body: [number, number, number] = [sample.x, sample.y + params.r, 0];
  const roll = -sample.s / params.r;
  const nVec: [number, number, number] = [Math.sin(theta) * sample.N, Math.cos(theta) * sample.N, 0];
  const fVec: [number, number, number] = [-Math.cos(theta) * sample.f, Math.sin(theta) * sample.f, 0];
  const weight = params.m * params.g;

  return (
    <>
      <LabScenery />
      <mesh
        position={[(length * Math.cos(theta)) / 2, params.h / 2, 0]}
        rotation={[0, 0, -theta]}
      >
        <boxGeometry args={[length, 0.05, 0.7]} />
        <meshStandardMaterial color="#cbd5e1" side={DoubleSide} />
      </mesh>
      <mesh position={[length * Math.cos(theta) + 0.35, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.7]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.45} side={DoubleSide} />
      </mesh>
      <TrailLine points={trail} />
      <group position={body} rotation={[0, 0, roll]}>
        {params.shape === "hoop" ? (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[params.r, params.r * 0.12, 12, 48]} />
            <meshPhysicalMaterial color="#3d5a80" roughness={0.25} metalness={0.2} />
          </mesh>
        ) : params.shape === "disk" ? (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[params.r, params.r, params.r * 0.35, 32]} />
            <meshPhysicalMaterial color="#3d5a80" roughness={0.28} metalness={0.15} />
          </mesh>
        ) : (
          <SphereMass position={[0, 0, 0]} radius={params.r} color={params.shape === "hollow-sphere" ? "#64748b" : "#3d5a80"} />
        )}
        <mesh>
          <boxGeometry args={[params.r * 1.6, 0.012, 0.012]} />
          <meshBasicMaterial color="#a16207" />
        </mesh>
      </group>
      <SpriteLabel
        text={`v = ${formatLabNumber(sample.v)} m/s`}
        color="#1e3a5f"
        position={[body[0], body[1] + params.r + 0.16, 0]}
        height={0.14}
      />
      <VectorArrow
        origin={body}
        vector={[0, -weight, 0]}
        value={weight}
        unitLength={0.04}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.65}
      />
      <ForceWithXY
        origin={body}
        vector={nVec}
        value={sample.N}
        unitLength={0.04}
        color={FORCE_COLORS.N}
        label="N"
        scale={0.65}
      />
      <ForceWithXY
        origin={body}
        vector={fVec}
        value={sample.f}
        unitLength={0.04}
        color={FORCE_COLORS.f}
        label={frictionForceLabel(sample.frictionKind)}
        scale={0.65}
      />
      <LabOrbit target={[length * 0.35, params.h * 0.4, 0]} />
    </>
  );
}
