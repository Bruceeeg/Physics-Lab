"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import type { TrailPoint } from "@/components/pull-friction-scene";
import {
  derive,
  initialState,
  step,
  type PullParams,
  type PullState,
} from "@/lib/models/pull-friction";

const PreviewCanvas = dynamic(
  () => import("@/components/catalog/previews/pull-friction-preview-canvas"),
  { ssr: false },
);

const PREVIEW_PARAMS: PullParams = {
  F: 20,
  thetaDeg: 30,
  m: 2,
  muS: 0.4,
  muK: 0.3,
  g: 9.81,
};

export function PullFrictionPreview({ running }: { running: boolean }) {
  const [state, setState] = useState<PullState>(initialState);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const stateRef = useRef(state);
  const runningRef = useRef(running);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    runningRef.current = running;
    if (!running) {
      return;
    }

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      if (!runningRef.current) {
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let next = step(PREVIEW_PARAMS, stateRef.current, dt);
      if (next.x > 8 || next.t > 10) {
        next = initialState();
        setTrail([]);
      } else {
        setTrail((points) => {
          const point = { x: next.x, z: next.z };
          return points.length > 80 ? [...points.slice(-79), point] : [...points, point];
        });
      }
      stateRef.current = next;
      setState(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const derived = useMemo(() => derive(PREVIEW_PARAMS, state), [state]);

  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute inset-0">
        <PreviewCanvas
          state={state}
          derived={derived}
          trail={trail}
          params={PREVIEW_PARAMS}
          running={running}
        />
      </div>
    </div>
  );
}
