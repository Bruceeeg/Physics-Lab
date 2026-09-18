"use client";

import { View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { PreviewKindScene } from "@/components/catalog/previews/preview-scenes";
import type { PreviewKind } from "@/lib/experiments/catalog";

const SCROLL_IDLE_MS = 120;

type PreviewRuntime = {
  mounted: boolean;
  scrolling: boolean;
};

const PreviewRuntimeContext = createContext<PreviewRuntime>({
  mounted: false,
  scrolling: false,
});

let nextViewIndex = 2;

function PreviewCanvas({ scrolling }: { scrolling: boolean }) {
  return (
    <div className="catalog-preview-gl" aria-hidden="true">
      <Canvas
        style={{ width: "100%", height: "100%" }}
        dpr={scrolling ? 1 : 2}
        frameloop="always"
        resize={{ offsetSize: true }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}

export function useCatalogPreviewRuntime() {
  return useContext(PreviewRuntimeContext);
}

export function PreviewHost({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const scrollingRef = useRef(false);
  const idle = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const markScrolling = () => {
      if (!scrollingRef.current) {
        scrollingRef.current = true;
        setScrolling(true);
      }
      window.clearTimeout(idle.current);
      idle.current = window.setTimeout(() => {
        scrollingRef.current = false;
        setScrolling(false);
      }, SCROLL_IDLE_MS);
    };

    window.addEventListener("scroll", markScrolling, { passive: true, capture: true });
    window.addEventListener("wheel", markScrolling, { passive: true, capture: true });
    window.addEventListener("touchmove", markScrolling, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", markScrolling, { capture: true });
      window.removeEventListener("wheel", markScrolling, { capture: true });
      window.removeEventListener("touchmove", markScrolling, { capture: true });
      window.clearTimeout(idle.current);
    };
  }, []);

  const runtime = useMemo(
    () => ({ mounted, scrolling }),
    [mounted, scrolling],
  );

  return (
    <PreviewRuntimeContext.Provider value={runtime}>
      {mounted ? <PreviewCanvas scrolling={scrolling} /> : null}
      {children}
    </PreviewRuntimeContext.Provider>
  );
}

export function CatalogPreview3D({
  kind,
  slug,
  running,
  visible,
}: {
  kind: PreviewKind;
  slug: string;
  running: boolean;
  visible: boolean;
}) {
  const { mounted } = useCatalogPreviewRuntime();
  const index = useRef(0);
  if (index.current === 0) {
    index.current = nextViewIndex;
    nextViewIndex += 1;
  }

  if (!visible || !mounted) {
    return <div className="h-full w-full bg-[#cbd5e1]" aria-hidden="true" />;
  }

  return (
    <View className="h-full w-full bg-[#cbd5e1]" index={index.current} aria-hidden="true">
      <PreviewKindScene kind={kind} slug={slug} running={running} />
    </View>
  );
}
