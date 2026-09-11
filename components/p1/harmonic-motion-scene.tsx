"use client";

import { DoubleSide } from "three";

import { BoxMass, ForceWithXY, HelicalSpring, LabLine, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { helicalSpringPoints } from "@/lib/models/helical-spring";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { HarmonicMode, HarmonicParams, HarmonicSample } from "@/lib/models/harmonic-motion";

export function HarmonicMotionScene({
  params,
  sample,
  trail,
  mode = "pendulum",
}: {
  params: HarmonicParams;
  sample: HarmonicSample;
  trail: [number, number, number][];
  mode?: HarmonicMode;
}) {
  const weight = params.m * params.g;

  if (mode === "spring") {
    const wallX = -params.A - 0.28;
    const block: [number, number, number] = [sample.x, 0.12, 0];
    const coils = helicalSpringPoints({
      start: [wallX + 0.04, 0.12, 0],
      end: [sample.x - 0.08, 0.12, 0],
      coils: 10,
      radius: 0.032,
      pointsPerCoil: 14,
    });
    const fs = -params.k * sample.x;
    return (
      <>
        <LabScenery />
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.2, 0.55]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} side={DoubleSide} />
        </mesh>
        <mesh position={[wallX, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.4, 0.36]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {coils.length > 1 ? <HelicalSpring points={coils} color="#A16207" radius={0.007} /> : null}
        <TrailLine points={trail} />
        <BoxMass position={block} size={[0.16, 0.12, 0.14]} />
        <VectorArrow
          origin={block}
          vector={[fs, 0, 0]}
          value={fs}
          unitLength={0.05}
          color={FORCE_COLORS.F}
          label="Fs"
          unit="N"
          scale={0.75}
        />
        <VectorArrow
          origin={block}
          vector={[0, weight, 0]}
          value={weight}
          unitLength={0.04}
          color={FORCE_COLORS.N}
          label="N"
          unit="N"
          scale={0.65}
        />
        <VectorArrow
          origin={block}
          vector={[0, -weight, 0]}
          value={weight}
          unitLength={0.04}
          color={FORCE_COLORS.G}
          label="mg"
          unit="N"
          scale={0.65}
        />
        <LabOrbit target={[0, 0.15, 0]} minDistance={1.2} />
      </>
    );
  }

  if (mode === "physical") {
    const pivotY = params.L + 0.1;
    const pivot: [number, number, number] = [0, pivotY, 0];
    const cm: [number, number, number] = [sample.x, pivotY + sample.y, 0];
    return (
      <>
        <LabScenery />
        <mesh position={[0, pivotY / 2, 0]}>
          <cylinderGeometry args={[0.028, 0.028, pivotY, 12]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, pivotY, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.36, 12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <group position={pivot} rotation={[0, 0, sample.theta]}>
          <mesh position={[0, -params.L / 2 + (params.pivotFrac ?? 0) * params.L, 0]}>
            <boxGeometry args={[0.05, params.L, 0.03]} />
            <meshStandardMaterial color="#3d5a80" />
          </mesh>
        </group>
        <TrailLine points={trail} />
        <VectorArrow
          origin={cm}
          vector={[0, -weight, 0]}
          value={weight}
          unitLength={0.06}
          color={FORCE_COLORS.G}
          label="mg"
          unit="N"
          scale={0.8}
        />
        <LabOrbit target={[0, pivotY * 0.45, 0]} />
      </>
    );
  }

  const pivotY = params.L + 0.1;
  const pivot: [number, number, number] = [0, pivotY, 0];
  const bob: [number, number, number] = [sample.x, pivotY + sample.y, 0];
  const tension = params.m * (params.g * Math.cos(sample.theta) + params.L * sample.omega * sample.omega);
  const tVec: [number, number, number] = [-sample.x, -sample.y, 0];

  return (
    <>
      <LabScenery />
      <mesh position={[0, pivotY / 2, 0]}>
        <cylinderGeometry args={[0.028, 0.028, pivotY, 12]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, pivotY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.36, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <LabLine points={[pivot, bob]} color="#1e3a5f" lineWidth={1.6} />
      <TrailLine points={trail} />
      <SphereMass position={bob} radius={0.075} />
      <ForceWithXY
        origin={bob}
        vector={tVec}
        value={tension}
        unitLength={0.06}
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
        scale={0.8}
      />
      <LabOrbit target={[0, pivotY * 0.45, 0]} />
    </>
  );
}
