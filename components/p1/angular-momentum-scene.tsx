"use client";

import { BoxMass, LabOrbit, LabScenery, SphereMass } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import type { AngMomMode, AngMomParams, AngMomSample } from "@/lib/models/angular-momentum";

export function AngularMomentumScene({
  params,
  sample,
  mode = "drop",
}: {
  params: AngMomParams;
  sample: AngMomSample;
  mode?: AngMomMode;
}) {
  const diskY = 0.18;
  const cubeHalf = 0.04;
  const seatY = diskY + 0.025 + cubeHalf;
  const drop: [number, number, number] = [params.r, seatY + sample.y, 0];
  const arm = params.R * (sample.stuck && mode === "skater" ? (params.IScale ?? 0.45) : 0.85);

  return (
    <>
      <LabScenery />
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.16, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <group rotation={[0, sample.phi, 0]}>
        <mesh position={[0, diskY, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[params.R, params.R, 0.05, 48]} />
          <meshPhysicalMaterial color="#3d5a80" roughness={0.3} metalness={0.18} />
        </mesh>
        <mesh position={[arm * 0.55, diskY + 0.03, 0]}>
          <boxGeometry args={[0.04, 0.02, arm]} />
          <meshBasicMaterial color="#a16207" />
        </mesh>
        {mode === "drop" && sample.stuck ? (
          <BoxMass position={[params.r, seatY, 0]} size={[0.1, 0.08, 0.1]} color="#a16207" />
        ) : null}
      </group>
      {mode === "drop" && !sample.stuck ? <BoxMass position={drop} size={[0.1, 0.08, 0.1]} color="#a16207" /> : null}
      <SphereMass position={[0, diskY, 0]} radius={0.03} color="#334155" />
      <SpriteLabel
        text={`ω = ${sample.omega.toFixed(2)} rad/s`}
        color="#1e3a5f"
        position={[0, 0.55, 0]}
        height={0.16}
      />
      <LabOrbit target={[0, 0.25, 0]} minDistance={1.2} />
    </>
  );
}
