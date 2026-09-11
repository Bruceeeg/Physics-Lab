"use client";

import { LabLine, LabOrbit, LabScenery, SphereMass, VectorArrow } from "@/components/lab-3d";
import { FORCE_COLORS } from "@/lib/models/force-display";
import type { ElectricMode, ElectricParams, ElectricSample } from "@/lib/models/electric-field";

function fieldLines(mode: ElectricMode, d: number): [number, number, number][][] {
  if (mode === "dipole") {
    return [
      [[-d / 2, 0.02, 0], [-0.02, 0.12, 0], [d / 2, 0.02, 0]],
      [[-d / 2, -0.02, 0], [-0.02, -0.12, 0], [d / 2, -0.02, 0]],
      [[-d / 2, 0, 0.04], [0, 0, 0.14], [d / 2, 0, 0.04]],
    ];
  }
  const rays: [number, number, number][][] = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i * Math.PI) / 4;
    rays.push([
      [0.05 * Math.cos(a), 0.08 + 0.05 * Math.sin(a), 0],
      [0.32 * Math.cos(a), 0.08 + 0.32 * Math.sin(a), 0],
    ]);
  }
  return rays;
}

export function ElectricFieldScene({
  params,
  sample,
  mode,
}: {
  params: ElectricParams;
  sample: ElectricSample;
  mode: ElectricMode;
}) {
  if (mode === "pith") {
    const L = (params.pithL_cm ?? 50) / 100;
    const pivotY = L + 0.15;
    const half = sample.r / 2;
    const left: [number, number, number] = [-half, pivotY - L * Math.cos(sample.theta), 0];
    const right: [number, number, number] = [half, left[1], 0];
    return (
      <>
        <LabScenery />
        <mesh position={[0, pivotY, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 10]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <LabLine points={[[-0.08, pivotY, 0], left]} color="#1e3a5f" lineWidth={1.4} />
        <LabLine points={[[0.08, pivotY, 0], right]} color="#1e3a5f" lineWidth={1.4} />
        <SphereMass position={left} radius={0.04} color="#b45309" />
        <SphereMass position={right} radius={0.04} color="#1e3a5f" />
        <LabOrbit target={[0, pivotY * 0.45, 0]} minDistance={0.8} maxDistance={10} />
      </>
    );
  }

  const d = params.d_cm / 100;
  const probe: [number, number, number] = [sample.r, 0.08, 0];
  const R = (params.R_cm ?? 10) / 100;

  return (
    <>
      <LabScenery />
      {mode === "dipole" ? (
        <>
          <SphereMass position={[-d / 2, 0.08, 0]} radius={0.045} color="#b45309" />
          <SphereMass position={[d / 2, 0.08, 0]} radius={0.045} color="#1e3a5f" />
        </>
      ) : mode === "gauss" ? (
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[R, 24, 16]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.35} metalness={0.2} />
        </mesh>
      ) : (
        <SphereMass position={[0, 0.08, 0]} radius={0.05} color="#b45309" />
      )}
      {mode === "equipotential"
        ? [0.08, 0.14, 0.22, 0.3].map((rad) => (
            <mesh key={rad} position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[rad, 0.004, 8, 48]} />
              <meshStandardMaterial color="#a16207" />
            </mesh>
          ))
        : fieldLines(mode === "gauss" ? "point" : mode, d).map((points, index) => (
            <LabLine key={index} points={points} color="#a16207" dashed lineWidth={1.2} />
          ))}
      <SphereMass position={probe} radius={0.028} color="#2563eb" />
      <VectorArrow
        origin={probe}
        vector={[sample.Ex, 0, 0]}
        value={sample.E}
        unitLength={0.000002}
        color={FORCE_COLORS.F}
        label="E"
        unit="N/C"
        scale={0.7}
      />
      <LabOrbit target={[0.12, 0.1, 0]} minDistance={0.6} maxDistance={10} />
    </>
  );
}
