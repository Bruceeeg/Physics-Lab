"use client";

import { useEffect, useMemo } from "react";
import { DoubleSide, ExtrudeGeometry, Shape } from "three";

import { BoxMass, LabOrbit, LabScenery, VectorArrow } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";
import {
  BLOCK_HEIGHT,
  BLOCK_SIZE,
  RAMP_WIDTH,
  SURFACE_Y,
  TABLE_THICKNESS,
  blockPlacement,
  thetaRad,
  toeX,
  type InclineParams,
  type InclineSample,
} from "@/lib/models/incline-friction";

function InclineWedge({ length, theta, width }: { length: number; theta: number; width: number }) {
  const geometry = useMemo(() => {
    const run = length * Math.cos(theta);
    const rise = length * Math.sin(theta);
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(run, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    const next = new ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    next.translate(0, 0, -width / 2);
    return next;
  }, [length, theta, width]);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#64748b" side={DoubleSide} />
    </mesh>
  );
}

export function InclineFrictionScene({
  params,
  sample,
}: {
  params: InclineParams;
  sample: InclineSample;
}) {
  const theta = thetaRad(params);
  const pose = blockPlacement(params, sample);
  const body = pose.position;
  const weight = params.m * params.g;
  const foot = toeX(params);
  const table = Math.max(params.plane, 0.08);
  const onRamp = !sample.onPlane && !sample.landed;

  return (
    <>
      <LabScenery />
      <group position={[0, SURFACE_Y, 0]}>
        <InclineWedge length={params.travel} theta={theta} width={RAMP_WIDTH} />
      </group>
      <mesh position={[foot + table / 2, SURFACE_Y - TABLE_THICKNESS / 2, 0]}>
        <boxGeometry args={[table, TABLE_THICKNESS, RAMP_WIDTH]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[foot + table + 0.03, SURFACE_Y + 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, RAMP_WIDTH]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <BoxMass position={body} rotation={[0, 0, pose.tilt]} size={BLOCK_SIZE} color="#1E3A5F" />
      <VectorArrow
        origin={body}
        vector={[0, -weight, 0]}
        value={weight}
        unitLength={0.04}
        color={FORCE_COLORS.G}
        label="mg"
        unit="N"
        scale={0.7}
      />
      <VectorArrow
        origin={body}
        vector={
          onRamp
            ? [Math.sin(theta) * sample.N, Math.cos(theta) * sample.N, 0]
            : [0, sample.N, 0]
        }
        value={sample.N}
        unitLength={0.04}
        color={FORCE_COLORS.N}
        label="N"
        unit="N"
        scale={0.7}
      />
      <VectorArrow
        origin={body}
        vector={
          onRamp
            ? [-Math.cos(theta) * sample.f, Math.sin(theta) * sample.f, 0]
            : [-sample.f, 0, 0]
        }
        value={sample.f}
        unitLength={0.04}
        color={FORCE_COLORS.f}
        label="f"
        unit="N"
        scale={0.7}
      />
      <SpriteLabel
        text={
          sample.stuck
            ? "静止"
            : sample.landed
              ? sample.sPlane >= params.plane - 1e-6
                ? "到达平面尽头"
                : "平面上停下"
              : sample.onPlane
                ? `a = ${sample.a.toFixed(2)} m/s²`
                : `a = ${sample.a.toFixed(2)} m/s²`
        }
        color="#1e3a5f"
        position={[body[0], body[1] + BLOCK_HEIGHT / 2 + 0.16, 0]}
        height={0.14}
      />
      <LabOrbit target={[foot * 0.45 + table * 0.25, params.travel * Math.sin(theta) * 0.28, 0]} />
    </>
  );
}
