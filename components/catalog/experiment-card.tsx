"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LinearMotionPreview } from "@/components/catalog/previews/linear-motion-preview";
import { PullFrictionPreview } from "@/components/catalog/previews/pull-friction-preview";
import { SchematicPreview } from "@/components/catalog/previews/schematic-preview";
import {
  experimentHref,
  isReadyExperiment,
  type ExperimentEntry,
} from "@/lib/experiments/catalog";

function PreviewMedia({
  experiment,
  running,
}: {
  experiment: ExperimentEntry;
  running: boolean;
}) {
  if (experiment.preview === "pull-friction") {
    return <PullFrictionPreview running={running} />;
  }
  if (experiment.preview === "linear-motion") {
    return <LinearMotionPreview running={running} />;
  }
  return <SchematicPreview kind={experiment.preview} running={running} />;
}

export function ExperimentCard({
  experiment,
  previewsPaused,
}: {
  experiment: ExperimentEntry;
  previewsPaused: boolean;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const ready = isReadyExperiment(experiment);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduce = () => setReduceMotion(media.matches);
    syncReduce();
    media.addEventListener("change", syncReduce);
    return () => media.removeEventListener("change", syncReduce);
  }, []);

  useEffect(() => {
    const node = mediaRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const running = visible && !previewsPaused && !reduceMotion;

  const media = (
    <div
      ref={mediaRef}
      className={`relative aspect-[16/10] overflow-hidden rounded-[14px] border bg-muted ${
        ready
          ? "border-line transition-colors duration-200 group-hover:border-navy"
          : "border-line"
      }`}
    >
      <div className={ready ? "h-full w-full" : "h-full w-full opacity-40 grayscale"}>
        <PreviewMedia experiment={experiment} running={running} />
      </div>
      {ready ? null : (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-line bg-paper/92 px-3 py-1.5 text-xs text-gold">
          等待开发
        </p>
      )}
    </div>
  );

  const caption = (
    <>
      <h3 className={`mt-2.5 text-sm font-medium ${ready ? "text-ink" : "text-quiet"}`}>
        {experiment.title}
      </h3>
      <p className="mt-1 font-mono text-xs text-quiet">{experiment.formula}</p>
    </>
  );

  if (!ready) {
    return (
      <article className="relative" aria-disabled="true">
        <div className="relative">{media}</div>
        {caption}
      </article>
    );
  }

  return (
    <article className="group relative">
      <Link
        href={experimentHref(experiment.slug)}
        className="absolute inset-0 z-10 cursor-pointer rounded-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
      >
        <span className="sr-only">
          {experiment.title}，{experiment.formula}
        </span>
      </Link>
      {media}
      {caption}
    </article>
  );
}
