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
import { RotationalMotionLab } from "@/components/p1/rotational-motion-lab";
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
  "pull-friction": PullFrictionLab,
  "linear-motion": LinearMotionLab,
  "projectile-motion": ProjectileLab,
  "circular-motion": CircularMotionLab,
  "conservation-of-energy": ConservationOfEnergyLab,
  "impulse-momentum": ImpulseMomentumLab,
  "harmonic-motion": HarmonicMotionLab,
  "rotational-motion": RotationalMotionLab,
  "fluid-dynamics": FluidDynamicsLab,
  "atwood-machine": AtwoodMachineLab,
  "angular-momentum": AngularMomentumLab,
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
