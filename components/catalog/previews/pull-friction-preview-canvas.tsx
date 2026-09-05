"use client";

import { Canvas } from "@react-three/fiber";

import { PullFrictionScene, type TrailPoint } from "@/components/pull-friction-scene";
import type { PullDerived, PullParams, PullState } from "@/lib/models/pull-friction";

export default function PullFrictionPreviewCanvas({
  state,
  derived,
  trail,
  params,
  running,
}: {
  state: PullState;
  derived: PullDerived;
  trail: TrailPoint[];
  params: PullParams;
  running: boolean;
}) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ pointerEvents: "none" }}
      frameloop={running ? "always" : "demand"}
      dpr={1}
      camera={{ position: [4.6, 2.8, 5.4], fov: 42, near: 0.1, far: 2000 }}
      gl={{ antialias: false, powerPreference: "low-power" }}
    >
      <PullFrictionScene
        state={state}
        derived={derived}
        trail={trail}
        params={params}
        interactive={false}
      />
    </Canvas>
  );
}
