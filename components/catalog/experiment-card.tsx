"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CatalogPreview3D, useCatalogPreviewRuntime } from "@/components/catalog/previews/preview-3d";
import {
  experimentHref,
  isReadyExperiment,
  type ExperimentEntry,
} from "@/lib/experiments/catalog";

const PRELOAD_MARGIN = "320px 0px";
const UNMOUNT_DELAY_MS = 400;

export function ExperimentCard({
  experiment,
  previewsPaused,
}: {
  experiment: ExperimentEntry;
  previewsPaused: boolean;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef(0);
  const { scrolling } = useCatalogPreviewRuntime();
  const [inView, setInView] = useState(false);
  const [held, setHeld] = useState(false);
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
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          window.clearTimeout(leaveTimer.current);
          setHeld(true);
          return;
        }
        window.clearTimeout(leaveTimer.current);
        leaveTimer.current = window.setTimeout(() => setHeld(false), UNMOUNT_DELAY_MS);
      },
      { threshold: 0, rootMargin: PRELOAD_MARGIN },
    );
    const playback = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.05, rootMargin: "0px" },
    );
    preload.observe(node);
    playback.observe(node);
    return () => {
      preload.disconnect();
      playback.disconnect();
      window.clearTimeout(leaveTimer.current);
    };
  }, []);

  const resetTilt = () => {
    const face = faceRef.current;
    if (!face) {
      return;
    }
    face.style.setProperty("--rx", "0deg");
    face.style.setProperty("--ry", "0deg");
    face.style.setProperty("--tz", "0px");
  };

  const tiltFace = () => {
    const face = faceRef.current;
    if (!face || reduceMotion) {
      return;
    }
    face.style.setProperty("--tz", "8px");
  };

  const running = inView && !previewsPaused && !reduceMotion && !scrolling;

  const media = (
    <div
      ref={mediaRef}
      className="relative aspect-[16/10] overflow-hidden rounded-[8px] border border-line bg-muted"
    >
      <div className="h-full w-full">
        {ready ? (
          <CatalogPreview3D
            kind={experiment.preview}
            slug={experiment.slug}
            running={running}
            visible={held}
          />
        ) : (
          <div className="h-full w-full bg-muted opacity-40" />
        )}
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
      <h3 className={`mt-2.5 px-0.5 text-sm font-medium ${ready ? "text-ink" : "text-quiet"}`}>
        {experiment.title}
      </h3>
      <p className="mt-1 px-0.5 font-mono text-xs text-quiet">{experiment.formula}</p>
    </>
  );

  return (
    <article
      className={`catalog-card-3d relative ${ready ? "is-ready" : "is-pending"}`}
      aria-disabled={ready ? undefined : "true"}
      onPointerMove={tiltFace}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
    >
      <div ref={faceRef} className="catalog-card-3d__face rounded-[16px]">
        {ready ? (
          <Link
            href={experimentHref(experiment.slug)}
            className="absolute inset-0 z-10 cursor-pointer rounded-[16px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy"
          >
            <span className="sr-only">
              {experiment.title}，{experiment.formula}
            </span>
          </Link>
        ) : null}
        {media}
        {caption}
      </div>
    </article>
  );
}
