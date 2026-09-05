"use client";

import { useEffect, useRef, useState } from "react";

import {
  attachedLoopPeriod,
  DEFAULT_ENERGY,
  sampleAt,
} from "@/lib/models/conservation-of-energy";

const JUNCTION = { x: 86, y: 80 };
const SCALE = 180;
const RAMP = Math.atan2(44, 56);
const CART_W = 16;
const CART_H = 10;
const VISUAL_PERIOD = 3.2;

function trackPoint(s: number) {
  if (s <= 0) {
    return { x: JUNCTION.x + s * SCALE, y: JUNCTION.y };
  }
  const d = s * SCALE;
  return {
    x: JUNCTION.x + d * Math.cos(RAMP),
    y: JUNCTION.y - d * Math.sin(RAMP),
  };
}

function cartPose(s: number) {
  const surface = trackPoint(s);
  if (s <= 0) {
    return { x: surface.x, y: surface.y - CART_H / 2, rot: 0 };
  }
  const nx = -Math.sin(RAMP);
  const ny = -Math.cos(RAMP);
  return {
    x: surface.x + nx * (CART_H / 2),
    y: surface.y + ny * (CART_H / 2),
    rot: (-RAMP * 180) / Math.PI,
  };
}

function springPoints(sCart: number) {
  const sStart = -DEFAULT_ENERGY.A - 0.18;
  const sEnd = sCart - CART_W / (2 * SCALE);
  const steps = 28;
  const points: string[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const u = index / steps;
    const s = sStart + u * (sEnd - sStart);
    const surface = trackPoint(s);
    const onRamp = s > 0;
    const nx = onRamp ? -Math.sin(RAMP) : 0;
    const ny = onRamp ? -Math.cos(RAMP) : -1;
    const coil = (1 - u) * 4.2 * Math.sin(index * 1.15);
    points.push(`${surface.x + nx * 6 + (onRamp ? 0 : 0)},${surface.y + ny * 6 + coil}`);
  }
  return points.join(" ");
}

export function ConservationOfEnergyPreview({ running }: { running: boolean }) {
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const runningRef = useRef(running);
  const physicsPeriod = attachedLoopPeriod(DEFAULT_ENERGY);

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
      if (next >= VISUAL_PERIOD) {
        next = 0;
      }
      timeRef.current = next;
      setTime(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const sample = sampleAt(DEFAULT_ENERGY, (time / VISUAL_PERIOD) * physicsPeriod, "attached");
  const cart = cartPose(sample.s);
  const wall = trackPoint(-DEFAULT_ENERGY.A - 0.22);

  return (
    <svg viewBox="0 0 160 100" className="h-full w-full bg-muted text-navy" aria-hidden="true">
      <path d="M16 80 L86 80 L142 36" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <rect x={wall.x - 4} y={56} width="6" height="26" fill="#475569" />
      <polyline
        points={springPoints(sample.s)}
        fill="none"
        stroke="#A16207"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={-CART_W / 2}
        y={-CART_H / 2}
        width={CART_W}
        height={CART_H}
        fill="#1E3A5F"
        transform={`translate(${cart.x} ${cart.y}) rotate(${cart.rot})`}
      />
    </svg>
  );
}
