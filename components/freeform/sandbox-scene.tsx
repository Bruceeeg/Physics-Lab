"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useFreeform, useFreeformOptional } from "@/components/freeform/freeform-context";
import { ForceWithXY } from "@/components/lab-3d";
import { forceComponents } from "@/lib/freeform/forces";
import { DYNAMIC_TYPES, type Part } from "@/lib/freeform/types";

const SceneCanvas = dynamic(() => import("@/components/lab-canvas"), { ssr: false });

export function SandboxScene() {
  const freeform = useFreeform();
  const bodies = freeform.sandbox?.bodies ?? [];
  const controls = useRef<OrbitControlsImpl>(null);
  const focus = bodies[0];

  return (
    <SceneCanvas camera={[0, 0.72, 1.35]}>
      <Aim />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={0.8} />
      <gridHelper args={[8, 16, "#94a3b8", "#cbd5e1"]} position={[focus?.x ?? 0, 0, focus?.z ?? 0]} />
      <OrbitControls ref={controls} makeDefault target={[focus?.x ?? 0, 0.12, focus?.z ?? 0]} />
      <Follow controls={controls} />
      {freeform.scene.parts.filter((part) => part.enabled).map((part) => (
        <PartMesh key={part.id} part={part} bodies={bodies} />
      ))}
    </SceneCanvas>
  );
}

function Aim() {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 0.72, 1.35);
    camera.lookAt(0, 0.12, 0);
  }, [camera]);
  return null;
}

function Follow({ controls }: { controls: RefObject<OrbitControlsImpl | null> }) {
  const freeform = useFreeformOptional();
  const camera = useThree((state) => state.camera);
  useFrame(() => {
    const body = freeform?.sandbox?.bodies[0];
    const orbit = controls.current;
    if (!body || !orbit) {
      return;
    }
    const dx = body.x - orbit.target.x;
    const dz = body.z - orbit.target.z;
    if (dx * dx + dz * dz < 0.01) {
      return;
    }
    orbit.target.set(body.x, 0.12, body.z);
    camera.position.x += dx;
    camera.position.z += dz;
  });
  return null;
}

function PartMesh({
  part,
  bodies,
}: {
  part: Part;
  bodies: { id: string; x: number; y: number; z: number }[];
}) {
  const freeform = useFreeformOptional();
  const [dragging, setDragging] = useState(false);
  if (!freeform) {
    return null;
  }
  if (part.type === "custom-force") {
    const origin = forceOrigin(part, bodies);
    const components = forceComponents(part.magnitude, part.thetaDeg, part.phiDeg);
    return (
      <group>
        <ForceWithXY
          origin={origin}
          vector={[components.x, components.y, components.z]}
          value={part.magnitude}
          label="F"
          color="#b91c1c"
          unitLength={0.05}
        />
        <mesh
          position={origin}
          onPointerDown={(event) => {
            event.stopPropagation();
            const target = event.target as {
              setPointerCapture?: (id: number) => void;
            } | null;
            target?.setPointerCapture?.(event.pointerId);
            setDragging(true);
          }}
          onPointerUp={(event) => {
            const target = event.target as {
              hasPointerCapture?: (id: number) => boolean;
              releasePointerCapture?: (id: number) => void;
            } | null;
            if (target?.hasPointerCapture?.(event.pointerId)) {
              target.releasePointerCapture?.(event.pointerId);
            }
            setDragging(false);
          }}
          onPointerMove={(event) => {
            if (!dragging) {
              return;
            }
            event.stopPropagation();
            const anchor = bodies.find((body) => body.id === part.anchorId) ?? bodies[0];
            if (part.attach === "body" && anchor) {
              freeform.update(part.id, {
                x: event.point.x - anchor.x,
                y: event.point.y - anchor.y,
                z: event.point.z - anchor.z,
              });
              return;
            }
            freeform.update(part.id, {
              attach: "world",
              x: event.point.x,
              y: event.point.y,
              z: event.point.z,
            });
          }}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#b91c1c" />
        </mesh>
      </group>
    );
  }

  const body = bodies.find((item) => item.id === part.id);
  const position: [number, number, number] = body ? [body.x, body.y, body.z] : [part.x, part.y, part.z];
  if (part.type === "track") {
    const followX = bodies[0]?.x ?? 0;
    return (
      <mesh position={[followX, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 1.2]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
    );
  }
  if (part.type === "lens-convex" || part.type === "lens-concave") {
    return (
      <mesh position={position}>
        <cylinderGeometry args={[0.35, 0.35, 0.06, 24]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.7} />
      </mesh>
    );
  }
  if (DYNAMIC_TYPES.has(part.type) && part.type !== "block" && part.type !== "rod") {
    return (
      <mesh position={position}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color={part.charge === 0 ? "#a16207" : "#b45309"} />
      </mesh>
    );
  }
  if (DYNAMIC_TYPES.has(part.type)) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.28, 0.16, 0.2]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
    );
  }
  return (
    <mesh position={position}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial color="#64748b" />
    </mesh>
  );
}

function forceOrigin(part: Part, bodies: { id: string; x: number; y: number; z: number }[]): [number, number, number] {
  if (part.attach === "body") {
    const anchor = bodies.find((body) => body.id === part.anchorId) ?? bodies[0];
    if (anchor) {
      return [anchor.x + part.x, anchor.y + part.y, anchor.z + part.z];
    }
  }
  return [part.x, part.y, part.z];
}
