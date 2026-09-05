"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

// Single-line sprite label rasterised to a canvas texture. Same halo treatment
// as the pull-friction force labels: paper-coloured glyph stroke, no pill.
const SCALE = 4;
const FALLBACK_FONT = "ui-monospace, Menlo, monospace";
const HALO_OUTER = "#e2e8f0";
const HALO_INNER = "#f1f5f9";

type Vec3 = [number, number, number];

function labelFontFamily() {
  const custom = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-plex-mono")
    .trim();
  return custom ? `${custom}, ${FALLBACK_FONT}` : FALLBACK_FONT;
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const settle = () => {
      if (alive) {
        setReady(true);
      }
    };
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(settle, settle);
    } else {
      settle();
    }
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

function rasterLabel(text: string, color: string, family: string) {
  const font = `700 ${13 * SCALE}px ${family}`;
  const line = 13 * SCALE * 1.2;
  const pad = 3 * SCALE;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable");
  }

  ctx.font = font;
  const width = ctx.measureText(text).width;
  canvas.width = Math.ceil(width + pad * 2);
  canvas.height = Math.ceil(line + pad * 2);

  // Resizing the canvas resets context state.
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = HALO_OUTER;
  ctx.lineWidth = 2.6 * SCALE;
  ctx.strokeText(text, cx, cy);
  ctx.strokeStyle = HALO_INNER;
  ctx.lineWidth = 1.3 * SCALE;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 1;
  return { texture, aspect: canvas.width / canvas.height };
}

export function SpriteLabel({
  text,
  color,
  position,
  height = 0.3,
  renderOrder = 30,
}: {
  text: string;
  color: string;
  position: Vec3;
  height?: number;
  renderOrder?: number;
}) {
  const fontsReady = useFontsReady();
  const family = fontsReady ? labelFontFamily() : FALLBACK_FONT;
  const raster = useMemo(() => rasterLabel(text, color, family), [text, color, family]);
  useEffect(() => () => raster.texture.dispose(), [raster]);

  return (
    <sprite
      position={position}
      scale={[height * raster.aspect, height, 1]}
      renderOrder={renderOrder}
      frustumCulled={false}
    >
      <spriteMaterial
        map={raster.texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}
