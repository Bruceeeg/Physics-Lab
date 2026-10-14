"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  previewLiveCap,
  selectLivePreviewIds,
  type PreviewCandidate,
} from "@/lib/experiments/preview-budget";

export const PREVIEW_RATIO_STEPS = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

type Entry = PreviewCandidate & { running: boolean };

const entries = new Map<number, Entry>();
const listeners = new Set<() => void>();
const serverActivity = { live: 0, running: 0, cap: 8 };

let granted = new Set<number>();
let cap = 8;
let suspended = false;
let runningCount = 0;
let nextId = 1;
let activity = serverActivity;

function allocatePreviewId() {
  const id = nextId;
  nextId += 1;
  return id;
}

function bucketRatio(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return 0;
  }
  return Math.round(Math.min(1, ratio) * 8) / 8;
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function recompute() {
  const nextIds = suspended ? [] : selectLivePreviewIds([...entries.values()], cap, granted);
  const next = new Set(nextIds);
  let grantSame = next.size === granted.size;
  if (grantSame) {
    for (const id of next) {
      if (!granted.has(id)) {
        grantSame = false;
        break;
      }
    }
  }
  let nextRunning = 0;
  if (!suspended) {
    for (const id of next) {
      if (entries.get(id)?.running) {
        nextRunning += 1;
      }
    }
  }
  const activitySame =
    activity.live === next.size && activity.running === nextRunning && activity.cap === cap;
  if (grantSame && nextRunning === runningCount && activitySame) {
    return;
  }
  granted = next;
  runningCount = nextRunning;
  activity = { live: next.size, running: nextRunning, cap };
  emit();
}

export function configurePreviewCap(next: number) {
  if (next === cap) {
    return;
  }
  cap = next;
  recompute();
}

export function setPreviewsSuspended(next: boolean) {
  if (suspended === next) {
    return;
  }
  suspended = next;
  recompute();
}

export function readPreviewCap() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return previewLiveCap({
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    viewportWidth: typeof window === "undefined" ? undefined : window.innerWidth,
    viewportHeight: typeof window === "undefined" ? undefined : window.innerHeight,
  });
}

function upsertPreview(id: number, ratio: number, tier: number, running: boolean) {
  const current = entries.get(id);
  if (current && current.ratio === ratio && current.tier === tier && current.running === running) {
    return;
  }
  entries.set(id, { id, ratio, tier, running });
  recompute();
}

function removePreview(id: number) {
  if (!entries.delete(id)) {
    return;
  }
  recompute();
}

export function subscribePreviews(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPreviewActivity() {
  return activity;
}

export function getServerPreviewActivity() {
  return serverActivity;
}

function isPreviewGranted(id: number) {
  return granted.has(id);
}

export function bindPreviewObserver(node: Element, onRatio: (ratio: number) => void) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      onRatio(entry?.isIntersecting ? entry.intersectionRatio : 0);
    },
    { threshold: PREVIEW_RATIO_STEPS, rootMargin: "0px" },
  );
  observer.observe(node);
  return () => observer.disconnect();
}

export function usePreviewSlot(tier: number, running: boolean) {
  const [id] = useState(allocatePreviewId);
  const ratioRef = useRef(0);
  const tierRef = useRef(tier);
  const runningRef = useRef(running);
  const [grantedNow, setGrantedNow] = useState(false);

  useEffect(() => {
    tierRef.current = tier;
    runningRef.current = running;
  }, [tier, running]);

  useEffect(() => {
    return subscribePreviews(() => {
      const next = isPreviewGranted(id);
      setGrantedNow((current) => (current === next ? current : next));
    });
  }, [id]);

  useEffect(() => {
    upsertPreview(id, ratioRef.current, tier, running);
  }, [id, tier, running]);

  useEffect(() => () => removePreview(id), [id]);

  const report = useCallback((ratio: number) => {
    const next = bucketRatio(ratio);
    if (next === ratioRef.current) {
      return;
    }
    ratioRef.current = next;
    upsertPreview(id, next, tierRef.current, runningRef.current);
  }, [id]);

  return { granted: grantedNow, report };
}

export function usePreviewActivity() {
  return useSyncExternalStore(subscribePreviews, getPreviewActivity, getServerPreviewActivity);
}
