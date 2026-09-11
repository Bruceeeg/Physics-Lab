"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { appendTimeSample } from "@/lib/models/time-series";

export type LabPoint = [number, number, number];

export function useLabPlayback<T extends { t: number }>(
  compute: (time: number) => { sample: T; point: LabPoint },
  getLimit?: () => number | null,
  options?: { rate?: number },
) {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [series, setSeries] = useState<T[]>(() => [compute(0).sample]);
  const [trail, setTrail] = useState<LabPoint[]>(() => [compute(0).point]);

  const timeRef = useRef(0);
  const playingRef = useRef(false);
  const frameRef = useRef(0);
  const lastStampRef = useRef(0);
  const computeRef = useRef(compute);
  const getLimitRef = useRef(getLimit);
  const rateRef = useRef(options?.rate ?? 1);

  useEffect(() => {
    computeRef.current = compute;
    getLimitRef.current = getLimit;
    rateRef.current = options?.rate ?? 1;
  }, [compute, getLimit, options?.rate]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const stopLoop = () => {
    playingRef.current = false;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  };

  const pause = useCallback(() => {
    stopLoop();
    setIsPlaying(false);
  }, []);

  const record = useCallback((next: number, seed: boolean) => {
    const live = computeRef.current(next);
    if (seed || next <= 1e-9) {
      setSeries([live.sample]);
      setTrail([live.point]);
    } else {
      setSeries((current) => appendTimeSample(current, live.sample));
      setTrail((current) => {
        const last = current[current.length - 1];
        const point = live.point;
        if (
          last &&
          Math.hypot(last[0] - point[0], last[1] - point[1], last[2] - point[2]) < 0.02
        ) {
          return current;
        }
        const appended = [...current, point];
        return appended.length > 400 ? appended.slice(-400) : appended;
      });
    }
    timeRef.current = next;
    setTime(next);
    return next;
  }, []);

  const applyTime = useCallback(
    (value: number) => {
      const limit = getLimitRef.current?.() ?? null;
      let next = Math.max(0, value);
      let hitLimit = false;
      if (limit !== null && Number.isFinite(limit) && next >= limit) {
        next = Math.max(0, limit);
        hitLimit = true;
      }
      record(next, next <= 1e-9);
      if (hitLimit && playingRef.current) {
        playingRef.current = false;
        setIsPlaying(false);
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = 0;
        }
      }
      return next;
    },
    [record],
  );

  const start = useCallback(() => {
    if (playingRef.current) {
      return;
    }
    const limit = getLimitRef.current?.() ?? null;
    if (limit !== null && Number.isFinite(limit) && timeRef.current >= limit - 1e-9) {
      record(0, true);
    }
    playingRef.current = true;
    setIsPlaying(true);
    lastStampRef.current = 0;

    const tick = (now: number) => {
      if (!playingRef.current) {
        frameRef.current = 0;
        return;
      }
      if (lastStampRef.current === 0) {
        lastStampRef.current = now;
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.05, Math.max(0, (now - lastStampRef.current) / 1000));
      lastStampRef.current = now;
      applyTime(timeRef.current + dt * Math.max(0.02, rateRef.current));
      if (playingRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [applyTime, record]);

  const reset = useCallback(() => {
    pause();
    lastStampRef.current = 0;
    record(0, true);
  }, [pause, record]);

  const live = compute(time);
  const chartSeries =
    time <= 1e-9
      ? [live.sample]
      : series.length > 0 && Math.abs(series[series.length - 1].t - live.sample.t) < 1e-4
        ? series
        : [...series, live.sample];
  const displayTrail = time <= 1e-9 ? [live.point] : trail;

  return {
    time,
    isPlaying,
    start,
    pause,
    reset,
    sample: live.sample,
    series: chartSeries,
    trail: displayTrail,
  };
}
