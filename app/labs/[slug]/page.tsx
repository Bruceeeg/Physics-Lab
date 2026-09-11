import type { ComponentType } from "react";

import { LinearMotionLab } from "@/components/linear-motion-lab";
import { AngularMomentumLab } from "@/components/p1/angular-momentum-lab";
import { ArchimedesLab } from "@/components/p1/archimedes-lab";
import { AtwoodMachineLab } from "@/components/p1/atwood-machine-lab";
import { CircularMotionLab } from "@/components/p1/circular-motion-lab";
import { ConservationOfEnergyLab } from "@/components/p1/conservation-of-energy-lab";
import { FluidDynamicsLab } from "@/components/p1/fluid-dynamics-lab";
import { HarmonicMotionLab } from "@/components/p1/harmonic-motion-lab";
import { ImpulseMomentumLab } from "@/components/p1/impulse-momentum-lab";
import { InclineFrictionLab } from "@/components/p1/incline-friction-lab";
import { RotationN2Lab } from "@/components/p1/rotation-n2-lab";
import { RotationalMotionLab } from "@/components/p1/rotational-motion-lab";
import { TorqueEquilibriumLab } from "@/components/p1/torque-equilibrium-lab";
import { BoylesLawLab } from "@/components/p2/boyles-law-lab";
import { CapacitanceLab } from "@/components/p2/capacitance-lab";
import { ElectricFieldLab } from "@/components/p2/electric-field-lab";
import { ElectromagneticInductionLab } from "@/components/p2/electromagnetic-induction-lab";
import { GeometricOpticsLab } from "@/components/p2/geometric-optics-lab";
import { MagnetismLab } from "@/components/p2/magnetism-lab";
import { ParticleModelOfLightLab } from "@/components/p2/particle-model-of-light-lab";
import { RcCircuitsLab } from "@/components/p2/rc-circuits-lab";
import { ResistorCircuitsLab } from "@/components/p2/resistor-circuits-lab";
import { RlCircuitsLab } from "@/components/p2/rl-circuits-lab";
import { ThermalConductivityLab } from "@/components/p2/thermal-conductivity-lab";
import { WavesOpticsLab } from "@/components/p2/waves-optics-lab";
import { ProjectileLab } from "@/components/projectile-lab";
import { PullFrictionLab } from "@/components/pull-friction-lab";
import {
  getExperiment,
  listExperimentSlugs,
  isReadyExperiment,
  type ReadySlug,
} from "@/lib/experiments/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const LAB_PAGES: Record<ReadySlug, ComponentType<{ slug?: string }>> = {
  "linear-motion": LinearMotionLab,
  "projectile-motion": ProjectileLab,
  "pull-friction": PullFrictionLab,
  "incline-friction": InclineFrictionLab,
  "atwood-machine": AtwoodMachineLab,
  "circular-motion": CircularMotionLab,
  "conservation-of-energy": ConservationOfEnergyLab,
  "impulse-momentum": ImpulseMomentumLab,
  "torque-equilibrium": TorqueEquilibriumLab,
  "rotational-motion": RotationalMotionLab,
  "angular-momentum": AngularMomentumLab,
  "harmonic-motion": HarmonicMotionLab,
  "fluid-dynamics": FluidDynamicsLab,
  archimedes: ArchimedesLab,
  "boyles-law": BoylesLawLab,
  "thermal-conductivity": ThermalConductivityLab,
  "electric-field": ElectricFieldLab,
  "resistor-circuits": ResistorCircuitsLab,
  "rc-circuits": RcCircuitsLab,
  magnetism: MagnetismLab,
  "electromagnetic-induction": ElectromagneticInductionLab,
  "geometric-optics": GeometricOpticsLab,
  "waves-optics": WavesOpticsLab,
  "particle-model-of-light": ParticleModelOfLightLab,
  "rotational-inertia": RotationN2Lab,
  "rotation-n2": RotationN2Lab,
  "ballistic-pendulum": ImpulseMomentumLab,
  "physical-pendulum": HarmonicMotionLab,
  equipotential: ElectricFieldLab,
  "coulombs-law": ElectricFieldLab,
  capacitance: CapacitanceLab,
  "rl-circuits": RlCircuitsLab,
  solenoid: MagnetismLab,
};

type LabPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listExperimentSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LabPageProps): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment || !isReadyExperiment(experiment)) {
    return { title: "未找到实验" };
  }
  return {
    title: experiment.title,
    description: experiment.summary,
  };
}

export default async function LabPage({ params }: LabPageProps) {
  const { slug } = await params;
  const experiment = getExperiment(slug);
  if (!experiment || !isReadyExperiment(experiment)) {
    notFound();
  }
  const Lab = LAB_PAGES[experiment.slug];
  return <Lab key={experiment.slug} slug={experiment.slug} />;
}
