"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { CatalogPreview3D, useCatalogPreviewRuntime } from "@/components/catalog/previews/preview-3d";
import {
  adjacentCourse,
  experimentHref,
  getCourseOverview,
  isReadyExperiment,
  listFeaturedExperiments,
  nextFeaturedStep,
  type CourseId,
  type ExperimentEntry,
} from "@/lib/experiments/catalog";
import { FEATURED_CLIP_MS } from "@/lib/experiments/preview-timing";

let featuredAutoplayGen = 0;

function FeaturedPreview({
  experiment,
  running,
  fill = false,
}: {
  experiment: ExperimentEntry;
  running: boolean;
  fill?: boolean;
}) {
  const ready = isReadyExperiment(experiment);
  const scene = ready ? (
    <CatalogPreview3D
      kind={experiment.preview}
      slug={experiment.slug}
      running={running}
      visible
      hero={fill}
    />
  ) : (
    <div className="h-full w-full bg-muted opacity-40" />
  );

  return (
    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-[8px] border border-line bg-muted">
      {scene}
    </div>
  );
}

export function CourseOverview({
  previewsPaused,
  compact = false,
}: {
  previewsPaused: boolean;
  compact?: boolean;
}) {
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrolling } = useCatalogPreviewRuntime();
  const [slide, setSlide] = useState<CourseId>("p1");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inView, setInView] = useState(true);
  const [holdAutoplay, setHoldAutoplay] = useState(false);
  const overview = getCourseOverview(slide);
  const featuredLabs = listFeaturedExperiments(slide);
  const featured = featuredLabs[featuredIndex] ?? featuredLabs[0];
  const slideNumber = ["p1", "p2", "c-mech", "c-em"].indexOf(slide) + 1;

  const slideRef = useRef(slide);
  const featuredIndexRef = useRef(featuredIndex);
  const holdAutoplayRef = useRef(holdAutoplay);
  const previewsPausedRef = useRef(previewsPaused);
  const inViewRef = useRef(inView);
  const reduceMotionRef = useRef(reduceMotion);
  const clipEpochRef = useRef(0);

  slideRef.current = slide;
  featuredIndexRef.current = featuredIndex;
  holdAutoplayRef.current = holdAutoplay;
  previewsPausedRef.current = previewsPaused;
  inViewRef.current = inView;
  reduceMotionRef.current = reduceMotion;

  const applyStep = useCallback((next: { course: CourseId; featuredIndex: number }) => {
    if (next.course === slideRef.current && next.featuredIndex === featuredIndexRef.current) {
      return;
    }
    slideRef.current = next.course;
    featuredIndexRef.current = next.featuredIndex;
    clipEpochRef.current += 1;
    setSlide(next.course);
    setFeaturedIndex(next.featuredIndex);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduce = () => setReduceMotion(media.matches);
    syncReduce();
    media.addEventListener("change", syncReduce);
    return () => media.removeEventListener("change", syncReduce);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const gen = ++featuredAutoplayGen;
    let elapsed = 0;
    let epoch = clipEpochRef.current;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (gen !== featuredAutoplayGen) {
        return;
      }
      const dt = Math.min(now - last, 100);
      last = now;
      if (clipEpochRef.current !== epoch) {
        elapsed = 0;
        epoch = clipEpochRef.current;
      }
      const playing =
        inViewRef.current &&
        !previewsPausedRef.current &&
        !reduceMotionRef.current &&
        !holdAutoplayRef.current;
      if (playing) {
        elapsed += dt;
        if (elapsed >= FEATURED_CLIP_MS) {
          elapsed = 0;
          const current = slideRef.current;
          const featuredCount = listFeaturedExperiments(current).length;
          applyStep(nextFeaturedStep(current, featuredIndexRef.current, featuredCount));
          epoch = clipEpochRef.current;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      featuredAutoplayGen += 1;
      window.cancelAnimationFrame(frame);
    };
  }, [applyStep]);

  const go = (step: number) => {
    applyStep({ course: adjacentCourse(slide, step), featuredIndex: 0 });
  };

  const running = Boolean(featured) && !previewsPaused && !reduceMotion && !scrolling;

  return (
    <section
      ref={sectionRef}
      className={compact ? "flex min-h-0 flex-1 flex-col" : "mb-14"}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="sr-only">
        课程概览
      </h2>
      <p className="sr-only" aria-live="polite">
        当前 {overview.title}
        {featured ? `，${featured.title}` : ""}
        ，第 {slideNumber} 门，共 4 门
      </p>

      <div
        className={`relative flex ${
          compact ? "min-h-0 flex-1 items-center overflow-hidden" : "mt-4 items-stretch md:mt-6"
        }`}
      >
        <div
          className={`relative min-w-0 flex-1 px-5 sm:px-6 ${
            compact ? "flex min-h-0 flex-col overflow-hidden" : ""
          }`}
        >
          <button
            type="button"
            aria-label="上一门课程"
            onClick={() => go(-1)}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-lg text-ink shadow-[0_8px_20px_rgb(15_23_42/8%)] touch-manipulation hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            aria-label="下一门课程"
            onClick={() => go(1)}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-lg text-ink shadow-[0_8px_20px_rgb(15_23_42/8%)] touch-manipulation hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            <span aria-hidden="true">›</span>
          </button>

          <article
            className={`overflow-hidden rounded-[12px] border border-line bg-surface ${
              compact ? "max-h-full w-full" : ""
            }`}
          >
            <div
              className={`grid lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] ${
                compact ? "max-h-full" : ""
              }`}
            >
              <div
                className={
                  compact
                    ? "min-h-0 overflow-y-auto px-5 py-6 md:px-8 md:pt-8 md:pb-7"
                    : "p-5 md:p-7"
                }
              >
                <p className="text-xs text-quiet">{overview.kicker}</p>
                <h3
                  className={`font-medium tracking-tight text-ink ${
                    compact ? "mt-2 text-xl md:text-2xl" : "mt-2 text-2xl md:text-[28px]"
                  }`}
                >
                  {overview.title}
                </h3>
                <p
                  className={`text-quiet ${
                    compact
                      ? "mt-1.5 max-w-[62ch] text-xs leading-5 md:text-sm md:leading-6"
                      : "mt-3 max-w-[62ch] text-sm leading-6"
                  }`}
                >
                  {overview.blurb}
                </p>
                <div className={compact ? "mt-3" : "mt-6 overflow-x-auto"}>
                  <p className="text-xs text-quiet">考纲结构</p>
                  <table
                    className={`w-full border-collapse text-left ${
                      compact ? "mt-1 text-xs" : "mt-2 min-w-[28rem] text-sm"
                    }`}
                  >
                    <caption className="sr-only">{overview.title} 考纲单元与选择题占比</caption>
                    <thead>
                      <tr className="border-b border-line text-xs text-quiet">
                        <th className={`pr-3 font-medium ${compact ? "py-1.5" : "py-2"}`}>单元</th>
                        <th className={`pr-3 font-medium ${compact ? "py-1.5" : "py-2"}`}>英文名称</th>
                        <th className={`font-medium ${compact ? "py-1.5" : "py-2"}`}>选择题约</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.units.map((unit) => (
                        <tr key={unit.id} className="border-b border-line last:border-b-0">
                          <td className={`pr-3 text-ink ${compact ? "py-1.5" : "py-2.5"}`}>
                            {unit.title}
                          </td>
                          <td className={`pr-3 text-quiet ${compact ? "py-1.5" : "py-2.5"}`}>
                            {unit.english}
                          </td>
                          <td className={`font-mono text-xs text-quiet ${compact ? "py-1.5" : "py-2.5"}`}>
                            {unit.weighting}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div
                className={`lg:border-l lg:border-line ${
                  compact
                    ? "overflow-hidden px-5 py-6 md:px-8 md:pt-8 md:pb-7"
                    : "border-t border-line p-5 md:p-6"
                }`}
                onPointerEnter={() => setHoldAutoplay(true)}
                onPointerLeave={() => setHoldAutoplay(false)}
                onFocusCapture={() => setHoldAutoplay(true)}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setHoldAutoplay(false);
                  }
                }}
              >
                <p className="shrink-0 text-xs text-quiet">重点实验</p>
                {featured ? (
                  <>
                    <FeaturedPreview
                      key={featured.slug}
                      experiment={featured}
                      running={running}
                      fill={compact}
                    />
                    {featuredLabs.length > 1 ? (
                      <div className="mt-2 flex shrink-0 flex-wrap gap-1" role="group" aria-label="本课重点实验">
                        {featuredLabs.map((item, index) => {
                          const selected = item.slug === featured.slug;
                          return (
                            <button
                              key={item.slug}
                              type="button"
                              aria-current={selected ? "true" : undefined}
                              aria-label={item.title}
                              onClick={() => applyStep({ course: slide, featuredIndex: index })}
                              className="flex h-6 w-6 cursor-pointer items-center justify-center touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full border ${
                                  selected
                                    ? "border-navy bg-navy"
                                    : "border-line bg-muted"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <h4 className={`shrink-0 font-medium text-ink ${compact ? "mt-2 text-sm" : "mt-4 text-base"}`}>
                      {featured.title}
                    </h4>
                    <p className="mt-1 shrink-0 font-mono text-xs text-quiet">{featured.formula}</p>
                    <p
                      className={`shrink-0 text-quiet ${
                        compact ? "mt-1 line-clamp-2 text-xs leading-5" : "mt-2 text-sm leading-6"
                      }`}
                    >
                      {featured.summary}
                    </p>
                    {isReadyExperiment(featured) ? (
                      <Link
                        href={experimentHref(featured.slug)}
                        className={`inline-flex min-h-11 shrink-0 items-center text-sm text-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                          compact ? "mt-2" : "mt-4"
                        }`}
                      >
                        → 进入实验台
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 text-sm text-quiet">这门课还没有可进入的实验台。</p>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
