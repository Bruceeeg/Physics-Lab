"use client";

import { DoubleSide } from "three";

import { BoxMass, LabLine, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { frictionForceLabel } from "@/lib/models/lab-format";
import type { AtwoodMode, AtwoodParams, AtwoodSample } from "@/lib/models/atwood-machine";

export function AtwoodMachineScene({
  sample,
  params,
  mode = "classic",
}: {
  sample: AtwoodSample;
  params: AtwoodParams;
  mode?: AtwoodMode;
}) {
  const pulleyY = 1.25;
  const pulleyR = 0.12;
  const hang = 0.45;
  const g1 = params.m1 * params.g;
  const g2 = params.m2 * params.g;

  if (mode === "modified") {
    const cartX = -0.55 + sample.s;
    const cart: [number, number, number] = [cartX, 0.72, 0];
    const hangPos: [number, number, number] = [pulleyR, pulleyY - hang + sample.y2, 0];
    const edge: [number, number, number] = [0, pulleyY, 0];
    const fLabel = frictionForceLabel(sample.frictionKind);
    return (
      <>
        <LabScenery />
        <mesh position={[-0.45, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.3, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} side={DoubleSide} />
        </mesh>
        <mesh position={[0, pulleyY + 0.18, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 12]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, pulleyY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[pulleyR, pulleyR, 0.05, 32]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <LabLine points={[cart, [0, 0.72, 0], edge, hangPos]} color="#1e3a5f" lineWidth={1.5} />
        <BoxMass position={cart} size={[0.22, 0.12, 0.16]} color="#3d5a80" />
        <BoxMass position={hangPos} size={[0.16, 0.2, 0.16]} color="#a16207" />
        <VectorArrow
          origin={cart}
          vector={[sample.T, 0, 0]}
          value={sample.T}
          unitLength={0.04}
          color={FORCE_COLORS.F}
          label="T"
          unit="N"
          scale={0.55}
        />
        <VectorArrow
          origin={cart}
          vector={[-sample.f, 0, 0]}
          value={sample.f}
          unitLength={0.04}
          color={FORCE_COLORS.f}
          label={fLabel}
          unit="N"
          scale={0.55}
        />
        <VectorArrow
          origin={cart}
          vector={[0, sample.N, 0]}
          value={sample.N}
          unitLength={0.04}
          color={FORCE_COLORS.N}
          label="N"
          unit="N"
          scale={0.55}
        />
        <VectorArrow
          origin={cart}
          vector={[0, -g1, 0]}
          value={g1}
          unitLength={0.04}
          color={FORCE_COLORS.G}
          label="m1g"
          unit="N"
          scale={0.55}
        />
        <VectorArrow
          origin={[hangPos[0], hangPos[1] + 0.14, 0]}
          vector={[0, sample.T, 0]}
          value={sample.T}
          unitLength={0.04}
          color={FORCE_COLORS.F}
          label="T"
          unit="N"
          scale={0.55}
        />
        <VectorArrow
          origin={hangPos}
          vector={[0, -g2, 0]}
          value={g2}
          unitLength={0.04}
          color={FORCE_COLORS.G}
          label="m2g"
          unit="N"
          scale={0.55}
        />
        <LabOrbit target={[0, 0.7, 0]} minDistance={1.4} />
      </>
    );
  }

  const left: [number, number, number] = [-pulleyR, pulleyY - hang + sample.y1, 0];
  const right: [number, number, number] = [pulleyR, pulleyY - hang + sample.y2, 0];
  const leftTop: [number, number, number] = [-pulleyR, pulleyY, 0];
  const rightTop: [number, number, number] = [pulleyR, pulleyY, 0];
  const leftT = mode === "pulley" ? sample.T1 : sample.T;
  const thick = mode === "pulley" ? 0.08 : 0.05;

  return (
    <>
      <LabScenery />
      <mesh position={[0, pulleyY + 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.36, 12]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, pulleyY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[pulleyR, pulleyR, thick, 32]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <LabLine points={[leftTop, left]} color="#1e3a5f" lineWidth={1.5} />
      <LabLine points={[rightTop, right]} color="#1e3a5f" lineWidth={1.5} />
      <BoxMass position={left} size={[0.16, 0.2, 0.16]} color="#3d5a80" />
      <BoxMass position={right} size={[0.18, 0.22, 0.16]} color="#a16207" />
      <VectorArrow
        origin={[left[0], left[1] + 0.14, 0]}
        vector={[0, leftT, 0]}
        value={leftT}
        unitLength={0.04}
        color={FORCE_COLORS.F}
        label={mode === "pulley" ? "T1" : "T"}
        unit="N"
        scale={0.55}
      />
      <VectorArrow
        origin={left}
        vector={[0, -g1, 0]}
        value={g1}
        unitLength={0.04}
        color={FORCE_COLORS.G}
        label="m1g"
        unit="N"
        scale={0.55}
      />
      <VectorArrow
        origin={[right[0], right[1] + 0.16, 0]}
        vector={[0, sample.T, 0]}
        value={sample.T}
        unitLength={0.04}
        color={FORCE_COLORS.F}
        label={mode === "pulley" ? "T2" : "T"}
        unit="N"
        scale={0.55}
      />
      <VectorArrow
        origin={right}
        vector={[0, -g2, 0]}
        value={g2}
        unitLength={0.04}
        color={FORCE_COLORS.G}
        label="m2g"
        unit="N"
        scale={0.55}
      />
      <LabOrbit target={[0, 0.7, 0]} minDistance={1.4} />
    </>
  );
}
