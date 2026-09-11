"use client";

import { useEffect, useRef, useState } from "react";

import { helixWire2D } from "@/lib/models/helical-spring";
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

function cartHitch(cart: { x: number; y: number; rot: number }) {
  const rad = (cart.rot * Math.PI) / 180;
  const localX = -CART_W / 2;
  const localY = -2.2;
  return {
    x: cart.x + localX * Math.cos(rad) - localY * Math.sin(rad),
    y: cart.y + localX * Math.sin(rad) + localY * Math.cos(rad),
  };
}

function polylinePoints(points: { x: number; y: number }[]) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
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
  const hitch = cartHitch(cart);
  const wallHitch = { x: 14, y: JUNCTION.y - CART_H / 2 - 2.2 };
  const coils = helixWire2D(wallHitch, hitch, 8, 4.1, 24, 0.78);
  const wire = polylinePoints(coils);

  return (
    <svg viewBox="0 0 160 100" className="h-full w-full bg-muted text-navy" aria-hidden="true">
      <path d="M16 80 L86 80 L142 36" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <rect x={8} y={54} width="6" height="28" fill="#475569" />
      <polyline
        points={wire}
        fill="none"
        stroke="#6b3f08"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <polyline
        points={wire}
        fill="none"
        stroke="#A16207"
        strokeWidth="1.05"
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
