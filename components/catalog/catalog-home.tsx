"use client";

import { useMemo, useState } from "react";

import { ExperimentCard } from "@/components/catalog/experiment-card";
import { SiteHeader } from "@/components/catalog/site-header";
import {
  clusterByP1Unit,
  listCatalogGroups,
  parseCourseFilter,
  type CourseFilter,
  type ExperimentEntry,
} from "@/lib/experiments/catalog";

const COURSE_CHIPS: { id: CourseFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "p1", label: "Physics 1" },
  { id: "p2", label: "Physics 2" },
  { id: "c-mech", label: "C 力学" },
  { id: "c-em", label: "C 电磁" },
];

function ExperimentGrid({
  experiments,
  previewsPaused,
}: {
  experiments: ExperimentEntry[];
  previewsPaused: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
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

export function CatalogHome() {
  const [course, setCourse] = useState<CourseFilter>("all");
  const [previewPaused, setPreviewPaused] = useState(false);
  const groups = useMemo(() => listCatalogGroups(course), [course]);

  return (
    <div className="min-h-[100dvh] bg-paper text-ink">
      <SiteHeader
        previewPaused={previewPaused}
        onTogglePreview={() => setPreviewPaused((value) => !value)}
      />
      <main className="mx-auto max-w-[1400px] px-5 pb-16 pt-12 md:px-10 md:pt-16">
        <section className="pb-10 md:pb-12">
          <h1 className="text-4xl font-medium tracking-tight text-ink md:text-5xl">
            AP 物理实验
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-quiet md:text-base">
            Physics 1 按考纲八个单元排列，从运动学到流体。探究实验约占课时的四分之一。已开放的实验可点进实验台；Physics 2 与 C 中未开发的预览会变暗，并标成等待开发。
          </p>
        </section>

        <div className="mb-10 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-xs text-quiet">课程</p>
          {COURSE_CHIPS.map((chip) => {
            const selected = course === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCourse(parseCourseFilter(chip.id))}
                className={`h-8 min-w-11 cursor-pointer border px-3 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy ${
                  selected
                    ? "border-navy bg-navy text-white"
                    : "border-line bg-surface text-ink hover:border-navy"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {groups.map((group) => {
          const p1Clusters =
            group.course === "p1" ? clusterByP1Unit(group.experiments) : null;
          return (
            <section key={group.course} className="mb-14" aria-labelledby={`course-${group.course}`}>
              <h2
                id={`course-${group.course}`}
                className="mb-2 text-sm font-medium tracking-wide text-navy"
              >
                {group.title}
              </h2>
              {p1Clusters ? (
                <p className="mb-8 max-w-2xl text-sm text-quiet">
                  选择题占比见各单元。本课程含流体，不含电路、波动或静电。
                </p>
              ) : (
                <div className="mb-6" />
              )}
              {p1Clusters ? (
                p1Clusters.map((cluster) => (
                  <div key={cluster.unit.id} className="mb-10">
                    <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-sm font-medium text-ink">{cluster.unit.title}</h3>
                      <p className="font-mono text-[11px] text-quiet">
                        {cluster.unit.english} · 约 {cluster.unit.weighting}
                      </p>
                    </div>
                    <ExperimentGrid
                      experiments={cluster.experiments}
                      previewsPaused={previewPaused}
                    />
                  </div>
                ))
              ) : (
                <ExperimentGrid
                  experiments={group.experiments}
                  previewsPaused={previewPaused}
                />
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
