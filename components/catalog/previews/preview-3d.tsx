"use client";

import { View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  configurePreviewCap,
  readPreviewCap,
  setPreviewsSuspended,
  usePreviewActivity,
} from "@/components/catalog/previews/preview-slots";
import {
  PreviewRuntimeContext,
  useCatalogPreviewRuntime,
} from "@/components/catalog/previews/preview-runtime";
import type { PreviewKind } from "@/lib/experiments/catalog";
import { catalogPreviewDpr } from "@/lib/experiments/preview-timing";
import { isUsableCanvasSize } from "@/lib/models/camera-fit";

const PreviewKindScene = dynamic(
  () => import("@/components/catalog/previews/preview-scenes").then((mod) => mod.PreviewKindScene),
  { ssr: false, loading: () => null },
);

const SCROLL_IDLE_MS = 120;

let nextViewIndex = 2;

function allocateViewIndex() {
  const index = nextViewIndex;
  nextViewIndex += 1;
  return index;
}

function subscribeMounted() {
  return () => {};
}

function getMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

function PreviewCanvas({
  frameloop,
  dpr,
}: {
  frameloop: "always" | "demand";
  dpr: number;
}) {
  return (
    <div className="catalog-preview-gl" aria-hidden="true">
      <Canvas
        style={{ width: "100%", height: "100%" }}
        dpr={dpr}
        frameloop={frameloop}
        resize={{ offsetSize: true }}
        gl={{
          antialias: false,
          alpha: true,
          depth: true,
          stencil: false,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}

export { useCatalogPreviewRuntime } from "@/components/catalog/previews/preview-runtime";

export function PreviewHost({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribeMounted, getMounted, getServerMounted);
  const [scrolling, setScrolling] = useState(false);
  const scrollingRef = useRef(false);
  const idle = useRef(0);
  const activity = usePreviewActivity();

  useEffect(() => {
    const onResize = () => {
      const nextCap = readPreviewCap();
      if (nextCap != null) {
        configurePreviewCap(nextCap);
      }
    };
    onResize();
    const onVisibility = () => setPreviewsSuspended(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);
    onVisibility();
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
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

  const frameloop = scrolling || activity.running > 0 ? "always" : "demand";
  const dpr = activity.cap <= 4 ? Math.min(catalogPreviewDpr(), 0.75) : catalogPreviewDpr();

  return (
    <PreviewRuntimeContext.Provider value={runtime}>
      {mounted && activity.live > 0 ? <PreviewCanvas frameloop={frameloop} dpr={dpr} /> : null}
      {children}
    </PreviewRuntimeContext.Provider>
  );
}

export function CatalogPreview3D({
  kind,
  slug,
  running,
  visible,
  hero = false,
}: {
  kind: PreviewKind;
  slug: string;
  running: boolean;
  visible: boolean;
  hero?: boolean;
}) {
  const { mounted } = useCatalogPreviewRuntime();
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [index] = useState(allocateViewIndex);

  useLayoutEffect(() => {
    const node = boxRef.current;
    if (!node) {
      return;
    }
    const sync = () => {
      const rect = node.getBoundingClientRect();
      setBox((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const show = visible && mounted && isUsableCanvasSize(box.width, box.height);

  return (
    <div ref={boxRef} className="h-full w-full bg-[#cbd5e1]" aria-hidden="true">
      {show ? (
        <View className="h-full w-full bg-[#cbd5e1]" data-preview-live="" index={index}>
          <PreviewKindScene kind={kind} slug={slug} running={running} hero={hero} />
        </View>
      ) : null}
    </div>
  );
}
