"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { readPlayback } from "@/components/freeform/playback-bridge";
import { catalogEntry } from "@/lib/freeform/catalog";
import {
  addPart,
  cloneScene,
  isCanonical,
  presetFor,
  removePart,
  togglePart,
  updatePart,
} from "@/lib/freeform/scene";
import {
  advanceSandbox,
  createSandbox,
  evaluate,
  syncSandbox,
  type SandboxSample,
  type SandboxState,
} from "@/lib/freeform/sandbox";
import type { Part, PartType, SceneDocument } from "@/lib/freeform/types";

export type FreeformSeriesPoint = { t: number; x: number; v: number; ax: number };

type FreeformContextValue = {
  slug: string;
  scene: SceneDocument;
  preset: SceneDocument;
  diverged: boolean;
  playing: boolean;
  epoch: number;
  tab: "params" | "parts" | "problems";
  setTab: (tab: "params" | "parts" | "problems") => void;
  selectedId: string | null;
  select: (id: string | null) => void;
  sample: SandboxSample | null;
  series: FreeformSeriesPoint[];
  sandbox: SandboxState | null;
  add: (type: PartType) => void;
  update: (id: string, patch: Partial<Part>) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  play: () => void;
  pause: () => void;
  resetTime: () => void;
  resetOperations: () => void;
  resetBench: () => void;
};

const FreeformContext = createContext<FreeformContextValue | null>(null);

export function FreeformProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const preset = useMemo(() => presetFor(slug), [slug]);
  const [scene, setScene] = useState<SceneDocument>(preset);
  const [sandbox, setSandbox] = useState<SandboxState | null>(null);
  const [series, setSeries] = useState<FreeformSeriesPoint[]>([]);
  const [playing, setPlaying] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [tab, setTab] = useState<"params" | "parts" | "problems">("params");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sceneRef = useRef(scene);
  const sandboxRef = useRef(sandbox);
  const presetRef = useRef(preset);
  const divergedRef = useRef(false);
  sceneRef.current = scene;
  sandboxRef.current = sandbox;
  presetRef.current = preset;
  const diverged = sandbox !== null && !isCanonical(scene, preset);
  divergedRef.current = diverged;

  const commit = useCallback((next: SceneDocument) => {
    const canonical = isCanonical(next, presetRef.current);
    if (!canonical && !divergedRef.current) {
      const playback = readPlayback();
      playback?.pause();
      const created = createSandbox(next, {
        t: playback?.getTime() ?? 0,
        point: playback?.getPoint() ?? null,
        velocity: playback?.getVelocity() ?? null,
      });
      sandboxRef.current = created;
      divergedRef.current = true;
      setSandbox(created);
      setSeries([{ ...pointFrom(evaluate(next, created)) }]);
      setPlaying(false);
    } else if (canonical) {
      sandboxRef.current = null;
      divergedRef.current = false;
      setSandbox(null);
      setPlaying(false);
    } else if (sandboxRef.current) {
      const synced = syncSandbox(next, sandboxRef.current);
      sandboxRef.current = synced;
      setSandbox(synced);
    }
    sceneRef.current = next;
    setScene(next);
  }, []);

  useEffect(() => {
    if (!diverged || !playing) {
      return;
    }
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const current = sandboxRef.current;
      if (!current || !current.finite) {
        setPlaying(false);
        return;
      }
      const dt = last === 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (dt > 0) {
        const advanced = advanceSandbox(sceneRef.current, current, dt);
        sandboxRef.current = advanced;
        setSandbox(advanced);
        if (!advanced.finite) {
          setPlaying(false);
          return;
        }
        const sample = evaluate(sceneRef.current, advanced);
        setSeries((items) => {
          const next = [...items, pointFrom(sample)];
          return next.length > 400 ? next.slice(-400) : next;
        });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [diverged, playing]);

  const value = useMemo<FreeformContextValue>(() => {
    const sample = sandbox ? evaluate(scene, sandbox) : null;
    return {
      slug,
      scene,
      preset,
      diverged,
      playing,
      epoch,
      tab,
      setTab,
      selectedId,
      select: setSelectedId,
      sample,
      series,
      sandbox,
      add: (type) => {
        const next = addPart(sceneRef.current, type);
        commit(next);
        setSelectedId(next.parts.at(-1)?.id ?? null);
        setTab("parts");
      },
      update: (id, patch) => commit(updatePart(sceneRef.current, id, patch)),
      remove: (id) => {
        commit(removePart(sceneRef.current, id));
        setSelectedId((current) => (current === id ? null : current));
      },
      toggle: (id) => commit(togglePart(sceneRef.current, id)),
      play: () => {
        if (sandboxRef.current && !sandboxRef.current.finite) {
          return;
        }
        setPlaying(true);
      },
      pause: () => setPlaying(false),
      resetTime: () => {
        if (divergedRef.current) {
          const fresh = createSandbox(sceneRef.current);
          sandboxRef.current = fresh;
          setSandbox(fresh);
          setSeries([pointFrom(evaluate(sceneRef.current, fresh))]);
          setPlaying(false);
          return;
        }
        readPlayback()?.reset();
      },
      resetOperations: () => {
        const restored = cloneScene(presetRef.current);
        sceneRef.current = restored;
        sandboxRef.current = null;
        divergedRef.current = false;
        setScene(restored);
        setSandbox(null);
        setSeries([]);
        setPlaying(false);
        setSelectedId(null);
      },
      resetBench: () => {
        const restored = cloneScene(presetRef.current);
        sceneRef.current = restored;
        sandboxRef.current = null;
        divergedRef.current = false;
        setScene(restored);
        setSandbox(null);
        setSeries([]);
        setPlaying(false);
        setSelectedId(null);
        setTab("params");
        setEpoch((current) => current + 1);
      },
    };
  }, [commit, diverged, epoch, playing, preset, sandbox, scene, selectedId, series, slug, tab]);

  return <FreeformContext.Provider value={value}>{children}</FreeformContext.Provider>;
}

function pointFrom(sample: SandboxSample): FreeformSeriesPoint {
  return { t: sample.t, x: sample.x, v: sample.speed, ax: sample.ax };
}

export function useFreeformOptional() {
  return useContext(FreeformContext);
}

export function useFreeform() {
  const value = useFreeformOptional();
  if (!value) {
    throw new Error("自由搭建需要包在试验台里");
  }
  return value;
}

export function partLabel(type: PartType) {
  return catalogEntry(type).label;
}
