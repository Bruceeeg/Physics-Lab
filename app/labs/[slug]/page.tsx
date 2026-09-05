import type { ComponentType } from "react";

import { LinearMotionLab } from "@/components/linear-motion-lab";
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
