"use client";

import { BoxMass, LabLine, LabOrbit, LabScenery, SphereMass, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { formatLabNumber } from "@/lib/models/lab-format";
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

  if (mode === "rod") {
    const length = params.R;
    const pivot: [number, number, number] = [0, length + 0.12, 0];
    const tip: [number, number, number] = [
      length * Math.sin(sample.theta),
      pivot[1] - length * Math.cos(sample.theta),
      0,
    ];
    const ball: [number, number, number] = [sample.stuck ? sample.x - length : 0, pivot[1] - length, 0];
    return (
      <>
        <LabScenery />
        <mesh position={pivot}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <LabLine points={[pivot, tip]} color="#1e3a5f" lineWidth={2.2} />
        <mesh position={[(pivot[0] + tip[0]) / 2, (pivot[1] + tip[1]) / 2, 0]} rotation={[0, 0, -sample.theta]}>
          <boxGeometry args={[0.045, length, 0.04]} />
          <meshStandardMaterial color="#3d5a80" />
        </mesh>
        <SphereMass position={ball} radius={0.06} color="#a16207" />
        <SpriteLabel
          text={sample.stuck ? `v = ${formatLabNumber(Math.abs(sample.v))} m/s` : `ω = ${formatLabNumber(sample.omega)} rad/s`}
          color="#1e3a5f"
          position={[0.15, pivot[1] * 0.55, 0]}
          height={0.16}
        />
        <LabOrbit target={[0, length * 0.45, 0]} minDistance={1.2} />
      </>
    );
  }

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
      {mode === "drop" && !sample.stuck ? (
        <>
          <BoxMass position={drop} size={[0.1, 0.08, 0.1]} color="#a16207" />
          <VectorArrow
            origin={drop}
            vector={[0, -params.m * params.g, 0]}
            value={params.m * params.g}
            unitLength={0.05}
            color={FORCE_COLORS.G}
            label="mg"
            unit="N"
            scale={0.7}
          />
        </>
      ) : null}
      <SphereMass position={[0, diskY, 0]} radius={0.03} color="#334155" />
      <SpriteLabel
        text={`ω = ${formatLabNumber(sample.omega)} rad/s`}
        color="#1e3a5f"
        position={[0, 0.55, 0]}
        height={0.16}
      />
      <LabOrbit target={[0, 0.25, 0]} minDistance={1.2} />
    </>
  );
}
