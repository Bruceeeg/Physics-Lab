"use client";

import { LabLine, LabOrbit, LabScenery } from "@/components/lab-3d";
import { Battery, Board, ResistorBody } from "@/components/p2/circuit-parts";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber } from "@/lib/models/lab-format";
import type { ResistorMode, ResistorSample } from "@/lib/models/resistor-circuits";

export function ResistorCircuitsScene({
  sample,
  mode,
}: {
  sample: ResistorSample;
  mode: ResistorMode;
}) {
  const series = mode === "series";
  return (
    <>
      <LabScenery />
      <Board>
        <Battery position={[-0.34, 0.1, 0.12]} />
        {series ? (
          <>
            <ResistorBody position={[-0.12, 0.08, -0.08]} />
            <ResistorBody position={[0.08, 0.08, -0.08]} />
            <ResistorBody position={[0.28, 0.08, -0.08]} />
            <LabLine points={[[-0.34, 0.17, 0.12], [-0.34, 0.08, -0.08], [-0.2, 0.08, -0.08]]} color="#1e3a5f" lineWidth={1.6} />
            <LabLine points={[[0.36, 0.08, -0.08], [0.36, 0.08, 0.12], [-0.34, 0.03, 0.12]]} color="#1e3a5f" lineWidth={1.6} />
          </>
        ) : (
          <>
            <ResistorBody position={[0.08, 0.08, 0.12]} />
            <ResistorBody position={[0.08, 0.08, 0]} />
            <ResistorBody position={[0.08, 0.08, -0.12]} />
            <LabLine points={[[-0.34, 0.17, 0.12], [-0.02, 0.08, 0.12], [-0.02, 0.08, -0.12]]} color="#1e3a5f" lineWidth={1.6} />
            <LabLine points={[[0.18, 0.08, 0.12], [0.18, 0.08, -0.12], [-0.34, 0.03, 0.12]]} color="#1e3a5f" lineWidth={1.6} />
          </>
        )}
      </Board>
      <SpriteLabel
        text={`${series ? "串联" : "并联"} I ${formatLabNumber(sample.I)} A`}
        color="#1e3a5f"
        position={[0, 0.28, 0]}
        height={0.08}
      />
      <LabOrbit target={[0, 0.1, 0]} minDistance={0.7} maxDistance={10} />
    </>
  );
}
