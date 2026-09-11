"use client";

import { DoubleSide } from "three";

import { ForceWithXY, LabLine, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { formatLabNumber } from "@/lib/models/lab-format";
import type { CircularMode, CircularParams, CircularSample } from "@/lib/models/circular-motion";

export function CircularMotionScene({
  params,
  sample,
  trail,
  mode = "conical",
}: {
  params: CircularParams;
  sample: CircularSample;
  trail: [number, number, number][];
  mode?: CircularMode;
}) {
  const weight = params.m * params.g;

  if (mode === "horizontal") {
    const bob: [number, number, number] = [sample.x, 0.09, sample.z];
    const ring = Array.from({ length: 65 }, (_, index) => {
      const phi = (index / 64) * Math.PI * 2;
      return [sample.r * Math.cos(phi), 0.09, sample.r * Math.sin(phi)] as [number, number, number];
    });
    return (
      <>
        <LabScenery />
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[Math.max(0.4, sample.r + 0.2), 48]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} side={DoubleSide} />
        </mesh>
        <SphereMass position={[0, 0.09, 0]} radius={0.03} color="#334155" />
        <LabLine points={[[0, 0.09, 0], bob]} color="#1e3a5f" lineWidth={1.5} />
        {sample.r > 0.02 ? <LabLine points={ring} color="#94a3b8" lineWidth={1} dashed /> : null}
        <TrailLine points={trail} />
        <SphereMass position={bob} radius={0.07} />
        <VectorArrow
          origin={bob}
          vector={[-sample.x, 0, -sample.z]}
          value={sample.tension}
          unitLength={0.08}
          color={FORCE_COLORS.F}
          label="T"
          unit="N"
          scale={0.8}
        />
        <VectorArrow
          origin={bob}
          vector={[0, -weight, 0]}
          value={weight}
          unitLength={0.06}
          color={FORCE_COLORS.G}
          label="mg"
          unit="N"
          scale={0.7}
        />
        <VectorArrow
          origin={bob}
          vector={[0, weight, 0]}
          value={weight}
          unitLength={0.06}
          color={FORCE_COLORS.N}
          label="N"
          unit="N"
          scale={0.7}
        />
        <LabOrbit target={[0, 0.15, 0]} />
      </>
    );
  }

  if (mode === "vertical") {
    const lift = params.r + 0.08;
    const bob: [number, number, number] = [sample.x, lift + sample.y, 0];
    const center: [number, number, number] = [0, lift, 0];
    const ring = Array.from({ length: 65 }, (_, index) => {
      const phi = (index / 64) * Math.PI * 2;
      return [params.r * Math.sin(phi), lift - params.r * Math.cos(phi), 0] as [number, number, number];
    });
    const tVec: [number, number, number] = [-sample.x, -sample.y, 0];
    return (
      <>
        <LabScenery />
        <SphereMass position={center} radius={0.03} color="#334155" />
        <LabLine points={[center, bob]} color="#1e3a5f" lineWidth={1.5} />
        <LabLine points={ring} color="#94a3b8" lineWidth={1} dashed />
        <TrailLine points={trail} />
        <SphereMass position={bob} radius={0.07} />
        <ForceWithXY
          origin={bob}
          vector={tVec}
          value={sample.tension}
          unitLength={0.08}
          color={FORCE_COLORS.F}
          label="T"
          scale={0.8}
        />
        <VectorArrow
          origin={bob}
          vector={[0, -weight, 0]}
          value={weight}
          unitLength={0.06}
          color={FORCE_COLORS.G}
          label="mg"
          unit="N"
          scale={0.7}
        />
        <SpriteLabel
          text={`v = ${formatLabNumber(sample.speed)} m/s`}
          color="#1e3a5f"
          position={[0, lift + params.r + 0.22, 0]}
          height={0.16}
        />
        <LabOrbit target={[0, lift, 0]} />
      </>
    );
  }

  const pivotY = params.L + 0.08;
  const bob: [number, number, number] = [sample.x, pivotY + sample.y, sample.z];
  const pivot: [number, number, number] = [0, pivotY, 0];
  const orbitY = bob[1];
  const ring = Array.from({ length: 65 }, (_, index) => {
    const phi = (index / 64) * Math.PI * 2;
    return [sample.r * Math.cos(phi), orbitY, sample.r * Math.sin(phi)] as [number, number, number];
  });
  const tVec: [number, number, number] = [-sample.x, -sample.y, -sample.z];

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.04, 24]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, pivotY / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, pivotY, 12]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <SphereMass position={pivot} radius={0.035} color="#334155" />
      <LabLine points={[pivot, bob]} color="#1e3a5f" lineWidth={1.5} />
      {sample.r > 0.02 ? <LabLine points={ring} color="#94a3b8" lineWidth={1} dashed /> : null}
      <TrailLine points={trail} />
      <SphereMass position={bob} radius={0.07} />
      <ForceWithXY
        origin={bob}
        vector={tVec}
        value={sample.tension}
        unitLength={0.08}
        color={FORCE_COLORS.F}
        label="T"
        scale={0.8}
      />
      <VectorArrow
        origin={bob}
        vector={[0, -weight, 0]}
        value={weight}
        unitLength={0.06}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.7}
      />
      <SpriteLabel
        text={`T = ${formatLabNumber(sample.T)} s`}
        color="#1e3a5f"
        position={[0, pivotY + 0.18, 0]}
        height={0.16}
      />
      <LabOrbit target={[0, pivotY * 0.45, 0]} />
    </>
  );
}
