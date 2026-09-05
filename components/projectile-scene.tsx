"use client";

import { Grid, Line, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Line as LineObject,
  LineBasicMaterial,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { SpriteLabel } from "@/components/scene-label";
import { FORCE_COLORS, FORCE_LABEL_COLORS } from "@/lib/models/force-display";
import {
  flightTime,
  range,
  rulerSteps,
  trajectory,
  viewExtent,
  type ProjectileParams,
  type ProjectileSample,
} from "@/lib/models/projectile";
import { TARGET_HALF_WIDTH } from "@/lib/models/projectile-prediction";

export type TrailPoint2D = { x: number; y: number };

export type TargetState = "pending" | "hit" | "miss";

export type SceneTarget = { x: number; state: TargetState; deltaX: number | null };

export type ProjectileSceneProps = {
  params: ProjectileParams;
  sample: ProjectileSample;
  trail: TrailPoint2D[];
  showPrediction: boolean;
  showVelocity: boolean;
  landingX: number | null;
  target: SceneTarget | null;
  frameParams: ProjectileParams;
  allowRefit: boolean;
};

type Vec3 = [number, number, number];

const NAVY = "#1E3A5F";
const BALL_COLOR = "#3D5A80";
const HIT_COLOR = "#047857";
const MISS_COLOR = "#DC2626";
const TRAIL_MAX_POINTS = 400;
const ARROW_RENDER_ORDER = 20;
const UP = new Vector3(0, 1, 0);
const DEFAULT_VIEW_DIRECTION = new Vector3(0.18, 0.28, 1).normalize();

function formatMeters(value: number) {
  return `${value.toFixed(2)} m`;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(2)}`;
}

const Scenery = memo(function Scenery() {
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

function Ruler({ extentX, scale }: { extentX: number; scale: number }) {
  const { major, minor } = rulerSteps(extentX);
  const end = Math.ceil(extentX / major) * major + major;
  const ticks = useMemo(() => {
    const list: { x: number; isMajor: boolean }[] = [];
    for (let x = 0; x <= end + 1e-9; x += minor) {
      const rounded = Number(x.toFixed(4));
      list.push({
        x: rounded,
        isMajor: Math.abs(rounded / major - Math.round(rounded / major)) < 1e-6,
      });
    }
    return list;
  }, [end, major, minor]);

  return (
    <group>
      <mesh position={[end / 2 - scale, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
        <planeGeometry args={[end + 4 * scale, 1.4 * scale]} />
        <meshStandardMaterial
          color="#e2e8f0"
          transparent
          opacity={0.55}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      {ticks.map((tick) => (
        <mesh key={tick.x} position={[tick.x, 0.004, 0]}>
          <boxGeometry args={[0.012 * scale, 0.004, (tick.isMajor ? 0.26 : 0.14) * scale]} />
          <meshBasicMaterial color={NAVY} />
        </mesh>
      ))}
      {ticks
        .filter((tick) => tick.isMajor)
        .map((tick) => (
          <SpriteLabel
            key={`label-${tick.x}`}
            text={`${tick.x} m`}
            color={NAVY}
            position={[tick.x, 0.09 * scale, 0.34 * scale]}
            height={0.2 * scale}
          />
        ))}
    </group>
  );
}

// Muzzle sits at (0, h). The barrel points back along -cos/-sin so the ball
// leaves from the origin; it is shortened when it would dip below ground.
function Launcher({ h, thetaDeg, scale }: { h: number; thetaDeg: number; scale: number }) {
  const theta = (thetaDeg * Math.PI) / 180;
  const nominal = 0.35 * scale;
  const barrel = thetaDeg > 0 ? Math.min(nominal, h / Math.sin(theta)) : nominal;
  if (barrel < 0.02) {
    return null;
  }
  const centre: Vec3 = [(-Math.cos(theta) * barrel) / 2, h - (Math.sin(theta) * barrel) / 2, 0];
  const columnX = -Math.cos(theta) * barrel * 0.7;
  const columnTop = h - Math.sin(theta) * barrel * 0.7;
  return (
    <group>
      {columnTop > 0.01 ? (
        <mesh position={[columnX, columnTop / 2, 0]}>
          <boxGeometry args={[0.05 * scale, columnTop, 0.05 * scale]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ) : null}
      <mesh position={centre} rotation={[0, 0, theta - Math.PI / 2]}>
        <cylinderGeometry args={[0.035 * scale, 0.035 * scale, barrel, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}

function Ball({ position, radius }: { position: Vec3; radius: number }) {
  return (
    <mesh position={position} renderOrder={1}>
      <sphereGeometry args={[radius, 32, 24]} />
      <meshPhysicalMaterial
        color={BALL_COLOR}
        roughness={0.3}
        metalness={0.1}
        clearcoat={0.4}
        clearcoatRoughness={0.3}
      />
    </mesh>
  );
}

function TrailLine({ points, lift }: { points: TrailPoint2D[]; lift: number }) {
  // One preallocated buffer, updated in place: avoids rebuilding a BufferAttribute every frame.
  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(TRAIL_MAX_POINTS * 3), 3),
    );
    geometry.setDrawRange(0, 0);
    const object = new LineObject(geometry, new LineBasicMaterial({ color: FORCE_COLORS.f }));
    object.frustumCulled = false;
    return object;
  }, []);
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
      array[index * 3] = point.x;
      array[index * 3 + 1] = point.y + lift;
      array[index * 3 + 2] = 0;
    }
    attribute.needsUpdate = true;
    line.geometry.setDrawRange(0, count);
  }, [lift, line, points]);

  return <primitive object={line} visible={points.length >= 2} />;
}

function PredictionPath({
  params,
  lift,
  scale,
}: {
  params: ProjectileParams;
  lift: number;
  scale: number;
}) {
  const { v0, thetaDeg, h, g } = params;
  const points = useMemo<Vec3[]>(
    () => trajectory({ v0, thetaDeg, h, g }, 80).map((point) => [point.x, point.y + lift, 0]),
    [g, h, lift, thetaDeg, v0],
  );
  if (flightTime(params) <= 0) {
    return null;
  }
  const landing = range(params);
  return (
    <group>
      <Line
        points={points}
        color={NAVY}
        lineWidth={1.5}
        dashed
        dashSize={0.08 * scale}
        gapSize={0.05 * scale}
      />
      <mesh position={[landing, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06 * scale, 0.09 * scale, 32]} />
        <meshBasicMaterial color={NAVY} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function LandingMarker({ x, scale }: { x: number; scale: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08 * scale, 32]} />
        <meshBasicMaterial color={FORCE_COLORS.f} side={DoubleSide} />
      </mesh>
      <SpriteLabel
        text={`x = ${formatMeters(x)}`}
        color={FORCE_LABEL_COLORS.f}
        position={[0, 0.3 * scale, 0]}
        height={0.22 * scale}
      />
    </group>
  );
}

// Physical 0.20 m cup; the width is the hit tolerance, so it does not scale.
function TargetCup({ target, scale }: { target: SceneTarget; scale: number }) {
  const color = target.state === "hit" ? HIT_COLOR : target.state === "miss" ? MISS_COLOR : NAVY;
  const label =
    target.state === "hit"
      ? "命中"
      : target.state === "miss"
        ? `Δx = ${formatSigned(target.deltaX ?? 0)} m`
        : `标靶 x = ${formatMeters(target.x)}`;
  const height = 0.12;
  return (
    <group position={[target.x, 0, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry
          args={[TARGET_HALF_WIDTH, TARGET_HALF_WIDTH * 0.85, height, 24, 1, true]}
        />
        <meshStandardMaterial color={color} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TARGET_HALF_WIDTH * 0.85, 24]} />
        <meshBasicMaterial color={color} side={DoubleSide} />
      </mesh>
      <SpriteLabel
        text={label}
        color={color}
        position={[0, height + 0.2 * scale, 0]}
        height={0.22 * scale}
      />
    </group>
  );
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

function VectorArrow({
  origin,
  vector,
  value,
  unitLength,
  color,
  labelColor,
  label,
  unit,
  dashed,
  labelOffset,
  scale,
}: {
  origin: Vec3;
  vector: Vec3;
  value: number;
  unitLength: number;
  color: string;
  labelColor: string;
  label: string;
  unit: string;
  dashed: boolean;
  labelOffset: Vec3;
  scale: number;
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
  const shaft = Math.min(1.2 * scale, Math.max(0.18 * scale, magnitude * unitLength));
  const coneHeight = (dashed ? 0.08 : 0.1) * scale;
  const coneRadius = (dashed ? 0.028 : 0.036) * scale;
  const shaftRadius = (dashed ? 0.008 : 0.012) * scale;
  const reach = shaft + coneHeight + 0.16 * scale;
  const labelPosition: Vec3 = [
    direction[0] * reach + labelOffset[0],
    direction[1] * reach + labelOffset[1],
    direction[2] * reach + labelOffset[2],
  ];

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
        color={labelColor}
        position={labelPosition}
        height={0.2 * scale}
      />
    </group>
  );
}

// Re-frames the stage when the extent changes while the ball is parked at
// t = 0. Keeps the user's current viewing direction; only distance and target move.
function FitCamera({
  extentX,
  extentY,
  allowRefit,
}: {
  extentX: number;
  extentY: number;
  allowRefit: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((state) => state.size);
  const key = `${extentX.toFixed(3)}|${extentY.toFixed(3)}`;
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    if (!allowRefit || fitted.current === key || !controls) {
      return;
    }
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    const fov = (camera.fov * Math.PI) / 180;
    const aspect = size.width / Math.max(1, size.height);
    const target = new Vector3(extentX / 2, extentY * 0.45, 0);
    const fitHeight = (extentY * 1.3) / 2 / Math.tan(fov / 2);
    const fitWidth = (extentX * 1.15) / 2 / (aspect * Math.tan(fov / 2));
    const distance = Math.max(2, fitHeight, fitWidth);
    const direction =
      fitted.current === null
        ? DEFAULT_VIEW_DIRECTION.clone()
        : camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 1e-6) {
      direction.copy(DEFAULT_VIEW_DIRECTION);
    }
    camera.position.copy(target).addScaledVector(direction, distance);
    controls.target.copy(target);
    controls.update();
    fitted.current = key;
  }, [allowRefit, camera, controls, extentX, extentY, key, size.height, size.width]);

  return null;
}

export function ProjectileScene({
  params,
  sample,
  trail,
  showPrediction,
  showVelocity,
  landingX,
  target,
  frameParams,
  allowRefit,
}: ProjectileSceneProps) {
  const { v0, thetaDeg, h, g } = frameParams;
  const { extentX, extentY, scale } = useMemo(
    () => viewExtent({ v0, thetaDeg, h, g }),
    [g, h, thetaDeg, v0],
  );
  const radius = Math.max(0.04, 0.012 * extentX);
  const ballCentre: Vec3 = [sample.x, sample.y + radius, 0];
  const velocityUnit = 0.12 * scale;
  const gravityUnit = 0.035 * scale;

  return (
    <>
      <Scenery />
      <Ruler extentX={extentX} scale={scale} />
      <Launcher h={params.h} thetaDeg={params.thetaDeg} scale={scale} />
      {showPrediction ? <PredictionPath params={params} lift={radius} scale={scale} /> : null}
      <TrailLine points={trail} lift={radius} />
      <Ball position={ballCentre} radius={radius} />
      {showVelocity ? (
        <>
          <VectorArrow
            origin={ballCentre}
            vector={[sample.vx, sample.vy, 0]}
            value={Math.hypot(sample.vx, sample.vy)}
            unitLength={velocityUnit}
            color={FORCE_COLORS.F}
            labelColor={FORCE_LABEL_COLORS.F}
            label="v"
            unit="m/s"
            dashed={false}
            labelOffset={[0, 0.14 * scale, 0]}
            scale={scale}
          />
          <VectorArrow
            origin={ballCentre}
            vector={[sample.vx, 0, 0]}
            value={sample.vx}
            unitLength={velocityUnit}
            color={FORCE_COLORS.Fdash}
            labelColor={FORCE_LABEL_COLORS.Fdash}
            label="vₓ"
            unit="m/s"
            dashed
            labelOffset={[0, -0.14 * scale, 0]}
            scale={scale}
          />
          <VectorArrow
            origin={ballCentre}
            vector={[0, sample.vy, 0]}
            value={sample.vy}
            unitLength={velocityUnit}
            color={FORCE_COLORS.Fdash}
            labelColor={FORCE_LABEL_COLORS.Fdash}
            label="vᵧ"
            unit="m/s"
            dashed
            labelOffset={[0.16 * scale, 0, 0]}
            scale={scale}
          />
        </>
      ) : null}
      <VectorArrow
        origin={ballCentre}
        vector={[0, -params.g, 0]}
        value={params.g}
        unitLength={gravityUnit}
        color={FORCE_COLORS.G}
        labelColor={FORCE_LABEL_COLORS.G}
        label="g"
        unit="m/s²"
        dashed={false}
        labelOffset={[-0.16 * scale, 0, 0]}
        scale={scale}
      />
      {landingX !== null ? <LandingMarker x={landingX} scale={scale} /> : null}
      {target ? <TargetCup target={target} scale={scale} /> : null}
      <FitCamera extentX={extentX} extentY={extentY} allowRefit={allowRefit} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        zoomSpeed={0.65}
        panSpeed={0.5}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={0.8}
        maxDistance={600}
      />
    </>
  );
}
