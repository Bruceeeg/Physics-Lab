"use client";

import { useMemo, useState } from "react";

import { ExperimentCard } from "@/components/catalog/experiment-card";
import { SiteHeader } from "@/components/catalog/site-header";
import {
  listCatalogGroups,
  parseCourseFilter,
  type CourseFilter,
} from "@/lib/experiments/catalog";

const COURSE_CHIPS: { id: CourseFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "p1", label: "Physics 1" },
  { id: "p2", label: "Physics 2" },
  { id: "c-mech", label: "C 力学" },
  { id: "c-em", label: "C 电磁" },
];

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
            按课程浏览。已开放的实验可点进实验台；未开发的预览会变暗，并标成等待开发。
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

        {groups.map((group) => (
          <section key={group.course} className="mb-14" aria-labelledby={`course-${group.course}`}>
            <h2
              id={`course-${group.course}`}
              className="mb-6 text-sm font-medium tracking-wide text-navy"
            >
              {group.title}
            </h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
              {group.experiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.slug}
                  experiment={experiment}
                  previewsPaused={previewPaused}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
