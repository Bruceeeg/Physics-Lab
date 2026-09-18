"use client";

import { useMemo, useState } from "react";

import { CourseOverview } from "@/components/catalog/course-overview";
import { ExperimentCard } from "@/components/catalog/experiment-card";
import { PreviewHost } from "@/components/catalog/previews/preview-3d";
import { SiteHeader } from "@/components/catalog/site-header";
import {
  buildCatalogTree,
  CatalogToc,
  courseHeadingId,
  type CatalogGroupView,
} from "@/components/catalog/catalog-toc";
import { useCatalogStage } from "@/components/catalog/use-catalog-stage";
import {
  COURSE_SUMMARIES,
  SITE_LEDE,
  type ExperimentEntry,
} from "@/lib/experiments/catalog";

function ExperimentGrid({
  experiments,
  previewsPaused,
}: {
  experiments: ExperimentEntry[];
  previewsPaused: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
      {experiments.map((experiment) => (
        <ExperimentCard
          key={experiment.slug}
          experiment={experiment}
          previewsPaused={previewsPaused}
        />
      ))}
    </div>
  );
}

function CatalogLabs({
  tree,
  previewsPaused,
}: {
  tree: CatalogGroupView[];
  previewsPaused: boolean;
}) {
  return (
    <>
      {tree.map((group) => (
        <section
          key={group.course}
          className="mb-10 last:mb-0"
          aria-labelledby={courseHeadingId(group.course)}
        >
          <h2
            id={courseHeadingId(group.course)}
            className="mb-1 scroll-mt-20 text-sm font-medium tracking-wide text-navy"
          >
            {group.title}
          </h2>
          <p className="mb-5 max-w-2xl text-sm text-quiet">{group.blurb}</p>
          {group.clusters.map((cluster) => (
            <div key={cluster.id} className="mb-8 last:mb-0">
              <div
                id={cluster.id}
                className="mb-3 flex scroll-mt-20 flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <h3 className="text-sm font-medium text-ink">{cluster.unit.title}</h3>
                <p className="font-mono text-[11px] text-quiet">
                  {cluster.unit.english} · 约 {cluster.unit.weighting}
                </p>
              </div>
              <ExperimentGrid
                experiments={cluster.experiments}
                previewsPaused={previewsPaused}
              />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

export function CatalogHome() {
  const [previewPaused, setPreviewPaused] = useState(false);
  const { stage, heroExiting, heroReturning, enter, leave, onHeroTransitionEnd } =
    useCatalogStage();
  const tree = useMemo(() => buildCatalogTree("all"), []);
  const heroClass = [
    "catalog-hero",
    heroExiting ? "is-exiting" : "",
    stage === "catalog" ? "is-overlay" : "",
    heroReturning ? "is-in" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const header = (
    <SiteHeader
      previewPaused={previewPaused}
      onTogglePreview={() => setPreviewPaused((value) => !value)}
      onHome={leave}
    />
  );

  return (
    <PreviewHost>
      <div className="bg-paper text-ink">
        <section
          className={heroClass}
          aria-label="课程概览"
          aria-hidden={stage === "catalog" || undefined}
          inert={stage === "catalog" || undefined}
          onTransitionEnd={onHeroTransitionEnd}
        >
            {header}
            <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-5 pt-6 md:px-10 md:pt-8">
              <header className="catalog-hero-copy shrink-0 pb-8 md:pb-10">
                <h1 className="text-4xl font-medium tracking-tight text-ink md:text-5xl">
                  AP 物理实验
                </h1>
                <div className="catalog-hero-lede mt-4 grid gap-6 md:mt-5 md:grid-cols-2 md:gap-10 lg:gap-16">
                  <p className="max-w-[42rem] text-sm leading-6 text-quiet md:text-[15px] md:leading-7">
                    {SITE_LEDE}
                  </p>
                  <ul className="space-y-2.5 text-sm leading-6 text-quiet md:text-[15px] md:leading-7">
                    {COURSE_SUMMARIES.map((item) => (
                      <li key={item.id}>
                        <span className="font-medium text-ink">{item.label}：</span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </header>
              <div className="flex min-h-0 flex-1 flex-col">
                <CourseOverview compact previewsPaused={previewPaused || stage === "catalog"} />
              </div>
              <div className="flex shrink-0 justify-center pb-5 pt-3 md:pb-6">
                <button
                  type="button"
                  className="catalog-enter-btn"
                  aria-label="查看实验列表"
                  onClick={enter}
                >
                  <span className="catalog-enter-btn__glyph" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

        {stage === "catalog" ? (
          <div className={`catalog-labs-page${heroReturning ? " is-covered" : ""}`}>
            {header}
            <div className="md:hidden">
              <CatalogToc tree={tree} variant="mobile" />
            </div>
            <div className="mx-auto flex max-w-[1400px] items-start gap-8 px-5 pb-16 pt-4 md:gap-10 md:px-10 md:pt-5">
              <div className="sticky top-20 hidden self-start md:block">
                <CatalogToc tree={tree} variant="side" />
              </div>
              <main className="min-w-0 flex-1">
                <h1 className="sr-only">实验列表</h1>
                <CatalogLabs tree={tree} previewsPaused={previewPaused} />
              </main>
            </div>
          </div>
        ) : null}
      </div>
    </PreviewHost>
  );
}
