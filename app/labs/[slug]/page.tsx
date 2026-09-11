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
import { RotationalMotionLab } from "@/components/p1/rotational-motion-lab";
import { TorqueEquilibriumLab } from "@/components/p1/torque-equilibrium-lab";
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

const LAB_PAGES: Record<ReadySlug, ComponentType> = {
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
  return <Lab />;
}
