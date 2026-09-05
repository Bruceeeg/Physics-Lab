"use client";

import { Canvas } from "@react-three/fiber";

import { PullFrictionScene, type TrailPoint } from "@/components/pull-friction-scene";
import type { PullDerived, PullParams, PullState } from "@/lib/models/pull-friction";

export default function PullFrictionCanvas({
  state,
  derived,
  trail,
  params,
}: {
  state: PullState;
  derived: PullDerived;
  trail: TrailPoint[];
  params: PullParams;
}) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ overflow: "visible" }}
      camera={{ position: [5, 3.2, 6], fov: 45, near: 0.1, far: 2000 }}
      gl={{ antialias: true }}
    >
      <PullFrictionScene state={state} derived={derived} trail={trail} params={params} />
    </Canvas>
  );
}
