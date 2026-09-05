"use client";

import { DoubleSide } from "three";

import { BoxMass, LabLine, LabOrbit, LabScenery, TrailLine } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import {
  attachedSMax,
  CART_HEIGHT,
  CART_SIZE,
  cartOnRampLocal,
  cartPlacement,
  maxHeight,
  RAMP_THICKNESS,
  rampMeshPlacement,
  TRACK_SURFACE_Y,
  type EnergyParams,
  type EnergySample,
} from "@/lib/models/conservation-of-energy";

function springPointsAlongTrack(
  sCart: number,
  thetaDeg: number,
  wallX: number,
  connected: boolean,
): [number, number, number][] {
  const sStart = wallX + 0.04;
  const sEnd = connected ? sCart - CART_SIZE[0] / 2 : -0.02;
  const actualEnd = Math.max(sStart + 0.03, sEnd);
  const coils = 10;
  const steps = coils * 4;
  const theta = (thetaDeg * Math.PI) / 180;
  const points: [number, number, number][] = [];
  for (let index = 0; index <= steps; index += 1) {
    const u = index / steps;
    const s = sStart + u * (actualEnd - sStart);
    const onRamp = s > 0;
    const nx = onRamp ? -Math.sin(theta) : 0;
    const ny = onRamp ? Math.cos(theta) : 1;
    const x = onRamp ? s * Math.cos(theta) : s;
    const y = TRACK_SURFACE_Y + (onRamp ? s * Math.sin(theta) : 0);
    const lift = CART_HEIGHT * 0.45;
    const wobble = 0.035 * Math.cos(index * 0.9);
    const z = 0.048 * Math.sin(index * 0.9);
    points.push([x + nx * (lift + wobble), y + ny * (lift + wobble), z]);
  }
  return points;
}

export function ConservationOfEnergyScene({
  params,
  sample,
  trail,
}: {
  params: EnergyParams;
  sample: EnergySample;
  trail: [number, number, number][];
}) {
  const theta = (params.thetaDeg * Math.PI) / 180;
  const sinT = Math.sin(theta) || 1;
  const rampLen = Math.max(1.2, Math.max(maxHeight(params) / sinT, attachedSMax(params)) + 0.3);
  const ramp = rampMeshPlacement(rampLen, params.thetaDeg);
  const onRamp = sample.s > 0;
  const wallX = -params.A - 0.22;
  const springPoints = springPointsAlongTrack(sample.s, params.thetaDeg, wallX, sample.connected);
  const cartLocal = cartOnRampLocal(sample.s, rampLen);
  const worldCart = cartPlacement(sample.s, params.thetaDeg);

  return (
    <>
      <LabScenery />
      <mesh position={[(wallX - 0.4) / 2, TRACK_SURFACE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.55} side={DoubleSide} />
      </mesh>
      <group position={ramp.position} rotation={[0, 0, ramp.tilt]}>
        <mesh>
          <boxGeometry args={[rampLen, RAMP_THICKNESS, 0.46]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        {onRamp ? <BoxMass position={cartLocal} size={CART_SIZE} /> : null}
        {onRamp ? (
          <SpriteLabel
            text={`h = ${sample.y.toFixed(2)} m`}
            color="#1e3a5f"
            position={[cartLocal[0], cartLocal[1] + CART_HEIGHT / 2 + 0.12, 0]}
            height={0.14}
          />
        ) : null}
      </group>
      <mesh position={[wallX, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.44, 0.4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {springPoints.length > 1 ? <LabLine points={springPoints} color="#b45309" lineWidth={1.6} /> : null}
      <TrailLine points={trail} />
      {onRamp ? null : (
        <>
          <BoxMass position={worldCart.position} size={CART_SIZE} />
          <SpriteLabel
            text={`h = ${sample.y.toFixed(2)} m`}
            color="#1e3a5f"
            position={[worldCart.position[0], worldCart.position[1] + 0.2, 0]}
            height={0.14}
          />
        </>
      )}
      <LabOrbit target={[0.3, 0.25, 0]} minDistance={1} />
    </>
  );
}
