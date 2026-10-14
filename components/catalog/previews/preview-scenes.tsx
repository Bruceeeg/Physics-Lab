"use client";

import { PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { PerspectiveCamera as CameraImpl } from "three";

import { LabPreviewMode } from "@/components/lab-3d";
import { LabelScaleContext } from "@/components/scene-label";
import { LazyScene } from "@/components/catalog/previews/lazy-scene";
import {
  loadAngularMomentumScene,
  loadArchimedesScene,
  loadAtwoodMachineScene,
  loadBoylesLawScene,
  loadCapacitanceScene,
  loadCircularMotionScene,
  loadConservationOfEnergyScene,
  loadDragForceScene,
  loadElectricFieldScene,
  loadElectromagneticInductionScene,
  loadFluidDynamicsScene,
  loadGeometricOpticsScene,
  loadHarmonicMotionScene,
  loadImpulseMomentumScene,
  loadInclineFrictionScene,
  loadLinearMotionScene,
  loadLoopTrackScene,
  loadMagnetismScene,
  loadNonuniformRodScene,
  loadParticleModelOfLightScene,
  loadProjectileScene,
  loadPullFrictionScene,
  loadRcCircuitsScene,
  loadResistorCircuitsScene,
  loadRlCircuitsScene,
  loadRotationN2Scene,
  loadRotationalMotionScene,
  loadThermalConductivityScene,
  loadTorqueEquilibriumScene,
  loadVariableForceScene,
  loadWavesOpticsScene,
} from "@/components/catalog/previews/scene-loaders";
import type { TrailPoint } from "@/components/pull-friction-scene";
import type { PreviewKind } from "@/lib/experiments/catalog";
import { PREVIEW_CYCLE, PREVIEW_PLAY } from "@/lib/experiments/preview-timing";
import { DEFAULT_ANGMOM, fallTime, sampleAt as angMomAt } from "@/lib/models/angular-momentum";
import { DEFAULT_ARCHIMEDES, LOWER_DURATION, sampleAt as archimedesAt } from "@/lib/models/archimedes";
import { DEFAULT_ATWOOD, sampleAt as atwoodAt, timeToStop } from "@/lib/models/atwood-machine";
import { BOYLE_DURATION, DEFAULT_BOYLE, sampleAt as boyleAt } from "@/lib/models/boyles-law";
import { CAP_DURATION, DEFAULT_CAP, sampleAt as capAt } from "@/lib/models/capacitance";
import {
  DEFAULT_CIRCULAR,
  period as circularPeriod,
  sampleAt as circularAt,
  type CircularMode,
} from "@/lib/models/circular-motion";
import { DEFAULT_ENERGY, sampleAt as energyAt, springTime } from "@/lib/models/conservation-of-energy";
import { DEFAULT_DRAG, durationOf as dragDuration, sampleAt as dragAt } from "@/lib/models/drag-force";
import {
  DEFAULT_ELECTRIC,
  FIELD_DURATION,
  sampleAt as electricAt,
  type ElectricMode,
} from "@/lib/models/electric-field";
import { DEFAULT_INDUCTION, coilDuration, sampleAt as inductionAt } from "@/lib/models/electromagnetic-induction";
import { DEFAULT_FLUID, flightTime as fluidFlight, sampleAt as fluidAt } from "@/lib/models/fluid-dynamics";
import { DEFAULT_OPTICS, OPTICS_DURATION, sampleAt as opticsAt } from "@/lib/models/geometric-optics";
import { DEFAULT_HARMONIC, period as harmonicPeriod, sampleAt as harmonicAt } from "@/lib/models/harmonic-motion";
import { DEFAULT_IMPULSE, sampleAt as impulseAt } from "@/lib/models/impulse-momentum";
import { DEFAULT_INCLINE, sampleAt as inclineAt, timeToLimit } from "@/lib/models/incline-friction";
import { DEFAULT_LOOP, durationOf as loopDuration, sampleAt as loopAt } from "@/lib/models/loop-track";
import { motionSample } from "@/lib/models/linear-motion";
import { DEFAULT_MAGNETISM, MAGNETISM_DURATION, sampleAt as magnetismAt } from "@/lib/models/magnetism";
import { DEFAULT_NONUNIFORM_ROD, period as rodPeriod, sampleAt as rodAt } from "@/lib/models/nonuniform-rod";
import { DEFAULT_PHOTON, PHOTON_DURATION, sampleAt as photonAt } from "@/lib/models/particle-model-of-light";
import { derive, initialState, step, type PullParams } from "@/lib/models/pull-friction";
import { DEFAULT_PROJECTILE_MASS, flightTime, range, sampleAt as projectileAt, type ProjectileParams } from "@/lib/models/projectile";
import { DEFAULT_RC, chargeDuration, sampleAt as rcAt } from "@/lib/models/rc-circuits";
import { DEFAULT_RESISTOR, sampleAt as resistorAt } from "@/lib/models/resistor-circuits";
import { DEFAULT_RL, rlDuration, sampleAt as rlAt } from "@/lib/models/rl-circuits";
import { DEFAULT_ROTATION_N2, sampleAt as rotationN2At, timeToFloor } from "@/lib/models/rotation-n2";
import { DEFAULT_ROLLING, sampleAt as rollingAt, timeToBottom } from "@/lib/models/rotational-motion";
import { DEFAULT_THERMAL, THERMAL_DURATION, sampleAt as thermalAt } from "@/lib/models/thermal-conductivity";
import { DEFAULT_TORQUE, sampleAt as torqueAt } from "@/lib/models/torque-equilibrium";
import { DEFAULT_VARIABLE_FORCE, durationOf as variableDuration, sampleAt as variableAt } from "@/lib/models/variable-force";
import { DEFAULT_WAVES, sampleAt as wavesAt } from "@/lib/models/waves-optics";

type Vec3 = [number, number, number];
type HeroFrame = {
  camera?: Vec3;
  target?: Vec3;
  fov?: number;
  dolly?: number;
};

const PreviewHeroContext = createContext(false);

const PULL_PARAMS: PullParams = {
  F: 20,
  thetaDeg: 30,
  m: 2,
  muS: 0.4,
  muK: 0.3,
  g: 9.81,
};

const PROJECTILE_PARAMS: ProjectileParams = {
  v0: 5,
  thetaDeg: 30,
  h: 1,
  g: 9.81,
  m: DEFAULT_PROJECTILE_MASS,
};

function simSpan(limit: number, fallback = 3) {
  if (!Number.isFinite(limit) || limit < 0.2) {
    return fallback;
  }
  return limit;
}

function usePreviewTime(running: boolean, simDuration: number) {
  const [time, setTime] = useState(0);
  const elapsed = useRef(0);
  const hold = useRef(0);
  const span = Math.min(Math.max(0.2, simDuration), PREVIEW_PLAY);

  useFrame((_, dt) => {
    if (!running) {
      return;
    }
    elapsed.current += dt;
    if (elapsed.current >= PREVIEW_CYCLE) {
      elapsed.current %= PREVIEW_CYCLE;
    }
    const next =
      elapsed.current >= PREVIEW_PLAY
        ? span
        : (elapsed.current / PREVIEW_PLAY) * span;
    hold.current += dt;
    if (hold.current >= 1 / 30) {
      hold.current = 0;
      setTime(next);
    }
  });

  return time;
}

function dollyToward(camera: Vec3, target: Vec3, factor: number): Vec3 {
  if (factor >= 0.99) {
    return camera;
  }
  return [
    target[0] + (camera[0] - target[0]) * factor,
    target[1] + (camera[1] - target[1]) * factor,
    target[2] + (camera[2] - target[2]) * factor,
  ];
}

function PreviewRig({
  camera,
  target,
  fov = 45,
  dolly = 1,
  heroFrame,
  children,
}: {
  camera: Vec3;
  target: Vec3;
  fov?: number;
  dolly?: number;
  heroFrame?: HeroFrame;
  children: ReactNode;
}) {
  const hero = useContext(PreviewHeroContext);
  const cam = useRef<CameraImpl>(null);
  const look = hero && heroFrame?.target ? heroFrame.target : target;
  const usedFov = hero && heroFrame?.fov != null ? heroFrame.fov : fov;
  const usedCamera = hero && heroFrame?.camera ? heroFrame.camera : camera;
  const usedDolly =
    hero && heroFrame ? (heroFrame.dolly ?? 1) : dolly;
  const framed = dollyToward(usedCamera, look, usedDolly);

  useFrame(() => {
    cam.current?.lookAt(look[0], look[1], look[2]);
  });

  return (
    <LabPreviewMode>
      <LabelScaleContext.Provider value={hero ? 1.15 : 0}>
        <PerspectiveCamera
          ref={cam}
          makeDefault
          fov={usedFov}
          near={0.08}
          far={80}
          position={framed}
        />
        {children}
      </LabelScaleContext.Provider>
    </LabPreviewMode>
  );
}

function LinearPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, 2.6);
  const sample = motionSample(0, 1.6, 0.7, time);
  return (
    <PreviewRig camera={[1.9, 0.95, 2.5]} target={[0, 0.2, 0]} fov={42}>
      <LazyScene name="linear-motion" load={loadLinearMotionScene} x={sample.x} min={0} max={4.4} v={sample.v} />
    </PreviewRig>
  );
}

function ProjectilePreview({ running }: { running: boolean }) {
  const hang = flightTime(PROJECTILE_PARAMS);
  const time = usePreviewTime(running, simSpan(hang));
  const flown = Math.min(time, hang);
  const sample = projectileAt(PROJECTILE_PARAMS, flown);
  const span = range(PROJECTILE_PARAMS);
  return (
    <PreviewRig
      camera={[span * 0.28, 1.7, span * 0.95]}
      target={[span * 0.42, 0.55, 0]}
      fov={42}
      heroFrame={{ camera: [span * 0.18, 1.45, span * 1.12], target: [span * 0.36, 0.42, 0], fov: 42 }}
    >
      <LazyScene name="projectile" load={loadProjectileScene}
        params={PROJECTILE_PARAMS}
        sample={sample}
        trail={[]}
        showPrediction
        showVelocity
        landingX={span}
        target={null}
        frameParams={PROJECTILE_PARAMS}
        allowRefit={false}
      />
    </PreviewRig>
  );
}

function PullPreview({ running }: { running: boolean }) {
  const [state, setState] = useState(initialState);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const stateRef = useRef(state);
  const trailRef = useRef<TrailPoint[]>([]);
  const cycle = useRef(0);
  const hold = useRef(0);

  useFrame((_, dt) => {
    if (!running) {
      return;
    }
    cycle.current += dt;
    if (cycle.current >= PREVIEW_CYCLE) {
      cycle.current %= PREVIEW_CYCLE;
      const fresh = initialState();
      stateRef.current = fresh;
      trailRef.current = [];
      setState(fresh);
      setTrail([]);
    }
    if (cycle.current >= PREVIEW_PLAY) {
      return;
    }
    const rate = 2.8 / PREVIEW_PLAY;
    const next = step(PULL_PARAMS, stateRef.current, Math.min(0.05, dt) * rate);
    if (next.x > 8 || next.t > 10) {
      return;
    }
    const point = { x: next.x, z: next.z };
    const points = trailRef.current;
    trailRef.current = points.length > 80 ? [...points.slice(-79), point] : [...points, point];
    stateRef.current = next;
    hold.current += dt;
    if (hold.current >= 1 / 30) {
      hold.current = 0;
      setState(next);
      setTrail(trailRef.current);
    }
  });

  const derived = useMemo(() => derive(PULL_PARAMS, state), [state]);

  return (
    <PreviewRig
      camera={[state.x + 4.6, 2.8 + state.z, 5.4]}
      target={[state.x, 0.4 + state.z, 0]}
      fov={38}
      dolly={0.55}
    >
      <LazyScene name="pull-friction" load={loadPullFrictionScene}
        state={state}
        derived={derived}
        trail={trail}
        params={PULL_PARAMS}
        interactive={false}
      />
    </PreviewRig>
  );
}

function InclinePreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(timeToLimit(DEFAULT_INCLINE)));
  const sample = inclineAt(DEFAULT_INCLINE, time);
  return (
    <PreviewRig camera={[1.8, 0.95, 2.8]} target={[0.45, 0.22, 0]} fov={42}>
      <LazyScene name="incline" load={loadInclineFrictionScene} params={DEFAULT_INCLINE} sample={sample} />
    </PreviewRig>
  );
}

function AtwoodPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(timeToStop(DEFAULT_ATWOOD)));
  const sample = atwoodAt(DEFAULT_ATWOOD, time);
  return (
    <PreviewRig camera={[1.6, 1.1, 2.8]} target={[0, 0.55, 0]} dolly={0.68}>
      <LazyScene name="atwood" load={loadAtwoodMachineScene} sample={sample} params={DEFAULT_ATWOOD} />
    </PreviewRig>
  );
}

function circularMode(slug: string): CircularMode {
  if (slug === "horizontal-circular") {
    return "horizontal";
  }
  if (slug === "vertical-circular") {
    return "vertical";
  }
  return "conical";
}

function CircularPreview({ running, slug }: { running: boolean; slug: string }) {
  const mode = circularMode(slug);
  const time = usePreviewTime(running, simSpan(circularPeriod(DEFAULT_CIRCULAR, mode)));
  const sample = circularAt(DEFAULT_CIRCULAR, time, mode);
  const target: Vec3 = mode === "horizontal" ? [0, 0.16, 0] : [0, 0.45, 0];
  const dolly = mode === "horizontal" ? 0.4 : mode === "vertical" ? 0.48 : 0.5;
  return (
    <PreviewRig
      camera={[2.4, 1.7, 3.6]}
      target={target}
      dolly={dolly}
      heroFrame={
        mode === "vertical"
          ? { camera: [0.85, 0.90, 1.52], target: [0, 0.65, 0], fov: 42 }
          : undefined
      }
    >
      <LazyScene name="circular" load={loadCircularMotionScene} params={DEFAULT_CIRCULAR} sample={sample} trail={[]} mode={mode} />
    </PreviewRig>
  );
}

function EnergyPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(springTime(DEFAULT_ENERGY) * 4, 3.4));
  const sample = energyAt(DEFAULT_ENERGY, time, "launch");
  return (
    <PreviewRig
      camera={[1.6, 1.1, 2.8]}
      target={[0.1, 0.28, 0]}
      dolly={0.7}
      heroFrame={{ camera: [1.05, 0.70, 1.70], target: [0.18, 0.30, 0], fov: 42 }}
    >
      <LazyScene name="energy" load={loadConservationOfEnergyScene} params={DEFAULT_ENERGY} sample={sample} trail={[]} />
    </PreviewRig>
  );
}

function MomentumPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, 2.8);
  const sample = impulseAt(DEFAULT_IMPULSE, time, "collision");
  return (
    <PreviewRig camera={[0.2, 1.4, 3.2]} target={[0, 0.16, 0]} dolly={0.42}>
      <LazyScene name="impulse" load={loadImpulseMomentumScene} sample={sample} trail={[]} params={DEFAULT_IMPULSE} />
    </PreviewRig>
  );
}

function BallisticPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, 2.6);
  const sample = impulseAt({ ...DEFAULT_IMPULSE, L: 0.8 }, time, "ballistic");
  return (
    <PreviewRig camera={[0.4, 1.2, 2.6]} target={[0, 0.45, 0]} dolly={0.55}>
      <LazyScene name="impulse" load={loadImpulseMomentumScene}
        sample={sample}
        trail={[]}
        mode="ballistic"
        params={{ ...DEFAULT_IMPULSE, L: 0.8 }}
      />
    </PreviewRig>
  );
}

function TorquePreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, 3.2);
  const sample = torqueAt(DEFAULT_TORQUE, time);
  return (
    <PreviewRig camera={[1.1, 0.7, 1.8]} target={[0, 0.35, 0]} fov={42}>
      <LazyScene name="torque" load={loadTorqueEquilibriumScene} params={DEFAULT_TORQUE} sample={sample} />
    </PreviewRig>
  );
}

function RollPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(timeToBottom(DEFAULT_ROLLING)));
  const sample = rollingAt(DEFAULT_ROLLING, time);
  return (
    <PreviewRig camera={[1.8, 1.2, 2.8]} target={[0.4, 0.28, 0]} dolly={0.58}>
      <LazyScene name="rotation" load={loadRotationalMotionScene} params={DEFAULT_ROLLING} sample={sample} trail={[]} />
    </PreviewRig>
  );
}

function AngMomPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(fallTime(DEFAULT_ANGMOM) + 1.4));
  const sample = angMomAt(DEFAULT_ANGMOM, time, "drop");
  return (
    <PreviewRig camera={[1.2, 1.1, 2.2]} target={[0, 0.28, 0]} dolly={0.68}>
      <LazyScene name="angmom" load={loadAngularMomentumScene} params={DEFAULT_ANGMOM} sample={sample} />
    </PreviewRig>
  );
}

function PendulumPreview({ running, physical }: { running: boolean; physical?: boolean }) {
  const mode = physical ? "physical" : "pendulum";
  const time = usePreviewTime(running, simSpan(harmonicPeriod(DEFAULT_HARMONIC, mode)));
  const sample = harmonicAt(DEFAULT_HARMONIC, time, mode);
  return (
    <PreviewRig camera={[1.6, 1.2, 2.8]} target={[0, 0.35, 0]} dolly={physical ? 0.4 : 0.48}>
      <LazyScene name="harmonic" load={loadHarmonicMotionScene} params={DEFAULT_HARMONIC} sample={sample} trail={[]} mode={mode} />
    </PreviewRig>
  );
}

function FluidsPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(fluidFlight(DEFAULT_FLUID)));
  const sample = fluidAt(DEFAULT_FLUID, time);
  return (
    <PreviewRig
      camera={[1.4, 0.9, 2.6]}
      target={[0.2, 0.28, 0]}
      dolly={0.66}
      heroFrame={{ camera: [1.02, 0.92, 1.78], target: [0.30, 0.44, 0], fov: 42 }}
    >
      <LazyScene name="fluids" load={loadFluidDynamicsScene} params={DEFAULT_FLUID} sample={sample} />
    </PreviewRig>
  );
}

function ArchimedesPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(LOWER_DURATION));
  const sample = archimedesAt(DEFAULT_ARCHIMEDES, time);
  return (
    <PreviewRig camera={[0.55, 0.45, 1.15]} target={[0, 0.22, 0]} fov={42}>
      <LazyScene name="archimedes" load={loadArchimedesScene} params={DEFAULT_ARCHIMEDES} sample={sample} />
    </PreviewRig>
  );
}

function BoylePreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(BOYLE_DURATION));
  const sample = boyleAt(DEFAULT_BOYLE, time);
  return (
    <PreviewRig
      camera={[0.55, 0.42, 1.15]}
      target={[0, 0.28, 0]}
      fov={42}
      heroFrame={{ camera: [0.58, 0.48, 1.18], target: [0, 0.40, 0], fov: 42 }}
    >
      <LazyScene name="boyle" load={loadBoylesLawScene} params={DEFAULT_BOYLE} sample={sample} />
    </PreviewRig>
  );
}

function ThermalPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(THERMAL_DURATION));
  const sample = thermalAt(DEFAULT_THERMAL, time);
  return (
    <PreviewRig camera={[0.75, 0.42, 1.15]} target={[0, 0.14, 0]} fov={42}>
      <LazyScene name="thermal" load={loadThermalConductivityScene} params={DEFAULT_THERMAL} sample={sample} mode="single" />
    </PreviewRig>
  );
}

function electricMode(slug: string): ElectricMode {
  if (slug === "coulombs-law") {
    return "pith";
  }
  if (slug === "equipotential") {
    return "equipotential";
  }
  return "point";
}

function CoulombPreview({ running, slug }: { running: boolean; slug: string }) {
  const mode = electricMode(slug);
  const time = usePreviewTime(running, simSpan(FIELD_DURATION));
  const sample = electricAt(DEFAULT_ELECTRIC, time, mode);
  const pith = mode === "pith";
  return (
    <PreviewRig
      camera={pith ? [0.35, 0.85, 1.55] : [0.55, 0.38, 1.05]}
      target={pith ? [0, 0.28, 0] : [0, 0.12, 0]}
      fov={42}
      dolly={pith ? 0.6 : 0.82}
      heroFrame={
        pith
          ? undefined
          : { camera: [0.48, 0.32, 0.78], target: [0, 0.12, 0], fov: 42 }
      }
    >
      <LazyScene name="electric" load={loadElectricFieldScene} params={DEFAULT_ELECTRIC} sample={sample} mode={mode} />
    </PreviewRig>
  );
}

function EquipotentialPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(FIELD_DURATION));
  const sample = electricAt(DEFAULT_ELECTRIC, time, "equipotential");
  return (
    <PreviewRig camera={[0.55, 0.38, 1.05]} target={[0, 0.12, 0]} fov={42}>
      <LazyScene name="electric" load={loadElectricFieldScene} params={DEFAULT_ELECTRIC} sample={sample} mode="equipotential" />
    </PreviewRig>
  );
}

function ResistorPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, 4);
  const sample = resistorAt(DEFAULT_RESISTOR, time, "series");
  return (
    <PreviewRig camera={[0.35, 0.55, 0.95]} target={[0, 0.12, 0]} fov={42}>
      <LazyScene name="resistor" load={loadResistorCircuitsScene} sample={sample} mode="series" />
    </PreviewRig>
  );
}

function RcPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(chargeDuration(DEFAULT_RC), 3.2));
  const sample = rcAt(DEFAULT_RC, time, "charge");
  return (
    <PreviewRig
      camera={[0.4, 0.5, 0.95]}
      target={[0, 0.12, 0]}
      fov={42}
      heroFrame={{ camera: [0.28, 0.36, 0.6], target: [0, 0.1, 0], fov: 42 }}
    >
      <LazyScene name="rc" load={loadRcCircuitsScene} sample={sample} mode="charge" />
    </PreviewRig>
  );
}

function MagnetPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(MAGNETISM_DURATION));
  const sample = magnetismAt(DEFAULT_MAGNETISM, time, "wire");
  return (
    <PreviewRig camera={[0.7, 0.5, 1.15]} target={[0, 0.16, 0]} fov={42}>
      <LazyScene name="magnetism" load={loadMagnetismScene} params={DEFAULT_MAGNETISM} sample={sample} mode="wire" />
    </PreviewRig>
  );
}

function SolenoidPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(MAGNETISM_DURATION));
  const sample = magnetismAt(DEFAULT_MAGNETISM, time, "solenoid");
  return (
    <PreviewRig
      camera={[0.42, 0.38, 0.72]}
      target={[0, 0.18, 0]}
      fov={42}
      heroFrame={{ camera: [0.18, 0.26, 0.38], target: [0, 0.18, 0], fov: 42 }}
    >
      <LazyScene name="magnetism" load={loadMagnetismScene} params={DEFAULT_MAGNETISM} sample={sample} mode="solenoid" />
    </PreviewRig>
  );
}

function InductionPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(coilDuration(DEFAULT_INDUCTION)));
  const sample = inductionAt(DEFAULT_INDUCTION, time, "coil");
  return (
    <PreviewRig camera={[0.7, 0.5, 1.2]} target={[0, 0.16, 0]} fov={42} dolly={0.55}>
      <LazyScene name="induction" load={loadElectromagneticInductionScene} params={DEFAULT_INDUCTION} sample={sample} mode="coil" />
    </PreviewRig>
  );
}

function OpticsPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(OPTICS_DURATION));
  const sample = opticsAt(DEFAULT_OPTICS, time, "convex");
  return (
    <PreviewRig
      camera={[0.15, 0.45, 1.55]}
      target={[0, 0.14, 0]}
      fov={42}
      heroFrame={{ camera: [-0.05, 0.38, 1.12], target: [-0.08, 0.14, 0], fov: 42 }}
    >
      <LazyScene name="optics" load={loadGeometricOpticsScene} sample={sample} mode="convex" />
    </PreviewRig>
  );
}

function WavesPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, 3.2);
  const sample = wavesAt(DEFAULT_WAVES, time, "standing");
  return (
    <PreviewRig camera={[0.4, 0.45, 1.35]} target={[0, 0.16, 0]} fov={42} dolly={0.65}>
      <LazyScene name="waves" load={loadWavesOpticsScene} params={DEFAULT_WAVES} sample={sample} mode="standing" />
    </PreviewRig>
  );
}

function PhotonPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(PHOTON_DURATION));
  const sample = photonAt(DEFAULT_PHOTON, time, "led");
  return (
    <PreviewRig camera={[0.45, 0.38, 0.95]} target={[0, 0.16, 0]} fov={42}>
      <LazyScene name="photon" load={loadParticleModelOfLightScene} sample={sample} mode="led" />
    </PreviewRig>
  );
}

function N2RotPreview({ running, hoop }: { running: boolean; hoop?: boolean }) {
  const params = hoop ? { ...DEFAULT_ROTATION_N2, shape: "hoop" as const } : DEFAULT_ROTATION_N2;
  const time = usePreviewTime(running, simSpan(timeToFloor(params)));
  const sample = rotationN2At(params, time);
  return (
    <PreviewRig camera={[1.4, 1.1, 2.4]} target={[0, 0.7, 0]} dolly={0.5}>
      <LazyScene name="n2rot" load={loadRotationN2Scene} params={params} sample={sample} />
    </PreviewRig>
  );
}

function CapacitancePreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(CAP_DURATION));
  const sample = capAt(DEFAULT_CAP, time, "gap");
  return (
    <PreviewRig
      camera={[0.35, 0.28, 0.7]}
      target={[0, 0.16, 0]}
      fov={42}
      heroFrame={{ camera: [0.26, 0.24, 0.5], target: [0, 0.16, 0], fov: 42 }}
    >
      <LazyScene name="capacitance" load={loadCapacitanceScene} sample={sample} />
    </PreviewRig>
  );
}

function RlPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(rlDuration(DEFAULT_RL, "grow")));
  const sample = rlAt(DEFAULT_RL, time, "grow");
  return (
    <PreviewRig
      camera={[0.4, 0.5, 0.95]}
      target={[0, 0.12, 0]}
      fov={42}
      heroFrame={{ camera: [0.28, 0.36, 0.6], target: [0, 0.1, 0], fov: 42 }}
    >
      <LazyScene name="rl" load={loadRlCircuitsScene} sample={sample} mode="grow" />
    </PreviewRig>
  );
}

function VariableForcePreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(variableDuration(DEFAULT_VARIABLE_FORCE, "fx")));
  const sample = variableAt(DEFAULT_VARIABLE_FORCE, time, "fx");
  return (
    <PreviewRig
      camera={[1.4, 0.9, 2.4]}
      target={[0, 0.16, 0]}
      dolly={0.48}
      heroFrame={{ dolly: 0.4 }}
    >
      <LazyScene name="variable-force" load={loadVariableForceScene} params={DEFAULT_VARIABLE_FORCE} sample={sample} trail={[]} mode="fx" />
    </PreviewRig>
  );
}

function DragForcePreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(dragDuration(DEFAULT_DRAG, "linear")));
  const sample = dragAt(DEFAULT_DRAG, time, "linear");
  return (
    <PreviewRig
      camera={[1.2, 1.1, 2.2]}
      target={[0, 0.7, 0]}
      heroFrame={{ camera: [1.35, 1.05, 2.05], target: [0, 0.82, 0], fov: 42 }}
    >
      <LazyScene name="drag-force" load={loadDragForceScene} params={DEFAULT_DRAG} sample={sample} trail={[]} />
    </PreviewRig>
  );
}

function LoopTrackPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(loopDuration(DEFAULT_LOOP)));
  const sample = loopAt(DEFAULT_LOOP, time, "slide");
  return (
    <PreviewRig
      camera={[1.4, 1.1, 2.6]}
      target={[0, 0.35, 0]}
      dolly={0.6}
      heroFrame={{ camera: [0.12, 1.05, 1.90], target: [-0.45, 0.58, 0], fov: 42 }}
    >
      <LazyScene name="loop-track" load={loadLoopTrackScene} params={DEFAULT_LOOP} sample={sample} trail={[]} mode="slide" />
    </PreviewRig>
  );
}

function NonuniformRodPreview({ running }: { running: boolean }) {
  const time = usePreviewTime(running, simSpan(rodPeriod(DEFAULT_NONUNIFORM_ROD, "linear")));
  const sample = rodAt(DEFAULT_NONUNIFORM_ROD, time, "linear");
  return (
    <PreviewRig
      camera={[1.4, 1.2, 2.4]}
      target={[0, 0.55, 0]}
      dolly={0.5}
      heroFrame={{ camera: [1.20, 0.92, 1.75], target: [0, 0.72, 0], fov: 42 }}
    >
      <LazyScene name="nonuniform-rod" load={loadNonuniformRodScene} params={DEFAULT_NONUNIFORM_ROD} sample={sample} mode="linear" />
    </PreviewRig>
  );
}

function TorsionPreview({ running }: { running: boolean }) {
  const params = { ...DEFAULT_HARMONIC, L: 0.28, springCount: 3, kappaT: 0.45, theta0Deg: 22 };
  const time = usePreviewTime(running, simSpan(harmonicPeriod(params, "torsion")));
  const sample = harmonicAt(params, time, "torsion");
  return (
    <PreviewRig camera={[1.2, 0.9, 2.0]} target={[0, 0.28, 0]}>
      <LazyScene name="harmonic" load={loadHarmonicMotionScene} params={params} sample={sample} trail={[]} mode="torsion" />
    </PreviewRig>
  );
}

function PreviewKindSwitch({
  kind,
  slug,
  running,
}: {
  kind: PreviewKind;
  slug: string;
  running: boolean;
}) {
  switch (kind) {
    case "linear-motion":
      return <LinearPreview running={running} />;
    case "projectile":
      return <ProjectilePreview running={running} />;
    case "pull-friction":
      return <PullPreview running={running} />;
    case "incline":
      return <InclinePreview running={running} />;
    case "atwood":
      return <AtwoodPreview running={running} />;
    case "circular":
      return <CircularPreview running={running} slug={slug} />;
    case "energy":
      return <EnergyPreview running={running} />;
    case "momentum":
      return <MomentumPreview running={running} />;
    case "shm":
      return <PendulumPreview running={running} />;
    case "physical-pendulum":
      return <PendulumPreview running={running} physical />;
    case "variable-force":
      return <VariableForcePreview running={running} />;
    case "drag-force":
      return <DragForcePreview running={running} />;
    case "loop-track":
      return <LoopTrackPreview running={running} />;
    case "nonuniform-rod":
      return <NonuniformRodPreview running={running} />;
    case "torsional-pendulum":
      return <TorsionPreview running={running} />;
    case "rotation":
      return <RollPreview running={running} />;
    case "inertia":
      return <N2RotPreview running={running} hoop />;
    case "torque":
      return <TorquePreview running={running} />;
    case "angmom":
      return <AngMomPreview running={running} />;
    case "fluids":
      return <FluidsPreview running={running} />;
    case "archimedes":
      return <ArchimedesPreview running={running} />;
    case "boyle":
      return <BoylePreview running={running} />;
    case "thermal":
      return <ThermalPreview running={running} />;
    case "coulomb":
      return <CoulombPreview running={running} slug={slug} />;
    case "resistor":
    case "ohm":
      return <ResistorPreview running={running} />;
    case "rc":
      return <RcPreview running={running} />;
    case "rl":
      return <RlPreview running={running} />;
    case "magnetism":
      return <MagnetPreview running={running} />;
    case "solenoid":
      return <SolenoidPreview running={running} />;
    case "induction":
      return <InductionPreview running={running} />;
    case "optics":
      return <OpticsPreview running={running} />;
    case "waves":
      return <WavesPreview running={running} />;
    case "photon":
      return <PhotonPreview running={running} />;
    case "n2rot":
      return <N2RotPreview running={running} />;
    case "ballistic":
      return <BallisticPreview running={running} />;
    case "equipotential":
      return <EquipotentialPreview running={running} />;
    case "capacitance":
      return <CapacitancePreview running={running} />;
    default:
      return <LinearPreview running={running} />;
  }
}

export function PreviewKindScene({
  kind,
  slug,
  running,
  hero = false,
}: {
  kind: PreviewKind;
  slug: string;
  running: boolean;
  hero?: boolean;
}) {
  return (
    <PreviewHeroContext.Provider value={hero}>
      <PreviewKindSwitch kind={kind} slug={slug} running={running} />
    </PreviewHeroContext.Provider>
  );
}
