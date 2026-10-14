"use client";

import { Line } from "@react-three/drei";
import { DoubleSide } from "three";

import { LabLine, LabOrbit, LabScenery, SphereMass, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { formatLabNumber } from "@/lib/models/lab-format";
import {
  droplets,
  holeYs,
  jetPath,
  paramsAtHole,
  range,
  type FluidMode,
  type FluidParams,
  type FluidSample,
} from "@/lib/models/fluid-dynamics";

export function FluidDynamicsScene({
  params,
  sample,
  mode = "single",
}: {
  params: FluidParams;
  sample: FluidSample;
  mode?: FluidMode;
}) {
  const tankW = 0.7;
  const tankD = 0.45;
  const tankHeight = Math.max(1, params.H + 0.16);
  const holes = holeYs(params, mode);

  return (
    <>
      <LabScenery />
      <mesh position={[0, tankHeight / 2, 0]}>
        <boxGeometry args={[tankW, tankHeight, tankD]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          transparent
          opacity={0.2}
          roughness={0.05}
          transmission={0.2}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, Math.max(0.01, params.H) / 2, 0]}>
        <boxGeometry args={[tankW - 0.045, Math.max(0.02, params.H), tankD - 0.045]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transparent
          opacity={0.5}
          roughness={0.12}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, params.H + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[tankW - 0.05, tankD - 0.05]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.86} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.018, 0]}>
        <boxGeometry args={[tankW + 0.06, 0.036, tankD + 0.06]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {holes.map((holeY, index) => {
        const holeParams = paramsAtHole(params, holeY);
        const path = jetPath(holeParams).map(
          (point) => [point.x + tankW / 2, point.y, 0] as [number, number, number],
        );
        const drops = droplets(holeParams, sample.t).map(
          (point) => [point.x + tankW / 2, Math.max(0.02, point.y), 0] as [number, number, number],
        );
        const R = range(holeParams);
        return (
          <group key={`${holeY}-${index}`}>
            <mesh position={[tankW / 2, holeY, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.032, 0.032, 0.065, 20]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {path.length > 1 ? (
              <Line points={path} color="#0284c7" lineWidth={4} />
            ) : null}
            {drops.map((drop, dropIndex) => (
              <SphereMass key={dropIndex} position={drop} radius={0.026} color="#0ea5e9" />
            ))}
            <LabLine
              points={[
                [tankW / 2, 0.025 + index * 0.008, 0],
                [tankW / 2 + R, 0.025 + index * 0.008, 0],
              ]}
              color="#a16207"
              lineWidth={1}
              dashed
            />
            <mesh
              position={[tankW / 2 + R, 0.028, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[0.045, 0.009, 8, 24]} />
              <meshBasicMaterial color="#a16207" />
            </mesh>
            <SpriteLabel
              text={`R = ${formatLabNumber(R)} m`}
              color="#b45309"
              position={[tankW / 2 + R, 0.14 + index * 0.12, 0]}
              height={0.12}
            />
          </group>
        );
      })}
      {mode === "single" ? (
        <>
          <SpriteLabel
            text={`v = ${formatLabNumber(sample.v)} m/s`}
            color={FORCE_COLORS.F}
            position={[tankW / 2 + 0.18, params.holeY + 0.12, 0]}
            height={0.14}
          />
          <VectorArrow
            origin={[tankW / 2, params.holeY, 0]}
            vector={[sample.v, 0, 0]}
            value={sample.v}
            unitLength={0.08}
            color={FORCE_COLORS.F}
            label="vx"
            unit="m/s"
            scale={0.7}
          />
          <SpriteLabel
            text={`vy = 0.00 m/s`}
            color={FORCE_COLORS.Fdash}
            position={[tankW / 2 + 0.18, params.holeY - 0.12, 0]}
            height={0.12}
          />
        </>
      ) : null}
      <SpriteLabel
        text={`液面 H = ${formatLabNumber(params.H)} m`}
        color="#0369a1"
        position={[-0.04, params.H + 0.11, 0]}
        height={0.12}
      />
      <LabOrbit target={[0.42, params.H * 0.45, 0]} />
    </>
  );
}
