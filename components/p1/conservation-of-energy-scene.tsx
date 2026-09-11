"use client";

import { DoubleSide } from "three";

import { BoxMass, ForceWithXY, HelicalSpring, LabOrbit, LabScenery, TrailLine, VectorArrow } from "@/components/lab-3d";
import { helicalSpringPoints } from "@/lib/models/helical-spring";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import { formatLabNumber } from "@/lib/models/lab-format";
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

function springPointsToCart(
  sCart: number,
  thetaDeg: number,
  wallX: number,
  connected: boolean,
): [number, number, number][] {
  const hitchY = TRACK_SURFACE_Y + CART_HEIGHT * 0.45;
  const start: [number, number, number] = [wallX + 0.04, hitchY, 0];
  const cart = cartPlacement(connected ? sCart : Math.min(sCart, 0), thetaDeg);
  const theta = cart.tilt;
  const end: [number, number, number] = [
    cart.position[0] - Math.cos(theta) * (CART_SIZE[0] / 2),
    cart.position[1] - Math.sin(theta) * (CART_SIZE[0] / 2),
    0,
  ];
  if (!connected) {
    end[0] = Math.max(start[0] + 0.04, -0.04);
    end[1] = hitchY;
  }
  const span = Math.hypot(end[0] - start[0], end[1] - start[1]);
  if (span < 0.04) {
    return [start, end];
  }
  return helicalSpringPoints({
    start,
    end,
    coils: 9,
    radius: 0.02,
    pointsPerCoil: 22,
  });
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
  const wallX = -params.A - 0.52;
  const springPoints = springPointsToCart(sample.s, params.thetaDeg, wallX, sample.connected);
  const cartLocal = cartOnRampLocal(sample.s, rampLen);
  const worldCart = cartPlacement(sample.s, params.thetaDeg);
  const weight = params.m * params.g;
  const nMag = onRamp ? weight * Math.cos(theta) : weight;
  const nVec: [number, number, number] = onRamp
    ? [-Math.sin(theta) * nMag, Math.cos(theta) * nMag, 0]
    : [0, nMag, 0];

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
            text={`h = ${formatLabNumber(sample.y)} m`}
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
      {springPoints.length > 1 ? (
        <HelicalSpring points={springPoints} color="#A16207" radius={0.0048} />
      ) : null}
      <TrailLine points={trail} />
      {onRamp ? null : (
        <>
          <BoxMass position={worldCart.position} size={CART_SIZE} />
          <SpriteLabel
            text={`h = ${formatLabNumber(sample.y)} m`}
            color="#1e3a5f"
            position={[worldCart.position[0], worldCart.position[1] + 0.2, 0]}
            height={0.14}
          />
        </>
      )}
      <VectorArrow
        origin={worldCart.position}
        vector={[0, -weight, 0]}
        value={weight}
        unitLength={0.04}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.65}
      />
      <ForceWithXY
        origin={worldCart.position}
        vector={nVec}
        value={nMag}
        unitLength={0.04}
        color={FORCE_COLORS.N}
        label="N"
        scale={0.65}
      />
      <LabOrbit target={[0.3, 0.25, 0]} minDistance={1} />
    </>
  );
}
