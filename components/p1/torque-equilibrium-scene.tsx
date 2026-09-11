"use client";

import { BoxMass, LabLine, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import {
  leverHang,
  leverStick,
  type TorqueParams,
  type TorqueSample,
} from "@/lib/models/torque-equilibrium";

export function TorqueEquilibriumScene({
  params,
  sample,
}: {
  params: TorqueParams;
  sample: TorqueSample;
}) {
  const fulcrum: [number, number, number] = [0, 0.46, 0];
  const theta = sample.theta;
  const dx = leverHang(params);
  const attach: [number, number, number] = [
    fulcrum[0] + dx * Math.cos(theta),
    fulcrum[1] + dx * Math.sin(theta) - 0.016,
    0,
  ];
  const hang: [number, number, number] = [attach[0], attach[1] - 0.28, 0];
  const cmLocal = leverStick(params);
  const cm: [number, number, number] = [
    fulcrum[0] + cmLocal * Math.cos(theta),
    fulcrum[1] + cmLocal * Math.sin(theta) - 0.04,
    0,
  ];
  const stickW = Math.min(0.16, 0.1 + 0.12 * (params.m / 0.4));

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.9]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.5} />
      </mesh>
      <mesh position={[fulcrum[0], fulcrum[1] - 0.22, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.44, 12]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={fulcrum} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.09, 0.16, 3]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <group position={fulcrum} rotation={[0, 0, theta]}>
        <mesh position={[params.L / 2 - params.f, 0, 0]}>
          <boxGeometry args={[params.L, 0.028, 0.08]} />
          <meshPhysicalMaterial color="#3d5a80" roughness={0.35} metalness={0.08} />
        </mesh>
      </group>
      <LabLine points={[attach, hang]} color="#1e3a5f" lineWidth={1.4} />
      <BoxMass position={hang} size={[stickW, stickW + 0.02, stickW]} color="#a16207" />
      <VectorArrow
        origin={cm}
        vector={[0, -params.M * params.g, 0]}
        value={params.M * params.g}
        unitLength={0.035}
        color={FORCE_COLORS.G}
        label="Mg"
        unit="N"
        scale={0.65}
      />
      <VectorArrow
        origin={[hang[0], hang[1] - stickW / 2, 0]}
        vector={[0, -params.m * params.g, 0]}
        value={params.m * params.g}
        unitLength={0.035}
        color={FORCE_COLORS.F}
        label="mg"
        unit="N"
        scale={0.65}
      />
      <SpriteLabel
        text={`Στ = ${sample.tau.toFixed(2)} N·m`}
        color="#1e3a5f"
        position={[0.15, fulcrum[1] + 0.28, 0]}
        height={0.14}
      />
      <LabOrbit target={[0, 0.35, 0]} minDistance={1.3} />
    </>
  );
}
