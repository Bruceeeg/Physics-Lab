"use client";

import { DoubleSide } from "three";

import { BoxMass, LabLine, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { frictionForceLabel } from "@/lib/models/lab-format";
import {
  hangingPositions,
  lightMass,
  type AtwoodMode,
  type AtwoodParams,
  type AtwoodSample,
} from "@/lib/models/atwood-machine";

const COLOR_A = "#3d5a80";
const COLOR_B = "#a16207";

function pulleyArc(pulleyY: number, pulleyR: number) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 16; i += 1) {
    const a = Math.PI - (i / 16) * Math.PI;
    pts.push([pulleyR * Math.cos(a), pulleyY + pulleyR * Math.sin(a), 0]);
  }
  return pts;
}

export function AtwoodMachineScene({
  sample,
  params,
  mode = "classic",
}: {
  sample: AtwoodSample;
  params: AtwoodParams;
  mode?: AtwoodMode;
}) {
  const pos = hangingPositions(params, sample, mode);
  const g1 = params.m1 * params.g;
  const g2 = params.m2 * params.g;
  const light = lightMass(params);

  if (mode === "modified") {
    const cart = pos.A;
    const hangPos = pos.B;
    const fLabel = frictionForceLabel(sample.frictionKind);
    const tableLen = Math.max(1.6, params.travel + 1.1);
    const tableCenter = pos.cart0 + params.travel / 2;
    return (
      <>
        <LabScenery />
        <mesh position={[tableCenter, pos.tableY - 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[tableLen, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.6} side={DoubleSide} />
        </mesh>
        <mesh position={[0, pos.pulleyY + 0.18, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.36, 12]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, pos.pulleyY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[pos.pulleyR, pos.pulleyR, 0.05, 32]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <LabLine
          points={[cart, ...pulleyArc(pos.pulleyY, pos.pulleyR), hangPos]}
          color="#1e3a5f"
          lineWidth={1.5}
        />
        <BoxMass position={cart} size={[0.22, 0.12, 0.16]} color={COLOR_A} />
        <BoxMass position={hangPos} size={[0.16, 0.2, 0.16]} color={COLOR_B} />
        <SpriteLabel text="A" color={COLOR_A} position={[cart[0], cart[1] + 0.18, 0]} height={0.14} />
        <SpriteLabel text="B" color={COLOR_B} position={[hangPos[0], hangPos[1] + 0.2, 0]} height={0.14} />
        <VectorArrow origin={cart} vector={[sample.T, 0, 0]} value={sample.T} unitLength={0.04} color={FORCE_COLORS.F} label="T" unit="N" scale={0.55} labelOffset={[0, 0.18, 0]} />
        <VectorArrow origin={cart} vector={[-sample.f, 0, 0]} value={sample.f} unitLength={0.04} color={FORCE_COLORS.f} label={fLabel} unit="N" scale={0.55} labelOffset={[0, -0.18, 0]} />
        <VectorArrow origin={cart} vector={[0, sample.N, 0]} value={sample.N} unitLength={0.04} color={FORCE_COLORS.N} label="N" unit="N" scale={0.55} labelOffset={[0.18, 0.02, 0]} />
        <VectorArrow origin={cart} vector={[0, -g1, 0]} value={g1} unitLength={0.04} color={FORCE_COLORS.G} label="mgA" unit="N" scale={0.55} labelOffset={[-0.18, -0.02, 0]} />
        <VectorArrow origin={[hangPos[0], hangPos[1] + 0.14, 0]} vector={[0, sample.T, 0]} value={sample.T} unitLength={0.04} color={FORCE_COLORS.F} label="T" unit="N" scale={0.55} labelOffset={[0.18, 0.02, 0]} />
        <VectorArrow origin={hangPos} vector={[0, -g2, 0]} value={g2} unitLength={0.04} color={FORCE_COLORS.G} label="mgB" unit="N" scale={0.55} labelOffset={[-0.18, -0.02, 0]} />
        <SpriteLabel text={`轻物 ${light}`} color="#1e3a5f" position={[0, pos.pulleyY + 0.42, 0]} height={0.14} />
        <LabOrbit target={[0, pos.tableY, 0]} minDistance={1.4} />
      </>
    );
  }

  if (mode === "incline") {
    const cart = pos.A;
    const hangPos = pos.B;
    const theta = ((params.thetaDeg ?? 30) * Math.PI) / 180;
    const rampLen = Math.max(1.4, params.travel + 0.8);
    const mid: [number, number, number] = [
      -(rampLen / 2) * Math.cos(theta),
      pos.pulleyY - (rampLen / 2) * Math.sin(theta),
      0,
    ];
    return (
      <>
        <LabScenery />
        <mesh position={mid} rotation={[0, 0, -theta]}>
          <boxGeometry args={[rampLen, 0.05, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.65} side={DoubleSide} />
        </mesh>
        <mesh position={[0, pos.pulleyY + 0.16, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.32, 12]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, pos.pulleyY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[pos.pulleyR, pos.pulleyR, 0.05, 32]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <LabLine points={[cart, ...pulleyArc(pos.pulleyY, pos.pulleyR), hangPos]} color="#1e3a5f" lineWidth={1.5} />
        <BoxMass position={cart} size={[0.2, 0.12, 0.16]} color={COLOR_A} />
        <BoxMass position={hangPos} size={[0.16, 0.2, 0.16]} color={COLOR_B} />
        <SpriteLabel text="A" color={COLOR_A} position={[cart[0], cart[1] + 0.18, 0]} height={0.14} />
        <SpriteLabel text="B" color={COLOR_B} position={[hangPos[0], hangPos[1] + 0.2, 0]} height={0.14} />
        <VectorArrow origin={hangPos} vector={[0, -g2, 0]} value={g2} unitLength={0.04} color={FORCE_COLORS.G} label="mgB" unit="N" scale={0.55} labelOffset={[-0.18, -0.02, 0]} />
        <VectorArrow origin={[hangPos[0], hangPos[1] + 0.14, 0]} vector={[0, sample.T, 0]} value={sample.T} unitLength={0.04} color={FORCE_COLORS.F} label="T" unit="N" scale={0.55} labelOffset={[0.18, 0.02, 0]} />
        <VectorArrow origin={cart} vector={[0, -g1, 0]} value={g1} unitLength={0.04} color={FORCE_COLORS.G} label="mgA" unit="N" scale={0.55} labelOffset={[-0.18, -0.02, 0]} />
        <LabOrbit target={[0, pos.pulleyY * 0.45, 0]} minDistance={1.5} />
      </>
    );
  }

  const left = pos.A;
  const right = pos.B;
  const leftT = mode === "pulley" ? sample.T1 : sample.T;
  const thick = mode === "pulley" ? 0.08 : 0.05;
  const standH = pos.pulleyY + 0.18;

  return (
    <>
      <LabScenery />
      <mesh position={[0, standH / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, standH, 12]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, pos.pulleyY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[pos.pulleyR, pos.pulleyR, thick, 32]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <LabLine points={[left, ...pulleyArc(pos.pulleyY, pos.pulleyR), right]} color="#1e3a5f" lineWidth={1.5} />
      <BoxMass position={left} size={[0.16, 0.2, 0.16]} color={COLOR_A} />
      <BoxMass position={right} size={[0.18, 0.22, 0.16]} color={COLOR_B} />
      <SpriteLabel text="A" color={COLOR_A} position={[left[0], left[1] + 0.2, 0]} height={0.16} />
      <SpriteLabel text="B" color={COLOR_B} position={[right[0], right[1] + 0.22, 0]} height={0.16} />
      <VectorArrow
        origin={[left[0], left[1] + 0.14, 0]}
        vector={[0, leftT, 0]}
        value={leftT}
        unitLength={0.04}
        color={FORCE_COLORS.F}
        label={mode === "pulley" ? "T1" : "T"}
        unit="N"
        scale={0.55}
        labelOffset={[0.18, 0.02, 0]}
      />
      <VectorArrow origin={left} vector={[0, -g1, 0]} value={g1} unitLength={0.04} color={FORCE_COLORS.G} label="mgA" unit="N" scale={0.55} labelOffset={[-0.18, -0.02, 0]} />
      <VectorArrow
        origin={[right[0], right[1] + 0.16, 0]}
        vector={[0, sample.T, 0]}
        value={sample.T}
        unitLength={0.04}
        color={FORCE_COLORS.F}
        label={mode === "pulley" ? "T2" : "T"}
        unit="N"
        scale={0.55}
        labelOffset={[0.18, 0.02, 0]}
      />
      <VectorArrow origin={right} vector={[0, -g2, 0]} value={g2} unitLength={0.04} color={FORCE_COLORS.G} label="mgB" unit="N" scale={0.55} labelOffset={[-0.18, -0.02, 0]} />
      <SpriteLabel text={`轻物 ${light}`} color="#1e3a5f" position={[0, pos.pulleyY + 0.38, 0]} height={0.14} />
      <LabOrbit target={[0, pos.pulleyY * 0.45, 0]} minDistance={1.4} />
    </>
  );
}
