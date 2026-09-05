"use client";

import { Canvas } from "@react-three/fiber";

import { ProjectileScene, type ProjectileSceneProps } from "@/components/projectile-scene";

export default function ProjectileCanvas(props: ProjectileSceneProps) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ overflow: "visible" }}
      camera={{ position: [1.5, 1.6, 4.5], fov: 45, near: 0.05, far: 2000 }}
      gl={{ antialias: true }}
    >
      <ProjectileScene {...props} />
    </Canvas>
  );
}
