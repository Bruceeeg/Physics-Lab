"use client";

import { LabLine, LabOrbit, LabScenery, SphereMass } from "@/components/lab-3d";
import { SpriteLabel } from "@/components/scene-label";
import { formatLabNumber, formatLabSci } from "@/lib/models/lab-format";
import {
  fringeIntensities,
  standingShape,
  type WavesMode,
  type WavesParams,
  type WavesSample,
} from "@/lib/models/waves-optics";

export function WavesOpticsScene({
  params,
  sample,
  mode,
}: {
  params: WavesParams;
  sample: WavesSample;
  mode: WavesMode;
}) {
  if (mode === "doubleslit") {
    const fringes = fringeIntensities(params, 24);
    return (
      <>
        <LabScenery />
        <mesh position={[-0.35, 0.16, 0]}>
          <boxGeometry args={[0.04, 0.32, 0.4]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.55, 0.16, 0]}>
          <boxGeometry args={[0.02, 0.36, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        {fringes.map((fringe, index) => (
          <mesh key={index} position={[0.54, 0.16, fringe.y * 8]}>
            <boxGeometry args={[0.01, 0.32 * fringe.I + 0.02, 0.018]} />
            <meshStandardMaterial
              color="#a16207"
              emissive="#a16207"
              emissiveIntensity={fringe.I}
            />
          </mesh>
        ))}
        <SphereMass position={[-0.7, 0.16, 0]} radius={0.03} color="#a16207" />
        <SpriteLabel
          text={`Δy ${formatLabSci(sample.deltaY)} m`}
          color="#1e3a5f"
          position={[0.2, 0.4, 0]}
          height={0.07}
        />
        <LabOrbit target={[0.1, 0.16, 0]} minDistance={0.8} maxDistance={12} />
      </>
    );
  }

  const shape = standingShape(params, sample.t);
  const points = shape.map(([x, y]) => [x - params.L / 2, 0.16 + y, 0] as [number, number, number]);

  return (
    <>
      <LabScenery />
      <mesh position={[-params.L / 2, 0.16, 0]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[params.L / 2, 0.16, 0]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <LabLine points={points} color="#1e3a5f" lineWidth={2} />
      <SpriteLabel
        text={`n=${formatLabNumber(params.n)}  f ${formatLabNumber(sample.f)} Hz`}
        color="#1e3a5f"
        position={[0, 0.38, 0]}
        height={0.07}
      />
      <LabOrbit target={[0, 0.16, 0]} minDistance={0.8} maxDistance={12} />
    </>
  );
}
