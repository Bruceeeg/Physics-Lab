"use client";

import { DoubleSide } from "three";

import { BoxMass, HelicalSpring, LabLine, LabOrbit, LabScenery, SphereMass, TrailLine, VectorArrow } from "@/components/lab-3d";
import { helicalSpringPoints } from "@/lib/models/helical-spring";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { VariableForceMode, VariableForceParams, VariableForceSample } from "@/lib/models/variable-force";

export function VariableForceScene({
  params,
  sample,
  trail,
  mode,
}: {
  params: VariableForceParams;
  sample: VariableForceSample;
  trail: [number, number, number][];
  mode: VariableForceMode;
}) {
  if (mode === "rocket") {
    const body: [number, number, number] = [0, 0.12 + sample.y * 0.35, 0];
    return (
      <>
        <LabScenery />
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} side={DoubleSide} />
        </mesh>
        <TrailLine points={trail} />
        <mesh position={body}>
          <cylinderGeometry args={[0.06, 0.08, 0.28, 12]} />
          <meshStandardMaterial color="#3d5a80" />
        </mesh>
        <VectorArrow origin={body} vector={[0, sample.Fy, 0]} value={sample.F} unitLength={0.03} color={FORCE_COLORS.F} label="Fnet" unit="N" scale={0.5} />
        <VectorArrow origin={body} vector={[0, -params.m * params.g, 0]} value={params.m * params.g} unitLength={0.03} color={FORCE_COLORS.G} label="mg" unit="N" scale={0.5} />
        <LabOrbit target={[0, 0.8, 0]} minDistance={1.4} />
      </>
    );
  }

  if (mode === "pulley") {
    const block: [number, number, number] = [sample.x, 0.1, 0];
    const anchor: [number, number, number] = [0, params.H, 0];
    return (
      <>
        <LabScenery />
        <mesh position={[params.x0 / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[params.x0 + 0.6, 0.55]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} side={DoubleSide} />
        </mesh>
        <mesh position={[0, params.H / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, params.H, 10]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <LabLine points={[anchor, block]} color="#1e3a5f" lineWidth={1.6} />
        <TrailLine points={trail} />
        <BoxMass position={block} size={[0.18, 0.12, 0.14]} />
        <VectorArrow origin={block} vector={[sample.Fx, sample.Fy, 0]} value={sample.F} unitLength={0.04} color={FORCE_COLORS.F} label="T" unit="N" scale={0.55} />
        <VectorArrow origin={block} vector={[-sample.f, 0, 0]} value={sample.f} unitLength={0.04} color={FORCE_COLORS.f} label="fk" unit="N" scale={0.55} />
        <VectorArrow origin={block} vector={[0, sample.N, 0]} value={sample.N} unitLength={0.04} color={FORCE_COLORS.N} label="N" unit="N" scale={0.55} />
        <VectorArrow origin={block} vector={[0, -params.m * params.g, 0]} value={params.m * params.g} unitLength={0.04} color={FORCE_COLORS.G} label="mg" unit="N" scale={0.55} />
        <LabOrbit target={[params.x0 / 2, 0.2, 0]} minDistance={1.4} />
      </>
    );
  }

  const wallX = -params.A - 0.32;
  const block: [number, number, number] = [sample.x, 0.12, 0];
  const coils = helicalSpringPoints({
    start: [wallX + 0.04, 0.12, 0],
    end: [sample.x - 0.08, 0.12, 0],
    coils: 10,
    radius: 0.03,
    pointsPerCoil: 12,
  });
  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} side={DoubleSide} />
      </mesh>
      <mesh position={[wallX, 0.2, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.36]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {mode === "fx" && coils.length > 1 ? <HelicalSpring points={coils} color="#A16207" radius={0.007} /> : null}
      {mode === "ft" ? <SphereMass position={[sample.x + 0.28, 0.12, 0]} radius={0.08} color="#a16207" /> : null}
      <TrailLine points={trail} />
      <BoxMass position={block} size={[0.16, 0.12, 0.14]} />
      <VectorArrow origin={block} vector={[sample.Fx, 0, 0]} value={sample.F} unitLength={0.04} color={FORCE_COLORS.F} label="F" unit="N" scale={0.6} />
      <VectorArrow origin={block} vector={[0, params.m * params.g, 0]} value={params.m * params.g} unitLength={0.04} color={FORCE_COLORS.N} label="N" unit="N" scale={0.55} />
      <VectorArrow origin={block} vector={[0, -params.m * params.g, 0]} value={params.m * params.g} unitLength={0.04} color={FORCE_COLORS.G} label="mg" unit="N" scale={0.55} />
      <LabOrbit target={[0, 0.15, 0]} minDistance={1.2} />
    </>
  );
}
