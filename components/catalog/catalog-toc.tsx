"use client";

import { useEffect, useMemo, useState } from "react";

import {
  clusterByCEmUnit,
  clusterByCMechUnit,
  clusterByP1Unit,
  clusterByP2Unit,
  listCatalogGroups,
  type CourseFilter,
  type CourseId,
  type ExperimentEntry,
} from "@/lib/experiments/catalog";

export type CatalogUnitCluster = {
  id: string;
  unit: { id: string; title: string; english: string; weighting: string };
  experiments: ExperimentEntry[];
};

export type CatalogGroupView = {
  course: CourseId;
  title: string;
  blurb: string;
  clusters: CatalogUnitCluster[];
};

function courseBlurb(course: CourseId) {
  if (course === "p1") {
    return "选择题占比见各单元。本课程含流体，不含电路、波动或静电。";
  }
  if (course === "p2") {
    return "选择题占比见各单元。本课程含电路、电场、波动与近代物理，不含流体。";
  }
  if (course === "c-mech") {
    return "选择题占比见各单元。与 Physics 1 重合的力学实验已开放，并补上变力积分、阻力微分方程、圆环轨道、非均匀杆、扭摆与斜面阿特伍德。不含流体。";
  }
  return "选择题占比见各单元。与 Physics 2 重合的电学实验已开放，并补上高斯定理、库仑悬挂、等势线、电容、螺线管与 RL。不含光学与近代物理。";
}

function clusterGroup(course: CourseId, experiments: ExperimentEntry[]) {
  if (course === "p1") {
    return clusterByP1Unit(experiments);
  }
  if (course === "p2") {
    return clusterByP2Unit(experiments);
  }
  if (course === "c-mech") {
    return clusterByCMechUnit(experiments);
  }
  return clusterByCEmUnit(experiments);
}

export function courseHeadingId(course: CourseId) {
  return `course-${course}`;
}

export function unitHeadingId(course: CourseId, unitId: string) {
  return `course-${course}-unit-${unitId}`;
}

export function courseTocLabel(course: CourseId) {
  if (course === "p1") {
    return "Physics 1";
  }
  if (course === "p2") {
    return "Physics 2";
  }
  if (course === "c-mech") {
    return "C 力学";
  }
  return "C 电磁";
}

export function buildCatalogTree(filter: CourseFilter): CatalogGroupView[] {
  return listCatalogGroups(filter).map((group) => ({
    course: group.course,
    title: group.title,
    blurb: courseBlurb(group.course),
    clusters: clusterGroup(group.course, group.experiments).map((cluster) => ({
      id: unitHeadingId(group.course, cluster.unit.id),
      unit: cluster.unit,
      experiments: cluster.experiments,
    })),
  }));
}

function headingIds(tree: CatalogGroupView[]) {
  const ids: string[] = [];
  for (const group of tree) {
    ids.push(courseHeadingId(group.course));
    for (const cluster of group.clusters) {
      ids.push(cluster.id);
    }
  }
  return ids;
}

function jumpTo(id: string) {
  const node = document.getElementById(id);
  if (!node) {
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function TocChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-1.5 w-1.5 border-t-[1.5px] border-r-[1.5px] border-current transition-transform duration-150 ease-out motion-reduce:transition-none ${
        open ? "translate-y-[-1px] rotate-[135deg]" : "rotate-45"
      }`}
    />
  );
}

function tocLinkClass(active: boolean, extra = "") {
  return `inline-flex min-h-11 items-center rounded-[6px] px-2.5 text-xs touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:min-h-8 ${
    active ? "bg-muted font-medium text-navy" : "text-quiet hover:text-ink"
  } ${extra}`;
}

function CatalogTocState({
  tree,
  variant,
}: {
  tree: CatalogGroupView[];
  variant: "mobile" | "side";
}) {
  const ids = useMemo(() => headingIds(tree), [tree]);
  const [activeId, setActiveId] = useState(ids[0] ?? "");
  const [open, setOpen] = useState<Partial<Record<CourseId, boolean>>>({});

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) {
      return;
    }
    let frame = 0;
    let nextId = "";
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (!id) {
          return;
        }
        nextId = id;
        if (frame) {
          return;
        }
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          setActiveId((current) => (current === nextId ? current : nextId));
        });
      },
      { rootMargin: "-72px 0px -62% 0px", threshold: [0.08, 0.25, 0.6] },
    );
    for (const node of nodes) {
      observer.observe(node);
    }
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [ids]);

  if (tree.length === 0) {
    return null;
  }

  const toggle = (course: CourseId) => {
    setOpen((prev) => {
      const nextOpen = !prev[course];
      if (variant === "mobile") {
        return nextOpen ? { [course]: true } : {};
      }
      return { ...prev, [course]: nextOpen };
    });
  };

  const jump = (id: string) => {
    setActiveId(id);
    jumpTo(id);
  };

  const isCourseHighlighted = (group: CatalogGroupView) => {
    const heading = courseHeadingId(group.course);
    if (activeId === heading) {
      return true;
    }
    if (open[group.course]) {
      return false;
    }
    return group.clusters.some((cluster) => cluster.id === activeId);
  };

  const courseRow = (group: CatalogGroupView) => {
    const heading = courseHeadingId(group.course);
    const label = courseTocLabel(group.course);
    const expanded = Boolean(open[group.course]);
    const panelId = `toc-panel-${variant}-${group.course}`;
    const active = isCourseHighlighted(group);

    return (
      <div className="flex w-full min-w-0 items-center">
        <a
          href={`#${heading}`}
          aria-current={active ? "location" : undefined}
          onClick={(event) => {
            event.preventDefault();
            setOpen((prev) =>
              variant === "mobile" ? { [group.course]: true } : { ...prev, [group.course]: true },
            );
            jump(heading);
          }}
          className={tocLinkClass(
            active,
            variant === "side" ? "min-w-0 flex-1 whitespace-normal text-left" : "whitespace-nowrap",
          )}
        >
          {label}
        </a>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={expanded ? `收起 ${label}` : `展开 ${label}`}
          onClick={() => toggle(group.course)}
          className="ml-auto inline-flex h-11 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-quiet touch-manipulation hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy md:h-8"
        >
          <TocChevron open={expanded} />
        </button>
      </div>
    );
  };

  const unitList = (group: CatalogGroupView, extraClass: string) => {
    const expanded = Boolean(open[group.course]);
    const panelId = `toc-panel-${variant}-${group.course}`;
    return (
      <ul id={panelId} hidden={!expanded} className={extraClass}>
        {group.clusters.map((cluster) => {
          const active = expanded && cluster.id === activeId;
          return (
            <li key={cluster.id}>
              <a
                href={`#${cluster.id}`}
                aria-current={active ? "location" : undefined}
                tabIndex={expanded ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  jump(cluster.id);
                }}
                className={tocLinkClass(
                  active,
                  variant === "side" ? "w-full whitespace-normal text-left" : "whitespace-nowrap",
                )}
              >
                {cluster.unit.title}
              </a>
            </li>
          );
        })}
      </ul>
    );
  };

  if (variant === "mobile") {
    return (
      <nav
        aria-label="实验目录"
        className="sticky top-14 z-10 border-b border-line bg-paper/95 px-5 py-2"
      >
        <p className="sr-only">目录</p>
        <div className="catalog-scroll-quiet -mx-1 overflow-x-auto px-1">
          <ul className="flex gap-1">
            {tree.map((group) => (
              <li key={group.course} className="shrink-0">
                {courseRow(group)}
              </li>
            ))}
          </ul>
          {tree.map((group) => (
            <div key={`${group.course}-units`}>
              {unitList(group, "mt-1 flex gap-1 pb-0.5")}
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="实验目录"
      className="catalog-scroll-quiet max-h-[calc(100dvh-5.5rem)] w-48 shrink-0 overflow-y-auto bg-paper lg:w-52"
    >
      <p className="mb-2 text-xs font-medium text-ink">目录</p>
      <ul className="space-y-0.5">
        {tree.map((group) => (
          <li key={group.course}>
            {courseRow(group)}
            {unitList(group, "space-y-0.5 pl-3")}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CatalogToc({
  tree,
  variant,
}: {
  tree: CatalogGroupView[];
  variant: "mobile" | "side";
}) {
  const resetKey = headingIds(tree).join("|");
  return <CatalogTocState key={`${variant}:${resetKey}`} tree={tree} variant={variant} />;
}
