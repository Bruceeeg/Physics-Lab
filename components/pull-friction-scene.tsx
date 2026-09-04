"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  EdgesGeometry,
  Line,
  LineBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import {
  FORCE_COLORS,
  forceMarks,
  type ForceMark,
  type ForceMarkStyle,
} from "@/lib/models/force-display";
import type { PullDerived, PullState } from "@/lib/models/pull-friction";

export type TrailPoint = { x: number; z: number };

type Vec3 = [number, number, number];

const PLATFORM_LENGTH = 1000;
const PLATFORM_DEPTH = 40;
const FORCE_RENDER_ORDER = 20;
const LABEL_RENDER_ORDER = FORCE_RENDER_ORDER + 1;
const TRAIL_MAX_POINTS = 400;
const UP = new Vector3(0, 1, 0);

// Force labels are rasterised once per distinct text/colour and drawn as camera-facing sprites in
// the same WebGL pass as the arrows. They therefore share the arrow's transform exactly and scale
// with the scene, instead of being re-projected DOM nodes that trail the geometry by a frame.
const LABEL_SCALE = 4;
const LABEL_WORLD_HEIGHT = 0.4;
const LABEL_TIP_GAP = 0.06;
const LABEL_SIDE_GAP = 0.04;
const LABEL_HALO_OUTER = "#e2e8f0";
const LABEL_HALO_INNER = "#f1f5f9";
const FALLBACK_FONT = "ui-monospace, Menlo, monospace";

function formatForce(value: number) {
  return `${value.toFixed(2)} N`;
}

function shaftLength(magnitude: number) {
  return Math.min(2.4, Math.max(0.25, magnitude * 0.04));
}

function coneHeightFor(style: ForceMarkStyle) {
  return style === "dashed" ? 0.08 : 0.1;
}

function unitOf(vector: Vec3): { length: number; direction: Vec3 } {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  const direction: Vec3 =
    length < 1e-6 ? [0, 1, 0] : [vector[0] / length, vector[1] / length, vector[2] / length];
  return { length, direction };
}

function groupSignOf(offset: Vec3) {
  return Math.sign(offset.find((component) => Math.abs(component) > 1e-9) ?? 0);
}

// Which side of its arrow each label sits on. Arrows that `forceMarks` nudged apart for being
// collinear get opposite sides; the side follows the arrow tip's actual lateral position so a
// tilted F next to a vertical Fz keeps its label on the side it leans towards.
function labelSides(marks: ForceMark[]): Record<string, number> {
  const info = marks.map((mark) => {
    const { length, direction } = unitOf(mark.vector);
    const reach = shaftLength(length) + coneHeightFor(mark.style);
    const tip: Vec3 = [
      mark.offset[0] + direction[0] * reach,
      mark.offset[1] + direction[1] * reach,
      mark.offset[2] + direction[2] * reach,
    ];
    return { mark, direction, tip, ownSign: groupSignOf(mark.offset) };
  });

  const sides: Record<string, number> = {};
  for (const entry of info) {
    if (entry.ownSign === 0) {
      sides[entry.mark.name] = 0;
      continue;
    }
    const partner = info.find(
      (other) =>
        other !== entry &&
        other.ownSign !== 0 &&
        entry.direction[0] * other.direction[0] +
          entry.direction[1] * other.direction[1] +
          entry.direction[2] * other.direction[2] >=
          0.98,
    );
    if (!partner) {
      sides[entry.mark.name] = entry.ownSign;
      continue;
    }
    const lateralAxis = Math.abs(entry.direction[1]) > 0.9 ? 0 : 1;
    const delta = entry.tip[lateralAxis] - partner.tip[lateralAxis];
    sides[entry.mark.name] = Math.abs(delta) > 1e-6 ? Math.sign(delta) : entry.ownSign;
  }
  return sides;
}

function labelFontFamily() {
  const custom = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-plex-mono")
    .trim();
  return custom ? `${custom}, ${FALLBACK_FONT}` : FALLBACK_FONT;
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const settle = () => {
      if (alive) {
        setReady(true);
      }
    };
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(settle, settle);
    } else {
      settle();
    }
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

type LabelRaster = { texture: CanvasTexture; aspect: number };

function rasterLabel(name: string, value: string, color: string, family: string): LabelRaster {
  const S = LABEL_SCALE;
  const nameFont = `600 ${12 * S}px ${family}`;
  const valueFont = `700 ${13 * S}px ${family}`;
  const nameLine = 12 * S * 1.2;
  const valueLine = 13 * S * 1.2;
  const pad = 3 * S;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }

  ctx.font = nameFont;
  const nameWidth = ctx.measureText(name).width;
  ctx.font = valueFont;
  const valueWidth = ctx.measureText(value).width;

  canvas.width = Math.ceil(Math.max(nameWidth, valueWidth) + pad * 2);
  canvas.height = Math.ceil(nameLine + valueLine + pad * 2);

  // Resizing the canvas resets context state.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const cx = canvas.width / 2;
  const lines: [string, string, number][] = [
    [name, nameFont, pad + nameLine / 2],
    [value, valueFont, pad + nameLine + valueLine / 2],
  ];

  // Paper-coloured glyph halo per the label spec: hugs the strokes, no backing rectangle.
  for (const [text, font, y] of lines) {
    ctx.font = font;
    ctx.strokeStyle = LABEL_HALO_OUTER;
    ctx.lineWidth = 2.6 * S;
    ctx.strokeText(text, cx, y);
    ctx.strokeStyle = LABEL_HALO_INNER;
    ctx.lineWidth = 1.3 * S;
    ctx.strokeText(text, cx, y);
    ctx.fillStyle = color;
    ctx.fillText(text, cx, y);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 1;
  return { texture, aspect: canvas.width / canvas.height };
}

function ForceLabel({
  name,
  magnitude,
  color,
  direction,
  tipDistance,
  side,
}: {
  name: string;
  magnitude: number;
  color: string;
  direction: Vec3;
  tipDistance: number;
  side: number;
}) {
  const fontsReady = useFontsReady();
  const family = fontsReady ? labelFontFamily() : FALLBACK_FONT;
  const value = formatForce(magnitude);
  const raster = useMemo(() => rasterLabel(name, value, color, family), [name, value, color, family]);
  useEffect(() => () => raster.texture.dispose(), [raster]);

  const width = LABEL_WORLD_HEIGHT * raster.aspect;
  const halfW = width / 2;
  const halfH = LABEL_WORLD_HEIGHT / 2;

  // Push the label centre past the cone by its own half-extent along the arrow so the box clears
  // the arrowhead regardless of direction.
  const along =
    tipDistance + LABEL_TIP_GAP + Math.abs(direction[0]) * halfW + Math.abs(direction[1]) * halfH;

  // Collinear arrows get their labels placed side by side (vertical axis) or stacked (other axes)
  // instead of overlapping at the shared tip. `side` is 0 for arrows that stand alone.
  const vertical = Math.abs(direction[1]) > 0.9;
  const lateralDir: Vec3 = vertical ? [1, 0, 0] : [0, 1, 0];
  const lateral = side * ((vertical ? halfW : halfH) + LABEL_SIDE_GAP / 2);

  const position: Vec3 = [
    direction[0] * along + lateralDir[0] * lateral,
    direction[1] * along + lateralDir[1] * lateral,
    direction[2] * along + lateralDir[2] * lateral,
  ];

  return (
    <sprite
      position={position}
      scale={[width, LABEL_WORLD_HEIGHT, 1]}
      renderOrder={LABEL_RENDER_ORDER}
      frustumCulled={false}
    >
      <spriteMaterial
        map={raster.texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function DashedShaft({ length, color }: { length: number; color: string }) {
  const segments = useMemo(() => {
    const dash = 0.1;
    const gap = 0.07;
    const period = dash + gap;
    const list: { key: number; y: number; height: number }[] = [];
    let cursor = 0;
    let index = 0;
    while (cursor < length - 0.02) {
      const height = Math.min(dash, length - cursor);
      list.push({ key: index, y: cursor + height / 2, height });
      cursor += period;
      index += 1;
    }
    return list;
  }, [length]);

  return (
    <group>
      {segments.map((segment) => (
        <mesh
          key={segment.key}
          position={[0, segment.y, 0]}
          renderOrder={FORCE_RENDER_ORDER}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.008, 0.008, segment.height, 6]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

function ForceArrow({
  origin,
  vector,
  offset,
  color,
  labelColor,
  labelSide,
  name,
  magnitude,
  style,
}: {
  origin: Vec3;
  vector: Vec3;
  offset: Vec3;
  color: string;
  labelColor: string;
  labelSide: number;
  name: string;
  magnitude: number;
  style: ForceMarkStyle;
}) {
  const [vx, vy, vz] = vector;
  const { length, direction } = useMemo(() => unitOf([vx, vy, vz]), [vx, vy, vz]);
  const quaternion = useMemo(
    () =>
      new Quaternion().setFromUnitVectors(
        UP,
        new Vector3(direction[0], direction[1], direction[2]),
      ),
    [direction],
  );

  if (length < 1e-6) {
    return null;
  }

  const dashed = style === "dashed";
  const shaft = shaftLength(length);
  const coneHeight = coneHeightFor(style);
  const coneRadius = dashed ? 0.028 : 0.036;

  return (
    <group position={[origin[0] + offset[0], origin[1] + offset[1], origin[2] + offset[2]]}>
      <group quaternion={quaternion} renderOrder={FORCE_RENDER_ORDER}>
        {dashed ? (
          <DashedShaft length={shaft} color={color} />
        ) : (
          <mesh position={[0, shaft / 2, 0]} renderOrder={FORCE_RENDER_ORDER} frustumCulled={false}>
            <cylinderGeometry args={[0.012, 0.012, shaft, 8]} />
            <meshBasicMaterial color={color} depthTest={false} />
          </mesh>
        )}
        <mesh
          position={[0, shaft + coneHeight / 2, 0]}
          renderOrder={FORCE_RENDER_ORDER}
          frustumCulled={false}
        >
          <coneGeometry args={[coneRadius, coneHeight, 8]} />
          <meshBasicMaterial color={color} depthTest={false} />
        </mesh>
      </group>
      <ForceLabel
        name={name}
        magnitude={magnitude}
        color={labelColor}
        direction={direction}
        tipDistance={shaft + coneHeight}
        side={labelSide}
      />
    </group>
  );
}

const BLOCK_SIZE: Vec3 = [0.6, 0.5, 0.5];

function MassBlock({ position }: { position: Vec3 }) {
  const box = useMemo(() => new BoxGeometry(...BLOCK_SIZE), []);
  const edges = useMemo(() => new EdgesGeometry(box, 20), [box]);

  return (
    <group position={position}>
      <mesh geometry={box} renderOrder={1}>
        <meshPhysicalMaterial
          color="#3d5a80"
          transparent
          opacity={0.38}
          roughness={0.22}
          metalness={0.12}
          clearcoat={0.45}
          clearcoatRoughness={0.28}
          side={DoubleSide}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={1}
        />
      </mesh>
      <lineSegments geometry={edges} renderOrder={2} frustumCulled={false}>
        <lineBasicMaterial color="#0f172a" toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function TrailLine({ points }: { points: TrailPoint[] }) {
  // One preallocated buffer, updated in place: avoids rebuilding a BufferAttribute every frame.
  const line = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(TRAIL_MAX_POINTS * 3), 3),
    );
    geometry.setDrawRange(0, 0);
    const object = new Line(geometry, new LineBasicMaterial({ color: FORCE_COLORS.f }));
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
      array[index * 3 + 1] = 0.22 + point.z;
      array[index * 3 + 2] = 0;
    }
    attribute.needsUpdate = true;
    line.geometry.setDrawRange(0, count);
  }, [line, points]);

  return <primitive object={line} visible={points.length >= 2} />;
}

function FollowOrbit({ x, y, z }: { x: number; y: number; z: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const prev = useRef({ x, y, z });
  const ready = useRef(false);

  // Priority -1 runs alongside OrbitControls' own update and before every default-priority frame
  // callback, so nothing downstream ever observes a camera that has not yet followed the block.
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    if (!ready.current) {
      controls.target.set(x, y, z);
      prev.current = { x, y, z };
      ready.current = true;
      controls.update();
      return;
    }

    const dx = x - prev.current.x;
    const dy = y - prev.current.y;
    const dz = z - prev.current.z;
    if (dx === 0 && dy === 0 && dz === 0) {
      return;
    }

    controls.target.x += dx;
    controls.target.y += dy;
    controls.target.z += dz;
    controls.object.position.x += dx;
    controls.object.position.y += dy;
    controls.object.position.z += dz;
    prev.current = { x, y, z };
    controls.update();
  }, -1);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.45}
      zoomSpeed={0.65}
      panSpeed={0.5}
      minPolarAngle={0.12}
      maxPolarAngle={3.05}
      minDistance={3.2}
      maxDistance={36}
    />
  );
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

export function PullFrictionScene({
  state,
  derived,
  trail,
}: {
  state: PullState;
  derived: PullDerived;
  trail: TrailPoint[];
}) {
  const origin: Vec3 = [state.x, 0.25 + state.z, 0];
  const marks = useMemo(() => forceMarks(derived), [derived]);
  const sides = useMemo(() => labelSides(marks), [marks]);

  return (
    <>
      <Scenery />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[state.x, -0.02, 0]} renderOrder={0}>
        <planeGeometry args={[PLATFORM_LENGTH, PLATFORM_DEPTH]} />
        <meshStandardMaterial
          color="#e2e8f0"
          transparent
          opacity={0.28}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <MassBlock position={origin} />
      <TrailLine points={trail} />
      {marks.map((mark) => (
        <ForceArrow
          key={mark.name}
          origin={origin}
          vector={mark.vector}
          offset={mark.offset}
          color={mark.color}
          labelColor={mark.labelColor}
          labelSide={sides[mark.name] ?? 0}
          name={mark.name}
          magnitude={mark.magnitude}
          style={mark.style}
        />
      ))}
      <FollowOrbit x={state.x} y={0.4 + state.z} z={0} />
    </>
  );
}
