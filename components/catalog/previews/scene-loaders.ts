export function loadLinearMotionScene() {
  return import("@/components/linear-motion-scene").then((mod) => mod.LinearMotionScene);
}

export function loadProjectileScene() {
  return import("@/components/projectile-scene").then((mod) => mod.ProjectileScene);
}

export function loadPullFrictionScene() {
  return import("@/components/pull-friction-scene").then((mod) => mod.PullFrictionScene);
}

export function loadInclineFrictionScene() {
  return import("@/components/p1/incline-friction-scene").then((mod) => mod.InclineFrictionScene);
}

export function loadAtwoodMachineScene() {
  return import("@/components/p1/atwood-machine-scene").then((mod) => mod.AtwoodMachineScene);
}

export function loadCircularMotionScene() {
  return import("@/components/p1/circular-motion-scene").then((mod) => mod.CircularMotionScene);
}

export function loadConservationOfEnergyScene() {
  return import("@/components/p1/conservation-of-energy-scene").then((mod) => mod.ConservationOfEnergyScene);
}

export function loadImpulseMomentumScene() {
  return import("@/components/p1/impulse-momentum-scene").then((mod) => mod.ImpulseMomentumScene);
}

export function loadTorqueEquilibriumScene() {
  return import("@/components/p1/torque-equilibrium-scene").then((mod) => mod.TorqueEquilibriumScene);
}

export function loadRotationalMotionScene() {
  return import("@/components/p1/rotational-motion-scene").then((mod) => mod.RotationalMotionScene);
}

export function loadAngularMomentumScene() {
  return import("@/components/p1/angular-momentum-scene").then((mod) => mod.AngularMomentumScene);
}

export function loadHarmonicMotionScene() {
  return import("@/components/p1/harmonic-motion-scene").then((mod) => mod.HarmonicMotionScene);
}

export function loadFluidDynamicsScene() {
  return import("@/components/p1/fluid-dynamics-scene").then((mod) => mod.FluidDynamicsScene);
}

export function loadArchimedesScene() {
  return import("@/components/p1/archimedes-scene").then((mod) => mod.ArchimedesScene);
}

export function loadBoylesLawScene() {
  return import("@/components/p2/boyles-law-scene").then((mod) => mod.BoylesLawScene);
}

export function loadThermalConductivityScene() {
  return import("@/components/p2/thermal-conductivity-scene").then((mod) => mod.ThermalConductivityScene);
}

export function loadElectricFieldScene() {
  return import("@/components/p2/electric-field-scene").then((mod) => mod.ElectricFieldScene);
}

export function loadResistorCircuitsScene() {
  return import("@/components/p2/resistor-circuits-scene").then((mod) => mod.ResistorCircuitsScene);
}

export function loadRcCircuitsScene() {
  return import("@/components/p2/rc-circuits-scene").then((mod) => mod.RcCircuitsScene);
}

export function loadMagnetismScene() {
  return import("@/components/p2/magnetism-scene").then((mod) => mod.MagnetismScene);
}

export function loadElectromagneticInductionScene() {
  return import("@/components/p2/electromagnetic-induction-scene").then(
    (mod) => mod.ElectromagneticInductionScene,
  );
}

export function loadGeometricOpticsScene() {
  return import("@/components/p2/geometric-optics-scene").then((mod) => mod.GeometricOpticsScene);
}

export function loadWavesOpticsScene() {
  return import("@/components/p2/waves-optics-scene").then((mod) => mod.WavesOpticsScene);
}

export function loadParticleModelOfLightScene() {
  return import("@/components/p2/particle-model-of-light-scene").then((mod) => mod.ParticleModelOfLightScene);
}

export function loadRotationN2Scene() {
  return import("@/components/p1/rotation-n2-scene").then((mod) => mod.RotationN2Scene);
}

export function loadCapacitanceScene() {
  return import("@/components/p2/capacitance-scene").then((mod) => mod.CapacitanceScene);
}

export function loadRlCircuitsScene() {
  return import("@/components/p2/rl-circuits-scene").then((mod) => mod.RlCircuitsScene);
}

export function loadVariableForceScene() {
  return import("@/components/p1/variable-force-scene").then((mod) => mod.VariableForceScene);
}

export function loadDragForceScene() {
  return import("@/components/p1/drag-force-scene").then((mod) => mod.DragForceScene);
}

export function loadLoopTrackScene() {
  return import("@/components/p1/loop-track-scene").then((mod) => mod.LoopTrackScene);
}

export function loadNonuniformRodScene() {
  return import("@/components/p1/nonuniform-rod-scene").then((mod) => mod.NonuniformRodScene);
}
