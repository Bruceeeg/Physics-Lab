"use client";

import { LabLine, LabOrbit, LabScenery } from "@/components/lab-3d";
import { Battery, Board, CapacitorPlates, InductorCoil, ResistorBody } from "@/components/p2/circuit-parts";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber } from "@/lib/models/lab-format";
import type { RlMode, RlSample } from "@/lib/models/rl-circuits";

export function RlCircuitsScene({
  sample,
  mode,
}: {
  sample: RlSample;
  mode: RlMode;
}) {
  const lc = mode === "lc";
  return (
    <>
      <LabScenery />
      <Board>
        <Battery position={[-0.32, 0.1, 0.1]} />
        <ResistorBody position={[-0.04, 0.08, -0.08]} />
        <InductorCoil position={[0.22, 0.08, -0.08]} />
        {lc ? <CapacitorPlates position={[0.22, 0.12, 0.12]} charge={sample.Q} /> : null}
        <LabLine
          points={[[-0.32, 0.17, 0.1], [-0.32, 0.08, -0.08], [-0.12, 0.08, -0.08]]}
          color="#1e3a5f"
          lineWidth={1.6}
        />
        <LabLine
          points={[[0.04, 0.08, -0.08], [0.14, 0.08, -0.08]]}
          color="#1e3a5f"
          lineWidth={1.6}
        />
        <LabLine
          points={[[0.22, 0.08, 0], [0.22, 0.03, 0.1], [-0.32, 0.03, 0.1]]}
          color="#1e3a5f"
          lineWidth={1.6}
        />
      </Board>
      <SpriteLabel
        text={`${lc ? "LC" : mode === "grow" ? "RL 增长" : "RL 衰减"}  I ${formatLabNumber(sample.I)} A`}
        color="#1e3a5f"
        position={[0, 0.32, 0]}
        height={0.08}
      />
      <LabOrbit target={[0, 0.1, 0]} minDistance={0.7} maxDistance={10} />
    </>
  );
}
