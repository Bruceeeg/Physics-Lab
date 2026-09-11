"use client";

import type { ReactNode } from "react";

export function Battery({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.032, 0.032, 0.14, 16]} />
        <meshStandardMaterial color="#a16207" metalness={0.25} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.082, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.024, 12]} />
        <meshStandardMaterial color="#1e3a5f" />
      </mesh>
    </group>
  );
}

export function ResistorBody({
  position,
  rotation = [0, 0, Math.PI / 2],
  length = 0.16,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.016, 0.016, length, 12]} />
      <meshStandardMaterial color="#b45309" roughness={0.55} />
    </mesh>
  );
}

export function CapacitorPlates({
  position,
  gap = 0.05,
  charge = 0,
}: {
  position: [number, number, number];
  gap?: number;
  charge?: number;
}) {
  const glow = Math.min(1, Math.abs(charge) * 800);
  return (
    <group position={position}>
      <mesh position={[-gap / 2, 0, 0]}>
        <boxGeometry args={[0.01, 0.16, 0.12]} />
        <meshStandardMaterial
          color="#1e3a5f"
          emissive="#2563eb"
          emissiveIntensity={glow}
        />
      </mesh>
      <mesh position={[gap / 2, 0, 0]}>
        <boxGeometry args={[0.01, 0.16, 0.12]} />
        <meshStandardMaterial
          color="#a16207"
          emissive="#a16207"
          emissiveIntensity={glow}
        />
      </mesh>
    </group>
  );
}

export function InductorCoil({
  position,
  rotation = [0, 0, Math.PI / 2],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[0.028, 0.028, 0.16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.45} roughness={0.35} />
      </mesh>
      {[ -0.05, -0.025, 0, 0.025, 0.05 ].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.032, 0.006, 8, 20]} />
          <meshStandardMaterial color="#a16207" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export function Board({
  size = [0.9, 0.02, 0.5],
  children,
}: {
  size?: [number, number, number];
  children?: ReactNode;
}) {
  return (
    <group>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#d6deea" roughness={0.7} />
      </mesh>
      {children}
    </group>
  );
}
