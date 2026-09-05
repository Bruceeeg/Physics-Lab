"use client";

import { useEffect, useRef, useState } from "react";

const X0 = 0;
const V0 = 3;
const A = 1.5;
const DURATION = 4;
const X_END = X0 + V0 * DURATION + 0.5 * A * DURATION * DURATION;

function positionAt(time: number) {
  return X0 + V0 * time + 0.5 * A * time * time;
}

export function LinearMotionPreview({ running }: { running: boolean }) {
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const runningRef = useRef(running);

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
      let next = timeRef.current + dt;
      if (next >= DURATION) {
        next = 0;
      }
      timeRef.current = next;
      setTime(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const x = positionAt(time);
  const percent = 8 + (x / X_END) * 80;

  return (
    <div className="relative h-full w-full bg-muted" aria-hidden="true">
      <div className="absolute inset-x-5 top-1/2 h-px bg-line" />
      <div
        className="absolute top-1/2 h-7 w-7 border border-ink bg-navy"
        style={{
          left: `${percent}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
