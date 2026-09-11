"use client";

import { LabLine, LabOrbit, LabScenery } from "@/components/lab-3d";
import { Battery, Board, CapacitorPlates, ResistorBody } from "@/components/p2/circuit-parts";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber } from "@/lib/models/lab-format";
import type { RcMode, RcSample } from "@/lib/models/rc-circuits";

export function RcCircuitsScene({
  sample,
  mode,
}: {
  sample: RcSample;
  mode: RcMode;
}) {
  return (
    <>
      <LabScenery />
      <Board>
        <Battery position={[-0.32, 0.1, 0.1]} />
        <ResistorBody position={[-0.04, 0.08, -0.08]} />
        <CapacitorPlates position={[0.26, 0.12, -0.08]} charge={sample.Q} />
        <LabLine
          points={[[-0.32, 0.17, 0.1], [-0.32, 0.08, -0.08], [-0.12, 0.08, -0.08]]}
          color="#1e3a5f"
          lineWidth={1.6}
        />
        <LabLine
          points={[[0.04, 0.08, -0.08], [0.2, 0.08, -0.08]]}
          color="#1e3a5f"
          lineWidth={1.6}
        />
        <LabLine
          points={[[0.26, 0.04, -0.08], [0.26, 0.04, 0.1], [-0.32, 0.03, 0.1]]}
          color="#1e3a5f"
          lineWidth={1.6}
        />
      </Board>
      <SpriteLabel
        text={`${mode === "charge" ? "充电" : "放电"}  Vc ${formatLabNumber(sample.Vc)} V`}
        color="#1e3a5f"
        position={[0, 0.3, 0]}
        height={0.08}
      />
      <LabOrbit target={[0, 0.1, 0]} minDistance={0.7} maxDistance={10} />
    </>
  );
}
