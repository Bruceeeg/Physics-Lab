"use client";

import { Grid, Line, OrbitControls } from "@react-three/drei";
import { memo, useEffect, useLayoutEffect, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Line as LineObject,
  LineBasicMaterial,
  Quaternion,
  Vector3,
} from "three";

import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS } from "@/lib/models/force-display";

type Vec3 = [number, number, number];

const UP = new Vector3(0, 1, 0);
const TRAIL_MAX_POINTS = 400;
const ARROW_RENDER_ORDER = 20;

export const LabScenery = memo(function LabScenery() {
  return (
    <>
      <color attach="background" args={["#cbd5e1"]} />
      <hemisphereLight args={["#f8fafc", "#64748b", 0.7]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={1.05} />
      <directionalLight position={[2, -8, 3]} intensity={0.4} />
      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.6}
        sectionSize={5}
        sectionThickness={1.1}
        cellColor="#94a3b8"
        sectionColor="#1e3a5f"
        fadeDistance={100}
        fadeStrength={1}
        infiniteGrid
        followCamera
        side={DoubleSide}
      />
    </>
  );
});

export function LabOrbit({
  target = [0, 0.4, 0],
  minDistance = 1.2,
  maxDistance = 48,
}: {
  target?: Vec3;
  minDistance?: number;
  maxDistance?: number;
}) {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.65}
      panSpeed={0.5}
      target={target}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minDistance={minDistance}
      maxDistance={maxDistance}
    />
  );
}

export function BoxMass({
  position,
  rotation = [0, 0, 0],
  size = [0.28, 0.22, 0.22],
  color = "#3d5a80",
}: {
  position: Vec3;
  rotation?: Vec3;
  size?: Vec3;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.28}
        metalness={0.12}
        clearcoat={0.35}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}

export function SphereMass({
  position,
  radius = 0.1,
  color = "#3d5a80",
}: {
  position: Vec3;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 24]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.3}
        metalness={0.1}
        clearcoat={0.4}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}

export function LabLine({
  points,
  color,
  lineWidth = 1.5,
  dashed = false,
}: {
  points: Vec3[];
  color: string;
  lineWidth?: number;
  dashed?: boolean;
}) {
  const valid = points.filter(
    (point) => Number.isFinite(point[0]) && Number.isFinite(point[1]) && Number.isFinite(point[2]),
  );
  if (valid.length < 2) {
    return null;
  }
  return (
    <Line
      points={valid}
      color={color}
      lineWidth={lineWidth}
      dashed={dashed}
      dashSize={dashed ? 0.06 : undefined}
      gapSize={dashed ? 0.04 : undefined}
    />
  );
}

export function TrailLine({
  points,
  color = FORCE_COLORS.f,
}: {
  points: Vec3[];
  color?: string;
}) {
  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(TRAIL_MAX_POINTS * 3), 3),
    );
    geometry.setDrawRange(0, 0);
    const object = new LineObject(geometry, new LineBasicMaterial({ color }));
    object.frustumCulled = false;
    return object;
  }, [color]);

  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
    },
    [line],
  );

  useLayoutEffect(() => {
    const attribute = line.geometry.getAttribute("position") as BufferAttribute;
    const array = attribute.array as Float32Array;
    const count = Math.min(points.length, TRAIL_MAX_POINTS);
    const start = points.length - count;
    for (let index = 0; index < count; index += 1) {
      const point = points[start + index];
      array[index * 3] = point[0];
      array[index * 3 + 1] = point[1];
      array[index * 3 + 2] = point[2];
    }
    attribute.needsUpdate = true;
    line.geometry.setDrawRange(0, count);
  }, [line, points]);

  return <primitive object={line} visible={points.length >= 2} />;
}

function DashedShaft({
  length,
  radius,
  color,
  scale,
}: {
  length: number;
  radius: number;
  color: string;
  scale: number;
}) {
  const segments = useMemo(() => {
    const dash = 0.1 * scale;
    const gap = 0.07 * scale;
    const period = dash + gap;
    const list: { key: number; y: number; height: number }[] = [];
    let cursor = 0;
    let index = 0;
    while (cursor < length - 0.02 * scale) {
      const height = Math.min(dash, length - cursor);
      list.push({ key: index, y: cursor + height / 2, height });
      cursor += period;
      index += 1;
    }
    return list;
  }, [length, scale]);

  return (
    <group>
      {segments.map((segment) => (
        <mesh
          key={segment.key}
          position={[0, segment.y, 0]}
          renderOrder={ARROW_RENDER_ORDER}
          frustumCulled={false}
        >
          <cylinderGeometry args={[radius, radius, segment.height, 6]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

export function VectorArrow({
  origin,
  vector,
  value,
  unitLength,
  color,
  label,
  unit,
  dashed = false,
  scale = 1,
}: {
  origin: Vec3;
  vector: Vec3;
  value: number;
  unitLength: number;
  color: string;
  label: string;
  unit: string;
  dashed?: boolean;
  scale?: number;
}) {
  const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
  if (magnitude < 1e-6) {
    return null;
  }
  const direction: Vec3 = [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
  const quaternion = new Quaternion().setFromUnitVectors(
    UP,
    new Vector3(direction[0], direction[1], direction[2]),
  );
  const shaft = Math.min(1.4 * scale, Math.max(0.16 * scale, magnitude * unitLength));
  const coneHeight = (dashed ? 0.08 : 0.1) * scale;
  const coneRadius = (dashed ? 0.028 : 0.036) * scale;
  const shaftRadius = (dashed ? 0.008 : 0.012) * scale;
  const reach = shaft + coneHeight + 0.14 * scale;
  const labelPosition: Vec3 = [direction[0] * reach, direction[1] * reach, direction[2] * reach];

  return (
    <group position={origin}>
      <group quaternion={quaternion}>
        {dashed ? (
          <DashedShaft length={shaft} radius={shaftRadius} color={color} scale={scale} />
        ) : (
          <mesh position={[0, shaft / 2, 0]} renderOrder={ARROW_RENDER_ORDER} frustumCulled={false}>
            <cylinderGeometry args={[shaftRadius, shaftRadius, shaft, 8]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        )}
        <mesh
          position={[0, shaft + coneHeight / 2, 0]}
          renderOrder={ARROW_RENDER_ORDER}
          frustumCulled={false}
        >
          <coneGeometry args={[coneRadius, coneHeight, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      </group>
      <SpriteLabel
        text={`${label} ${value.toFixed(2)} ${unit}`}
        color={color}
        position={labelPosition}
        height={0.18 * scale}
      />
    </group>
  );
}
